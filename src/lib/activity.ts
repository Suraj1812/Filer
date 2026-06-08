import { getPrisma } from "@/lib/prisma";

type ActivityMetadata = Record<string, string | number | boolean | null>;

export async function logActivity(input: {
  userId: string;
  action: string;
  fileId?: string;
  fileName?: string;
  metadata?: ActivityMetadata;
}) {
  try {
    await getPrisma().activityLog.create({
      data: input,
    });
  } catch (error) {
    console.error("Unable to write activity log", error);
  }
}
