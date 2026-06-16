import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { getEncryptionKey } from "./secrets";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/account-management";
const COLLECTIONS = ["accounts", "audit_events"] as const;
const ALGORITHM = "aes-256-gcm";
const SNAPSHOT_VERSION = 1;

type CollectionName = (typeof COLLECTIONS)[number];
type SnapshotCollections = Record<CollectionName, Record<string, unknown>[]>;

interface SnapshotPayload {
  version: 1;
  exportedAt: string;
  source: {
    database: string;
    collections: readonly CollectionName[];
  };
  collections: SnapshotCollections;
}

interface EncryptedSnapshot {
  version: 1;
  algorithm: typeof ALGORITHM;
  iv: string;
  authTag: string;
  data: string;
}

export interface SnapshotCollectionSummary {
  count: number;
  latestTimestamp: string;
}

export interface SnapshotStatus {
  atlas: {
    database: string;
    collections: Record<CollectionName, SnapshotCollectionSummary>;
    error?: string;
  } | null;
  local: {
    database: string;
    collections: Record<CollectionName, SnapshotCollectionSummary>;
    error?: string;
  } | null;
  latestSnapshot: {
    fileName: string;
    exportedAt: string;
    sourceDatabase: string;
    collections: Record<CollectionName, SnapshotCollectionSummary>;
  } | null;
  snapshotMatchesAtlas: boolean;
  localMatchesSnapshot: boolean;
}

export interface RestoreSummary {
  collectionName: CollectionName;
  read: number;
  upserted: number;
  modified: number;
}

function getProjectRoot() {
  return process.cwd();
}

function getSnapshotsDir() {
  return path.join(getProjectRoot(), "data", "snapshots");
}

function getAtlasUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  return uri;
}

function getLocalUri() {
  return (
    process.env.MONGODB_LOCAL_URI ||
    process.env.LOCAL_MONGODB_URI ||
    DEFAULT_LOCAL_URI
  );
}

function assertAtlasUri(uri: string) {
  const normalizedUri = uri.trim().toLowerCase();
  if (
    !normalizedUri.startsWith("mongodb+srv://") &&
    !(normalizedUri.startsWith("mongodb://") && normalizedUri.includes(".mongodb.net"))
  ) {
    throw new Error("MONGODB_URI must point at MongoDB Atlas.");
  }
}

function emptyCollections(): Record<CollectionName, SnapshotCollectionSummary> {
  return {
    accounts: { count: 0, latestTimestamp: "" },
    audit_events: { count: 0, latestTimestamp: "" },
  };
}

function getDocTimestamp(doc: Record<string, unknown>) {
  const updatedAt = typeof doc.updatedAt === "string" ? doc.updatedAt : "";
  const createdAt = typeof doc.createdAt === "string" ? doc.createdAt : "";
  return updatedAt || createdAt;
}

function summarizeDocs(docs: Record<string, unknown>[]) {
  return {
    count: docs.length,
    latestTimestamp: docs.reduce((latest, doc) => {
      const timestamp = getDocTimestamp(doc);
      return timestamp > latest ? timestamp : latest;
    }, ""),
  };
}

function summarizeCollections(collections: SnapshotCollections) {
  return COLLECTIONS.reduce(
    (summary, collectionName) => ({
      ...summary,
      [collectionName]: summarizeDocs(collections[collectionName] ?? []),
    }),
    emptyCollections(),
  );
}

async function readCollections(connection: mongoose.Connection) {
  const collections = {} as SnapshotCollections;
  for (const collectionName of COLLECTIONS) {
    collections[collectionName] = await connection
      .collection(collectionName)
      .find({})
      .toArray();
  }
  return collections;
}

function encryptSnapshot(payload: SnapshotPayload): EncryptedSnapshot {
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

function decryptSnapshot(snapshot: EncryptedSnapshot): SnapshotPayload {
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
  const payload = JSON.parse(decrypted.toString("utf8")) as SnapshotPayload;

  if (!payload.collections || typeof payload.collections !== "object") {
    throw new Error("Invalid snapshot payload.");
  }

  return payload;
}

async function getSnapshotFiles() {
  try {
    const entries = await fs.readdir(getSnapshotsDir(), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.join(getSnapshotsDir(), entry.name))
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function readSnapshotFile(filePath: string) {
  const contents = await fs.readFile(filePath, "utf8");
  return decryptSnapshot(JSON.parse(contents) as EncryptedSnapshot);
}

async function getLatestSnapshot() {
  const files = await getSnapshotFiles();
  if (files.length === 0) return null;

  const filePath = files.at(-1);
  if (!filePath) return null;

  const payload = await readSnapshotFile(filePath);
  return {
    filePath,
    fileName: path.basename(filePath),
    payload,
  };
}

function summariesMatch(
  first: Record<CollectionName, SnapshotCollectionSummary>,
  second: Record<CollectionName, SnapshotCollectionSummary>,
) {
  return COLLECTIONS.every(
    (collectionName) =>
      first[collectionName].count === second[collectionName].count &&
      first[collectionName].latestTimestamp ===
        second[collectionName].latestTimestamp,
  );
}

async function getConnectionSummary(uri: string, requireAtlas: boolean) {
  if (requireAtlas) assertAtlasUri(uri);

  const connection = await mongoose.createConnection(uri).asPromise();
  try {
    const collections = await readCollections(connection);
    return {
      database: connection.name,
      collections: summarizeCollections(collections),
    };
  } finally {
    await connection.close();
  }
}

export async function getSnapshotStatus(): Promise<SnapshotStatus> {
  const [atlasResult, localResult, latestSnapshot] = await Promise.allSettled([
    getConnectionSummary(getAtlasUri(), true),
    getConnectionSummary(getLocalUri(), false),
    getLatestSnapshot(),
  ]);

  const atlas =
    atlasResult.status === "fulfilled"
      ? atlasResult.value
      : {
          database: "",
          collections: emptyCollections(),
          error:
            atlasResult.reason instanceof Error
              ? atlasResult.reason.message
              : "Could not read Atlas.",
        };
  const local =
    localResult.status === "fulfilled"
      ? localResult.value
      : {
          database: "",
          collections: emptyCollections(),
          error:
            localResult.reason instanceof Error
              ? localResult.reason.message
              : "Could not read local MongoDB.",
        };

  const snapshot =
    latestSnapshot.status === "fulfilled" ? latestSnapshot.value : null;
  const latestSnapshotSummary = snapshot
    ? {
        fileName: snapshot.fileName,
        exportedAt: snapshot.payload.exportedAt,
        sourceDatabase: snapshot.payload.source.database,
        collections: summarizeCollections(snapshot.payload.collections),
      }
    : null;

  return {
    atlas,
    local,
    latestSnapshot: latestSnapshotSummary,
    snapshotMatchesAtlas:
      !!latestSnapshotSummary &&
      !("error" in atlas) &&
      summariesMatch(latestSnapshotSummary.collections, atlas.collections),
    localMatchesSnapshot:
      !!latestSnapshotSummary &&
      !("error" in local) &&
      summariesMatch(local.collections, latestSnapshotSummary.collections),
  };
}

export async function createAtlasSnapshot() {
  const atlasUri = getAtlasUri();
  assertAtlasUri(atlasUri);

  const connection = await mongoose.createConnection(atlasUri).asPromise();
  try {
    const collections = await readCollections(connection);
    const payload: SnapshotPayload = {
      version: SNAPSHOT_VERSION,
      exportedAt: new Date().toISOString(),
      source: {
        database: connection.name,
        collections: COLLECTIONS,
      },
      collections,
    };
    const encrypted = encryptSnapshot(payload);
    await fs.mkdir(getSnapshotsDir(), { recursive: true });

    const stamp = payload.exportedAt.replace(/[:.]/g, "-");
    const fileName = `atlas-snapshot-${connection.name}-${stamp}.json`;
    const filePath = path.join(getSnapshotsDir(), fileName);
    await fs.writeFile(filePath, `${JSON.stringify(encrypted, null, 2)}\n`);

    return {
      fileName,
      exportedAt: payload.exportedAt,
      collections: summarizeCollections(collections),
    };
  } finally {
    await connection.close();
  }
}

export async function restoreLatestSnapshotToLocal() {
  const latestSnapshot = await getLatestSnapshot();
  if (!latestSnapshot) {
    throw new Error("No snapshot file exists yet.");
  }

  const localConnection = await mongoose.createConnection(getLocalUri()).asPromise();
  try {
    const summaries: RestoreSummary[] = [];
    for (const collectionName of COLLECTIONS) {
      const docs = latestSnapshot.payload.collections[collectionName] ?? [];
      if (docs.length === 0) {
        summaries.push({ collectionName, read: 0, upserted: 0, modified: 0 });
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

      const result = await localConnection
        .collection(collectionName)
        .bulkWrite(operations, { ordered: false });

      summaries.push({
        collectionName,
        read: docs.length,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      });
    }
    return {
      fileName: latestSnapshot.fileName,
      summaries,
    };
  } finally {
    await localConnection.close();
  }
}
