import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { renameDriveFile } from "@/lib/drive";
import { requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  fileId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(240),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = schema.parse(await request.json());
    const file = await renameDriveFile(userId, input.fileId, input.name, request);

    await logActivity({
      userId,
      action: "rename",
      fileId: file.id,
      fileName: file.name,
    });

    return Response.json({ file });
  } catch (error) {
    return toErrorResponse(error);
  }
}
