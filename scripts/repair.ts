/**
 * Database repair pass. Safe to run any time, and idempotent.
 *
 * - Collapses duplicate StoreSettings "singletons" (an early read-then-create
 *   race could insert more than one; the oldest wins so no edits are lost).
 * - Rebuilds every schema index, which matters when a collection was written
 *   before its unique indexes finished building.
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongoose";
import * as models from "../models";

async function collapseStoreSettings() {
  const docs = await models.StoreSettings.find()
    .sort({ createdAt: 1 })
    .select("_id key createdAt")
    .lean();

  if (docs.length <= 1) {
    console.log("→ store settings: 1 document, nothing to collapse");
    return;
  }

  const [keep, ...duplicates] = docs;
  await models.StoreSettings.deleteMany({
    _id: { $in: duplicates.map((doc) => doc._id) },
  });

  console.log(
    `→ store settings: removed ${duplicates.length} duplicate(s), kept ${String(keep._id)}`,
  );
}

async function syncIndexes() {
  const entries = Object.entries(models) as [string, mongoose.Model<unknown>][];

  for (const [name, model] of entries) {
    if (typeof model?.syncIndexes !== "function") continue;
    try {
      await model.syncIndexes();
    } catch (error) {
      console.warn(
        `  ! ${name}: could not sync indexes —`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  console.log(`→ indexes synced for ${entries.length} models`);
}

async function main() {
  await connectToDatabase();
  await collapseStoreSettings();
  await syncIndexes();
  console.log("\n✓ Repair complete.\n");
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("\n✗ Repair failed:\n", error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
