/**
 * Creates or resets the single admin account.
 *
 *   npm run db:seed-admin -- oli@olifelni.hu "a-strong-password"
 *
 * With no arguments it creates admin@olifelni.hu with a generated password and prints it once.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, adminUsers } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = (process.argv[2] ?? "admin@olifelni.hu").trim().toLowerCase();
  const generated = !process.argv[3];
  const password = process.argv[3] ?? randomBytes(9).toString("base64url");
  const passwordHash = await hashPassword(password);

  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing) {
    await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, existing.id));
    console.log(`password reset for ${email}`);
  } else {
    await db.insert(adminUsers).values({ email, passwordHash });
    console.log(`admin created: ${email}`);
  }

  if (generated) console.log(`password: ${password}\n(shown once — store it in a password manager)`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
