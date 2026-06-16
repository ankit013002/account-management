const ENCRYPTION_KEY_BYTES = 32;
const ENCRYPTION_KEY_HEX_LENGTH = ENCRYPTION_KEY_BYTES * 2;

export function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;

  if (!keyHex) {
    throw new Error(
      `ENCRYPTION_KEY is required. Generate a ${ENCRYPTION_KEY_HEX_LENGTH}-character hex key before storing passwords.`,
    );
  }

  if (!/^[0-9a-fA-F]+$/.test(keyHex) || keyHex.length !== ENCRYPTION_KEY_HEX_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be a ${ENCRYPTION_KEY_HEX_LENGTH}-character hex string.`,
    );
  }

  return Buffer.from(keyHex, "hex");
}
