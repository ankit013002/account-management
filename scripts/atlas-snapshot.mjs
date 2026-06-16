import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/account-management";
const COLLECTIONS = ["accounts", "audit_events"];
const ALGORITHM = "aes-256-gcm";
const SNAPSHOT_VERSION = 1;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    const startsWithQuote = value.startsWith('"') || value.startsWith("'");
    const endsWithMatchingQuote =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));

    if (startsWithQuote && !endsWithMatchingQuote) {
      throw new Error(
        `${key} starts with a quote but does not end with the same quote in .env.local.`,
      );
    }

    if (endsWithMatchingQuote) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("ENCRYPTION_KEY is required to create or restore snapshots.");
  }
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string.");
  }
  return Buffer.from(keyHex, "hex");
}

function encryptSnapshot(payload) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);

  return {
    version: SNAPSHOT_VERSION,
    algorithm: ALGORITHM,
    iv: iv.toString("hex"),
    authTag: cipher.getAuthTag().toString("hex"),
    data: encrypted.toString("hex"),
  };
}

function decryptSnapshot(snapshot) {
  if (snapshot.version !== SNAPSHOT_VERSION || snapshot.algorithm !== ALGORITHM) {
    throw new Error("Unsupported snapshot format.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(snapshot.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(snapshot.authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(snapshot.data, "hex")),
    decipher.final(),
  ]);
  const payload = JSON.parse(decrypted.toString("utf8"));

  if (!payload.collections || typeof payload.collections !== "object") {
    throw new Error("Invalid snapshot payload.");
  }

  return payload;
}

function assertAtlasUri(uri) {
  const normalizedUri = uri.trim().toLowerCase();
  if (
    !normalizedUri.startsWith("mongodb+srv://") &&
    !(normalizedUri.startsWith("mongodb://") && normalizedUri.includes(".mongodb.net"))
  ) {
    throw new Error("MONGODB_URI must point at MongoDB Atlas.");
  }
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : process.argv[index + 1] ?? "";
}

function isApply() {
  return process.argv.includes("--apply");
}

async function readCollections(connection) {
  const collections = {};
  for (const collectionName of COLLECTIONS) {
    collections[collectionName] = await connection
      .collection(collectionName)
      .find({})
      .toArray();
  }
  return collections;
}

async function writeCollections(connection, collections, apply) {
  for (const collectionName of COLLECTIONS) {
    const docs = collections[collectionName] ?? [];
    if (!apply) {
      console.log(`${collectionName}: ${docs.length} read, 0 written`);
      continue;
    }

    if (docs.length === 0) {
      console.log(`${collectionName}: 0 read, 0 written`);
      continue;
    }

    const operations = docs.map((doc) => {
      const replacement = { ...doc };
      delete replacement._id;
      return {
        replaceOne: {
          filter: { id: doc.id },
          replacement,
          upsert: true,
        },
      };
    });

    const result = await connection
      .collection(collectionName)
      .bulkWrite(operations, { ordered: false });

    console.log(
      `${collectionName}: ${docs.length} read, ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
    );
  }
}

async function createSnapshot(projectRoot) {
  const atlasUri = process.env.MONGODB_URI;
  if (!atlasUri) throw new Error("MONGODB_URI is required.");
  assertAtlasUri(atlasUri);

  const atlasConnection = await mongoose.createConnection(atlasUri).asPromise();
  try {
    const collections = await readCollections(atlasConnection.db);
    const payload = {
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      source: {
        database: atlasConnection.name,
        collections: COLLECTIONS,
      },
      collections,
    };
    const encrypted = encryptSnapshot(payload);
    const snapshotsDir = path.join(projectRoot, "data", "snapshots");
    fs.mkdirSync(snapshotsDir, { recursive: true });
    const stamp = payload.exportedAt.replace(/[:.]/g, "-");
    const filePath = path.join(
      snapshotsDir,
      `atlas-snapshot-${atlasConnection.name}-${stamp}.json`,
    );
    fs.writeFileSync(filePath, `${JSON.stringify(encrypted, null, 2)}\n`);

    for (const collectionName of COLLECTIONS) {
      console.log(`${collectionName}: ${collections[collectionName].length} exported`);
    }
    console.log(filePath);
  } finally {
    await atlasConnection.close();
  }
}

async function restoreLocalSnapshot() {
  const fileArg = getArg("--file");
  if (!fileArg) {
    throw new Error("Pass --file path/to/snapshot.json to restore a snapshot.");
  }

  const snapshot = JSON.parse(fs.readFileSync(fileArg, "utf8"));
  const payload = decryptSnapshot(snapshot);
  const localUri =
    process.env.MONGODB_LOCAL_URI ||
    process.env.LOCAL_MONGODB_URI ||
    DEFAULT_LOCAL_URI;
  const localConnection = await mongoose.createConnection(localUri).asPromise();

  try {
    console.log(isApply() ? "Restoring snapshot to local MongoDB..." : "Dry run only.");
    console.log(`Source snapshot: ${payload.source?.database ?? "unknown"}`);
    console.log(`Target: ${localConnection.name}`);
    await writeCollections(localConnection.db, payload.collections, isApply());
    if (!isApply()) {
      console.log("Run again with --apply to write these records to local MongoDB.");
    }
  } finally {
    await localConnection.close();
  }
}

async function main() {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  loadEnvFile(path.join(projectRoot, ".env.local"));

  const command = process.argv[2];
  if (command === "create") {
    await createSnapshot(projectRoot);
    return;
  }
  if (command === "restore-local") {
    await restoreLocalSnapshot();
    return;
  }

  throw new Error(
    "Use `create` to snapshot Atlas or `restore-local --file path/to/snapshot.json` to restore local MongoDB.",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
