import { UNLOCK_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = Response.json({ locked: true });
  response.headers.append(
    "Set-Cookie",
    `${UNLOCK_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
  );
  return response;
}
