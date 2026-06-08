import type { DriveListView } from "@/lib/drive-shared";
import { listDriveFiles } from "@/lib/drive";
import { requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") as DriveListView | null;

    const data = await listDriveFiles(
      userId,
      {
        folderId: searchParams.get("folderId") ?? undefined,
        pageToken: searchParams.get("pageToken") ?? undefined,
        search: searchParams.get("q") ?? undefined,
        view: view === "files" || view === "folders" ? view : "all",
      },
      request,
    );

    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
