import mongoose from "mongoose";

/**
 * The dev server hot-reloads modules, which would otherwise open a new pool on
 * every edit. Cache the connection promise on globalThis so we keep exactly one.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  __bakebabazMongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.__bakebabazMongoose ?? {
  conn: null,
  promise: null,
};
globalWithMongoose.__bakebabazMongoose = cached;

function formatMongoConnectionError(error: unknown, mongoUri: string): Error {
  if (!(error instanceof Error)) {
    return new Error("MongoDB connection failed due to an unknown error.");
  }

  const isRefused =
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("MongooseServerSelectionError");
  const pointsToLocalhost = /(127\.0\.0\.1|localhost):27017/.test(mongoUri);

  if (isRefused && pointsToLocalhost) {
    return new Error(
      [
        "Could not connect to MongoDB at 127.0.0.1:27017.",
        "This usually means your local MongoDB server is not running.",
        "Fix options:",
        "1) Start MongoDB locally (for example: brew services start mongodb-community).",
        "2) Or set MONGODB_URI in .env.local to a MongoDB Atlas connection string.",
      ].join("\n"),
      { cause: error },
    );
  }

  return new Error(`MongoDB connection failed: ${error.message}`, {
    cause: error,
  });
}

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not set. Copy .env.example to .env.local and add your connection string.",
    );
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw formatMongoConnectionError(error, mongoUri);
  }

  return cached.conn;
}

/**
 * The shape a Mongoose document takes once it has crossed the server/client
 * boundary: ObjectIds and Dates become strings.
 */
export type Serialized<T> = T extends mongoose.Types.ObjectId
  ? string
  : T extends Date
    ? string
    : T extends (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

/**
 * Turns Mongoose documents into plain objects safe to pass to Client
 * Components, and types the result to match what actually arrives.
 */
export function serialize<T>(value: T): Serialized<T> {
  return JSON.parse(JSON.stringify(value)) as Serialized<T>;
}
