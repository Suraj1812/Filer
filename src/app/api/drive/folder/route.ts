import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { createDriveFolder } from "@/lib/drive";
import { requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = schema.parse(await request.json());
    const folder = await createDriveFolder(userId, input.name, input.parentId);

    await logActivity({
      userId,
      action: "create_folder",
      fileId: folder.id,
      fileName: folder.name,
    });

    return Response.json({ file: folder });
  } catch (error) {
    return toErrorResponse(error);
  }
}
