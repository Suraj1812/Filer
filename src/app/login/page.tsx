import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/components/LoginPanel";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return {
    alternates: {
      canonical: `${baseUrl}/login`,
    },
    description:
      "Sign in to Filer to upload, browse, share, and organize files in your own Google Drive.",
    openGraph: {
      description:
        "Sign in to Filer to upload, browse, share, and organize files in your own Google Drive.",
      title: "Sign in",
      url: `${baseUrl}/login`,
    },
    title: "Sign in",
  };
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LoginPanel />;
}
