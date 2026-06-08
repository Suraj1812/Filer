import { google } from "googleapis";
import { Readable } from "stream";
import type { ReadableStream as NodeReadableStream } from "stream/web";
import {
  folderMimeType,
  type DriveFile,
  type DriveListView,
} from "@/lib/drive-shared";
import { ApiError } from "@/lib/http";
import { getPrisma } from "@/lib/prisma";

type ListParams = {
  folderId?: string;
  pageToken?: string;
  search?: string;
  view?: DriveListView;
};

type UserDriveContext = Awaited<ReturnType<typeof getDriveForUser>>;

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function cleanFolderId(folderId?: string | null) {
  return folderId?.trim() || "root";
}

function fileFields() {
  return [
    "id",
    "name",
    "mimeType",
    "size",
    "createdTime",
    "modifiedTime",
    "webViewLink",
    "webContentLink",
    "iconLink",
    "parents",
    "shared",
    "starred",
  ].join(",");
}

function normalizeFile(file: DriveFile): DriveFile {
  return {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size ?? null,
    createdTime: file.createdTime ?? null,
    modifiedTime: file.modifiedTime ?? null,
    webViewLink: file.webViewLink ?? null,
    webContentLink: file.webContentLink ?? null,
    iconLink: file.iconLink ?? null,
    parents: file.parents ?? [],
    shared: file.shared ?? false,
    starred: file.starred ?? false,
  };
}

export async function getDriveForUser(userId: string) {
  const prisma = getPrisma();
  const account = await prisma.account.findFirst({
    where: {
      provider: "google",
      userId,
    },
  });

  if (!account?.access_token && !account?.refresh_token) {
    throw new ApiError("Google Drive is not connected", 403);
  }

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  auth.setCredentials({
    access_token: account.access_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    refresh_token: account.refresh_token ?? undefined,
    scope: account.scope ?? undefined,
    token_type: account.token_type ?? undefined,
  });

  auth.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? undefined,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : undefined,
        refresh_token: tokens.refresh_token ?? undefined,
        scope: tokens.scope ?? undefined,
        token_type: tokens.token_type ?? undefined,
      },
    });
  });

  return google.drive({ version: "v3", auth });
}

async function ensureAppFolder(userId: string, drive: UserDriveContext) {
  const prisma = getPrisma();
  const settings = await prisma.appSettings.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  if (!settings.appFolderMode) {
    return null;
  }

  if (settings.appFolderId) {
    return settings.appFolderId;
  }

  const existing = await drive.files.list({
    fields: "files(id,name,mimeType)",
    pageSize: 1,
    q: [
      "'root' in parents",
      "trashed = false",
      `mimeType = '${folderMimeType}'`,
      "name = 'Filer'",
    ].join(" and "),
    supportsAllDrives: true,
  });

  const existingFolderId = existing.data.files?.[0]?.id;

  if (existingFolderId) {
    await prisma.appSettings.update({
      where: { userId },
      data: { appFolderId: existingFolderId },
    });

    return existingFolderId;
  }

  const created = await drive.files.create({
    fields: "id",
    requestBody: {
      mimeType: folderMimeType,
      name: "Filer",
      parents: ["root"],
    },
    supportsAllDrives: true,
  });

  if (!created.data.id) {
    throw new ApiError("Unable to create app folder", 500);
  }

  await prisma.appSettings.update({
    where: { userId },
    data: { appFolderId: created.data.id },
  });

  return created.data.id;
}

async function resolveFolderId(
  userId: string,
  drive: UserDriveContext,
  folderId?: string | null,
) {
  const cleaned = cleanFolderId(folderId);

  if (cleaned !== "root") {
    return cleaned;
  }

  return (await ensureAppFolder(userId, drive)) ?? "root";
}

export async function listDriveFiles(userId: string, params: ListParams) {
  const drive = await getDriveForUser(userId);
  const folderId = await resolveFolderId(userId, drive, params.folderId);
  const query = [`'${escapeDriveQuery(folderId)}' in parents`, "trashed = false"];

  if (params.search?.trim()) {
    query.push(`name contains '${escapeDriveQuery(params.search.trim())}'`);
  }

  if (params.view === "files") {
    query.push(`mimeType != '${folderMimeType}'`);
  }

  if (params.view === "folders") {
    query.push(`mimeType = '${folderMimeType}'`);
  }

  const response = await drive.files.list({
    fields: `nextPageToken, files(${fileFields()})`,
    orderBy: "folder,modifiedTime desc,name",
    pageSize: 100,
    pageToken: params.pageToken,
    q: query.join(" and "),
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return {
    files: (response.data.files ?? []).map((file) =>
      normalizeFile(file as DriveFile),
    ),
    nextPageToken: response.data.nextPageToken ?? null,
  };
}

export async function uploadDriveFile(
  userId: string,
  file: File,
  parentId?: string | null,
) {
  const drive = await getDriveForUser(userId);
  const folderId = await resolveFolderId(userId, drive, parentId);
  const body = Readable.fromWeb(
    file.stream() as unknown as NodeReadableStream<Uint8Array>,
  );

  const response = await drive.files.create({
    fields: fileFields(),
    media: {
      body,
      mimeType: file.type || "application/octet-stream",
    },
    requestBody: {
      name: file.name,
      parents: [folderId],
    },
    supportsAllDrives: true,
  });

  return normalizeFile(response.data as DriveFile);
}

export async function createDriveFolder(
  userId: string,
  name: string,
  parentId?: string | null,
) {
  const drive = await getDriveForUser(userId);
  const folderId = await resolveFolderId(userId, drive, parentId);
  const response = await drive.files.create({
    fields: fileFields(),
    requestBody: {
      mimeType: folderMimeType,
      name,
      parents: [folderId],
    },
    supportsAllDrives: true,
  });

  return normalizeFile(response.data as DriveFile);
}

export async function renameDriveFile(
  userId: string,
  fileId: string,
  name: string,
) {
  const drive = await getDriveForUser(userId);
  const response = await drive.files.update({
    fileId,
    fields: fileFields(),
    requestBody: { name },
    supportsAllDrives: true,
  });

  return normalizeFile(response.data as DriveFile);
}

export async function trashDriveFile(userId: string, fileId: string) {
  const drive = await getDriveForUser(userId);
  const response = await drive.files.update({
    fileId,
    fields: fileFields(),
    requestBody: { trashed: true },
    supportsAllDrives: true,
  });

  return normalizeFile(response.data as DriveFile);
}

export async function moveDriveFile(
  userId: string,
  fileId: string,
  toFolderId?: string | null,
) {
  const drive = await getDriveForUser(userId);
  const folderId = await resolveFolderId(userId, drive, toFolderId);
  const current = await drive.files.get({
    fileId,
    fields: "parents",
    supportsAllDrives: true,
  });

  const response = await drive.files.update({
    addParents: folderId,
    fileId,
    fields: fileFields(),
    removeParents: current.data.parents?.join(","),
    supportsAllDrives: true,
  });

  return normalizeFile(response.data as DriveFile);
}

export async function shareDriveFile(input: {
  userId: string;
  fileId: string;
  email?: string | null;
  anyone?: boolean;
}) {
  const drive = await getDriveForUser(input.userId);
  const email = input.email?.trim();

  await drive.permissions.create({
    fileId: input.fileId,
    requestBody:
      input.anyone || !email
        ? {
            role: "reader",
            type: "anyone",
          }
        : {
            emailAddress: email,
            role: "reader",
            type: "user",
          },
    sendNotificationEmail: Boolean(email && !input.anyone),
    supportsAllDrives: true,
  });

  const response = await drive.files.get({
    fileId: input.fileId,
    fields: fileFields(),
    supportsAllDrives: true,
  });

  return normalizeFile(response.data as DriveFile);
}

export function getExportMimeType(mimeType?: string | null) {
  if (mimeType === "application/vnd.google-apps.document") {
    return { extension: "pdf", mimeType: "application/pdf" };
  }

  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    return {
      extension: "xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }

  if (mimeType === "application/vnd.google-apps.presentation") {
    return {
      extension: "pptx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };
  }

  return null;
}
