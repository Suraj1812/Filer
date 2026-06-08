import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { SettingsPanel } from "@/components/SettingsPanel";
import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const prisma = getPrisma();
  const [settings, activity] = await Promise.all([
    prisma.appSettings
      .findUnique({
        where: { userId: session.user.id },
      })
      .catch(() => null),
    prisma.activityLog
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        where: { userId: session.user.id },
      })
      .catch(() => []),
  ]);

  return (
    <AppShell>
      <SettingsPanel
        activity={activity.map((item) => ({
          action: item.action,
          createdAt: item.createdAt.toISOString(),
          fileName: item.fileName,
          id: item.id,
        }))}
        appFolderMode={settings?.appFolderMode ?? true}
        user={session.user}
      />
    </AppShell>
  );
}
