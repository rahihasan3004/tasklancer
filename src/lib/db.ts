import mongoose from "mongoose";

const DIRECT_URI = "mongodb://softgrowerbd_db_user:5w5Vku0jEnguCLZA@ac-qsbmjqs-shard-00-00.orxhhq8.mongodb.net:27017,ac-qsbmjqs-shard-00-01.orxhhq8.mongodb.net:27017,ac-qsbmjqs-shard-00-02.orxhhq8.mongodb.net:27017/tasklancer?ssl=true&replicaSet=atlas-ddhj7m-shard-0&authSource=admin&appName=tasklancer";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    console.log("[DB] Connecting directly to MongoDB Replica Set...");
    cached!.promise = mongoose.connect(DIRECT_URI, opts).then((mongooseInstance) => {
      console.log("[DB] ✅ MongoDB Connected Successfully via Direct Nodes!");
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("[DB] ❌ MongoDB connection error:", e);
    throw e;
  }

  return cached!.conn;
}

export default connectDB;