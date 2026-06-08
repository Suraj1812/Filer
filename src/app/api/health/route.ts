import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    authUrl: Boolean(process.env.AUTH_URL || process.env.NEXTAUTH_URL),
    database: false,
    googleOAuth: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
  };

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  const healthy = checks.authUrl && checks.googleOAuth;

  return Response.json(
    {
      checks,
      databaseRequiredForLogin: false,
      ok: healthy,
    },
    { status: healthy ? 200 : 503 },
  );
}
