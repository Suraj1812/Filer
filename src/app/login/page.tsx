import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/LoginPanel";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginPanel />;
}
