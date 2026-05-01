import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { Account } from "./db";

const ALGORITHM = "aes-256-gcm";

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  accounts: Account[];
}

export interface EncryptedBackup {
  version: 1;
  algorithm: typeof ALGORITHM;
  iv: string;
  authTag: string;
  data: string;
}

function getBackupKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64) {
    return Buffer.from(keyHex, "hex");
  }
  return Buffer.from("account-mgmt-default-key-32bytes", "utf8");
}

export function encryptBackup(payload: BackupPayload): EncryptedBackup {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getBackupKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  return {
    version: 1,
    algorithm: ALGORITHM,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
    data: encrypted.toString("hex"),
  };
}

export function decryptBackup(backup: EncryptedBackup): BackupPayload {
  if (backup.version !== 1 || backup.algorithm !== ALGORITHM) {
    throw new Error("Unsupported backup format");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getBackupKey(),
    Buffer.from(backup.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(backup.authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(backup.data, "hex")),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString("utf8")) as BackupPayload;

  if (!Array.isArray(payload.accounts)) {
    throw new Error("Invalid backup payload");
  }
  return payload;
}
