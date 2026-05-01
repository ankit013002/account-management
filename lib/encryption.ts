import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64) {
    return Buffer.from(keyHex, "hex");
  }
  // Fallback: derive a consistent 32-byte key from a fixed string
  // In production, always set ENCRYPTION_KEY in .env.local
  return Buffer.from("account-mgmt-default-key-32bytes", "utf8");
}

export function encrypt(text: string): string {
  if (!text) return "";
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decrypt(encryptedData: string): string {
  if (!encryptedData) return "";
  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    // Not encrypted, return as-is (legacy data)
    return encryptedData;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
