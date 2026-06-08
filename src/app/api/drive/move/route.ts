import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { moveDriveFile } from "@/lib/drive";
import { requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fileId: z.string().trim().min(1),
  name: z.string().trim().optional(),
  toFolderId: z.string().trim().min(1).default("root"),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = schema.parse(await request.json());
    const file = await moveDriveFile(
      userId,
      input.fileId,
      input.toFolderId,
      request,
    );

    await logActivity({
      userId,
      action: "move",
      fileId: file.id,
      fileName: input.name ?? file.name,
      metadata: { toFolderId: input.toFolderId },
    });

    return Response.json({ file });
  } catch (error) {
    return toErrorResponse(error);
  }
}
