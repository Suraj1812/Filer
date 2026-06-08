import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { shareDriveFile } from "@/lib/drive";
import { requireUserId, toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  anyone: z.boolean().default(false),
  email: z.string().trim().email().or(z.literal("")).optional(),
  fileId: z.string().trim().min(1),
  name: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const input = schema.parse(await request.json());
    const file = await shareDriveFile({
      userId,
      fileId: input.fileId,
      email: input.email || undefined,
      anyone: input.anyone,
    });

    await logActivity({
      userId,
      action: "share",
      fileId: file.id,
      fileName: input.name ?? file.name,
      metadata: {
        anyone: input.anyone,
        email: input.email || null,
      },
    });

    return Response.json({ file });
  } catch (error) {
    return toErrorResponse(error);
  }
}
