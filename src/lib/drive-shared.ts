export const folderMimeType = "application/vnd.google-apps.folder";

export type DriveListView = "all" | "files" | "folders";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  modifiedTime?: string | null;
  createdTime?: string | null;
  webViewLink?: string | null;
  webContentLink?: string | null;
  iconLink?: string | null;
  parents?: string[] | null;
  shared?: boolean | null;
  starred?: boolean | null;
};

export function isDriveFolder(file: DriveFile) {
  return file.mimeType === folderMimeType;
}
