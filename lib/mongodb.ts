import mongoose from "mongoose";

const DEFAULT_LOCAL_URI = "mongodb://127.0.0.1:27017/account-management";

function getMongoUri() {
  if (process.env.MONGODB_OFFLINE === "true") {
    return (
      process.env.MONGODB_LOCAL_URI ||
      process.env.LOCAL_MONGODB_URI ||
      DEFAULT_LOCAL_URI
    );
  }

  return process.env.MONGODB_URI || DEFAULT_LOCAL_URI;
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached = globalForMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalForMongoose.mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  cached.promise ??= mongoose.connect(getMongoUri(), {
    bufferCommands: false,
  });
  cached.conn = await cached.promise;
  return cached.conn;
}
