import "dotenv/config";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import { db, pool } from "../src/db";
import { members, organizations, users } from "../src/db/schema";
import { auth } from "../src/lib/auth";

const email = process.env.BOOTSTRAP_OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.BOOTSTRAP_OWNER_PASSWORD;
const name = process.env.BOOTSTRAP_OWNER_NAME?.trim() || "Racana Owner";

if (!email) throw new Error("BOOTSTRAP_OWNER_EMAIL is required.");
if (!password || password.length < 10) throw new Error("BOOTSTRAP_OWNER_PASSWORD must contain at least 10 characters.");

let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (!user) {
  await auth.api.signUpEmail({ body: { email, password, name } });
  [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error("Better Auth did not create the owner account.");
  console.log(`Created owner account for ${email}.`);
} else {
  console.log(`Owner account ${email} already exists.`);
}

let [organization] = await db.select().from(organizations).where(eq(organizations.slug, "racana")).limit(1);
if (!organization) {
  organization = { id: randomUUID(), name: "Racana", slug: "racana", logo: null, metadata: null, createdAt: new Date() };
  await db.insert(organizations).values(organization);
}

await db
  .insert(members)
  .values({ id: randomUUID(), organizationId: organization.id, userId: user.id, role: "owner", createdAt: new Date() })
  .onDuplicateKeyUpdate({ set: { role: "owner" } });

console.log(`Owner membership is ready for ${email}. Remove BOOTSTRAP_OWNER_PASSWORD from the environment now.`);
await pool.end();
