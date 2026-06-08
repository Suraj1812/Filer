import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { trashDriveFile } from "@/lib/drive";
import { requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fileId: z.string().trim().min(1),
  name: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = schema.parse(await request.json());
    const file = await trashDriveFile(userId, input.fileId, request);

    await logActivity({
      userId,
      action: "delete",
      fileId: input.fileId,
      fileName: input.name ?? file.name,
    });

    return Response.json({ file });
  } catch (error) {
    return toErrorResponse(error);
  }
}
