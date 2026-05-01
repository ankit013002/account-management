import { createHash, createHmac, timingSafeEqual } from "crypto";

export const UNLOCK_COOKIE = "vault_unlocked";
export const UNLOCK_MAX_AGE_SECONDS = 60 * 60 * 8;

export function getMasterPasswordHash(): string {
  if (process.env.MASTER_PASSWORD_HASH) {
    return process.env.MASTER_PASSWORD_HASH.toLowerCase();
  }
  if (process.env.MASTER_PASSWORD) {
    return hashPassword(process.env.MASTER_PASSWORD);
  }
  return "";
}

export function isMasterLockConfigured(): boolean {
  return getMasterPasswordHash().length === 64;
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.ENCRYPTION_KEY ||
    "account-management-development-auth-secret"
  );
}

export function signUnlockToken(masterHash = getMasterPasswordHash()): string {
  return createHmac("sha256", getAuthSecret()).update(masterHash).digest("hex");
}

export function isValidPassword(password: string): boolean {
  const expected = getMasterPasswordHash();
  const actual = hashPassword(password);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}
