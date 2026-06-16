import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/account-management";
const COLLECTIONS = ["accounts", "audit_events"];

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

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

function normalizeUriForComparison(uri) {
  return uri.replace(/\/\/.*?@/, "//<credentials>@");
}

function redactMongoUri(uri) {
  return uri
    .replace(/:\/\/([^:/@?#]+):([^@]*)@/, "://<user>:<password>@")
    .replace(/([?&][^=]+)=([^&]+)/g, "$1=<redacted>");
}

function assertAtlasUri(uri) {
  const normalizedUri = uri.trim();

  if (
    !normalizedUri.toLowerCase().startsWith("mongodb+srv://") &&
    !(
      normalizedUri.toLowerCase().startsWith("mongodb://") &&
      normalizedUri.toLowerCase().includes(".mongodb.net")
    )
  ) {
    throw new Error(
      `MONGODB_URI should point at MongoDB Atlas before running this migration. Current shape: ${redactMongoUri(normalizedUri)}`,
    );
  }
}

function getMongoUriInfo(uri) {
  const withoutScheme = uri.trim().replace(/^mongodb(\+srv)?:\/\//i, "");
  const withoutCredentials = withoutScheme.includes("@")
    ? withoutScheme.slice(withoutScheme.indexOf("@") + 1)
    : withoutScheme;
  const queryIndex = withoutCredentials.indexOf("?");
  const beforeQuery =
    queryIndex === -1 ? withoutCredentials : withoutCredentials.slice(0, queryIndex);
  const slashIndex = beforeQuery.indexOf("/");
  const hosts = slashIndex === -1 ? beforeQuery : beforeQuery.slice(0, slashIndex);
  const database =
    slashIndex === -1 ? "" : beforeQuery.slice(slashIndex + 1).trim();

  return { hosts, database };
}

function getMongoHost(uri) {
  return getMongoUriInfo(uri).hosts;
}

function getMongoDatabasePath(uri) {
  const { database } = getMongoUriInfo(uri);
  return database ? `/${database}` : "/";
}

function assertAtlasDatabaseName(uri) {
  const databasePath = getMongoDatabasePath(uri);

  if (!databasePath || databasePath === "/") {
    throw new Error(
      "MONGODB_URI must include the target Atlas database name, for example /account-management before the query string.",
    );
  }
}

function assertNoPlaceholderValues(uri) {
  if (uri.includes("...")) {
    throw new Error(
      "MONGODB_URI still contains a placeholder value (`...`). Paste the complete connection string from Atlas, including the real replicaSet value, or use the SRV connection string.",
    );
  }
}

function explainConnectionError(error, atlasUri) {
  if (!(error instanceof Error)) return error;

  if (error.message.includes("querySrv ENOTFOUND")) {
    const host = getMongoHost(atlasUri);
    return new Error(
      `Could not resolve Atlas SRV host '${host}'. Use the exact hostname from Atlas's connection string, for example cluster0.xxxxx.mongodb.net. The database name belongs after the host, like /DeckSwapDB, and the app name belongs in the query string.`,
    );
  }

  if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
    return new Error(
      "Atlas authentication failed. Check that the URI uses an Atlas Database user/password, not your Atlas login, and URL-encode the password if it contains special characters.",
    );
  }

  if (error.message.includes("Server selection timed out")) {
    return new Error(
      "Atlas server selection timed out. Check Atlas Network Access and add your current IP address, or temporarily allow 0.0.0.0/0 while testing. Also confirm your firewall/VPN allows outbound TCP 27017.",
    );
  }

  return error;
}

function shouldApplyMigration() {
  return (
    process.argv.slice(2).includes("--apply") ||
    process.env.APPLY_MIGRATION === "1" ||
    process.env.npm_config_apply === "true"
  );
}

async function copyCollection({ source, target, collectionName, apply }) {
  const sourceCollection = source.collection(collectionName);
  const targetCollection = target.collection(collectionName);
  const docs = await sourceCollection.find({}).toArray();

  if (!apply) {
    return { collectionName, read: docs.length, upserted: 0, modified: 0 };
  }

  if (docs.length === 0) {
    return { collectionName, read: 0, upserted: 0, modified: 0 };
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

  const result = await targetCollection.bulkWrite(operations, { ordered: false });

  return {
    collectionName,
    read: docs.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
  };
}

async function main() {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  loadEnvFile(path.join(projectRoot, ".env.local"));

  const apply = shouldApplyMigration();
  const localUri =
    process.env.MONGODB_LOCAL_URI ||
    process.env.LOCAL_MONGODB_URI ||
    DEFAULT_LOCAL_URI;
  const atlasUri = process.env.MONGODB_URI;

  if (!atlasUri) {
    throw new Error("MONGODB_URI is required in .env.local.");
  }

  assertAtlasUri(atlasUri);
  assertAtlasDatabaseName(atlasUri);
  assertNoPlaceholderValues(atlasUri);

  if (normalizeUriForComparison(localUri) === normalizeUriForComparison(atlasUri)) {
    throw new Error("MONGODB_LOCAL_URI and MONGODB_URI point to the same target.");
  }

  let localConnection;
  let atlasConnection;

  try {
    localConnection = await mongoose.createConnection(localUri).asPromise();
    atlasConnection = await mongoose.createConnection(atlasUri).asPromise();

    console.log(apply ? "Migrating local records to Atlas..." : "Dry run only.");
    console.log(`Source: ${localConnection.name}`);
    console.log(`Target: ${atlasConnection.name}`);

    if (atlasConnection.name === "test") {
      throw new Error(
        "Atlas target database is 'test'. Add a database name to MONGODB_URI, for example /account-management before the query string.",
      );
    }

    for (const collectionName of COLLECTIONS) {
      const summary = await copyCollection({
        source: localConnection.db,
        target: atlasConnection.db,
        collectionName,
        apply,
      });

      const action = apply
        ? `${summary.upserted} inserted, ${summary.modified} updated`
        : "0 written";
      console.log(`${summary.collectionName}: ${summary.read} read, ${action}`);
    }

    if (!apply) {
      console.log("Run again with --apply to write these records to Atlas.");
    }
  } catch (error) {
    throw explainConnectionError(error, atlasUri);
  } finally {
    await Promise.all([
      localConnection?.close(),
      atlasConnection?.close(),
    ]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
