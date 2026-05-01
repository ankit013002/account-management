import {
  UNLOCK_COOKIE,
  UNLOCK_MAX_AGE_SECONDS,
  isMasterLockConfigured,
  isValidPassword,
  signUnlockToken,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ configured: isMasterLockConfigured() });
}

export async function POST(request: Request) {
  if (!isMasterLockConfigured()) {
    return Response.json({ unlocked: true, configured: false });
  }

  const body = (await request.json()) as { password?: string };
  if (!body.password || !isValidPassword(body.password)) {
    return Response.json({ error: "Invalid master password" }, { status: 401 });
  }

  const response = Response.json({ unlocked: true, configured: true });
  response.headers.append(
    "Set-Cookie",
    `${UNLOCK_COOKIE}=${signUnlockToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${UNLOCK_MAX_AGE_SECONDS}`,
  );
  return response;
}
