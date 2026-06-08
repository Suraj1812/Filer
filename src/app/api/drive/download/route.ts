import { Readable } from "stream";
import { getDriveForUser, getExportMimeType } from "@/lib/drive";
import { ApiError, requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(name: string) {
  return name.replace(/["\r\n]/g, "").trim() || "download";
}

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const fileId = new URL(request.url).searchParams.get("fileId");

    if (!fileId) {
      throw new ApiError("fileId is required", 422);
    }

    const drive = await getDriveForUser(userId);
    const metadata = await drive.files.get({
      fileId,
      fields: "name,mimeType",
      supportsAllDrives: true,
    });

    const name = safeFileName(metadata.data.name ?? "download");
    const exportTarget = getExportMimeType(metadata.data.mimeType);

    if (exportTarget) {
      const response = await drive.files.export(
        {
          fileId,
          mimeType: exportTarget.mimeType,
        },
        { responseType: "stream" },
      );

      const stream = Readable.toWeb(response.data as Readable);
      return new Response(stream as ReadableStream, {
        headers: {
          "Content-Disposition": `attachment; filename="${name}.${exportTarget.extension}"`,
          "Content-Type": exportTarget.mimeType,
        },
      });
    }

    const response = await drive.files.get(
      {
        alt: "media",
        fileId,
        supportsAllDrives: true,
      },
      { responseType: "stream" },
    );

    const stream = Readable.toWeb(response.data as Readable);
    return new Response(stream as ReadableStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Type":
          metadata.data.mimeType ?? response.headers["content-type"] ?? "application/octet-stream",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
