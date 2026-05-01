import { NextRequest, NextResponse } from "next/server";

const UNLOCK_COOKIE = "vault_unlocked";

function getMasterPasswordHash(): string {
  const hash = process.env.MASTER_PASSWORD_HASH?.toLowerCase();
  if (hash) return hash;
  return "";
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function getExpectedToken(): Promise<string> {
  let masterHash = getMasterPasswordHash();
  if (!masterHash && process.env.MASTER_PASSWORD) {
    masterHash = await sha256Hex(process.env.MASTER_PASSWORD);
  }
  if (!masterHash) return "";

  const secret =
    process.env.AUTH_SECRET ||
    process.env.ENCRYPTION_KEY ||
    "account-management-development-auth-secret";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(masterHash),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/unlock" ||
    pathname === "/api/unlock" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

export async function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const expectedToken = await getExpectedToken();
  if (!expectedToken) {
    return NextResponse.next();
  }

  const currentToken = request.cookies.get(UNLOCK_COOKIE)?.value;
  if (currentToken === expectedToken) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Vault is locked" }, { status: 423 });
  }

  return NextResponse.redirect(new URL("/unlock", request.url));
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
