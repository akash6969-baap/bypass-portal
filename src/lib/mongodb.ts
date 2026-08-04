import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global type to cache Mongoose connection across serverless cold starts
declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connects to MongoDB cluster using Mongoose with serverless connection pooling.
 * Safely handles connection errors without crashing the Next.js process.
 */
export async function dbConnect(): Promise<typeof mongoose | null> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    console.warn("⚠️ MONGODB_URI is not defined in environment variables. Database features will fallback to memory.");
    return null;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log("✅ Successfully connected to MongoDB Cluster.");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message || err);
        cached.promise = null;
        return null as unknown as typeof mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    console.error("Error awaiting Mongoose connection:", e);
  }

  return cached.conn;
}
