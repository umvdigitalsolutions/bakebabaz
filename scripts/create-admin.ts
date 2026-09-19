import { config } from "dotenv";
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

import { createInterface } from "node:readline/promises";
import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/mongoose";
import { hashPassword, assessPasswordStrength } from "../lib/auth/password";
import { Admin } from "../models/Admin";

/** Creates or resets a bakery staff login. Usage: npm run create-admin */
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const name =
    process.env.ADMIN_NAME || (await rl.question("Name: ")) || "Bakery Admin";
  const email = (process.env.ADMIN_EMAIL || (await rl.question("Email: ")))
    .trim()
    .toLowerCase();
  const password =
    process.env.ADMIN_PASSWORD || (await rl.question("Password: "));

  rl.close();

  if (!email || !password) {
    console.error("Email and password are both required.");
    process.exit(1);
  }

  const strength = assessPasswordStrength(password);
  if (!strength.ok) {
    console.error("Password too weak:", strength.problems.join(" "));
    process.exit(1);
  }

  await connectToDatabase();
  const passwordHash = await hashPassword(password);

  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.active = true;
    await existing.save();
    console.log(`✓ Password reset for ${email}`);
  } else {
    await Admin.create({
      name,
      email,
      passwordHash,
      role: "owner",
      active: true,
    });
    console.log(`✓ Admin created: ${email}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
