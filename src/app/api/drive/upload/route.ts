import { logActivity } from "@/lib/activity";
import { uploadDriveFile } from "@/lib/drive";
import { ApiError, requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const formData = await request.formData();
    const folderId = formData.get("folderId")?.toString();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!files.length) {
      throw new ApiError("No files were provided", 422);
    }

    const uploaded = [];

    for (const file of files) {
      const result = await uploadDriveFile(userId, file, folderId, request);
      uploaded.push(result);
      await logActivity({
        userId,
        action: "upload",
        fileId: result.id,
        fileName: result.name,
      });
    }

    return Response.json({ files: uploaded });
  } catch (error) {
    return toErrorResponse(error);
  }
}
