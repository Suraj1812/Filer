import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DriveManager } from "@/components/DriveManager";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FoldersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <DriveManager title="Folders" view="folders" />
    </AppShell>
  );
}
