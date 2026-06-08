import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeRedirectTo(request: Request) {
  const requestUrl = new URL(request.url);
  const callbackUrl = requestUrl.searchParams.get("callbackUrl");

  if (!callbackUrl) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(callbackUrl, requestUrl.origin);

    if (parsed.origin !== requestUrl.origin) {
      return "/dashboard";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard";
  }
}

export async function GET(request: Request) {
  const redirectTo = safeRedirectTo(request);

  await signIn("google", { redirectTo });
  redirect(redirectTo);
}
