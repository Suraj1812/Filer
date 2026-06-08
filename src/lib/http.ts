import { auth } from "@/lib/auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError("Unauthorized", 401);
  }

  return session.user.id;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: error.status },
    );
  }

  console.error(error);
  return Response.json({ error: "Unexpected server error" }, { status: 500 });
}
