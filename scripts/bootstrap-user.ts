// scripts/bootstrap-user.ts
// Tahap B (K-04): bootstrap the single V1 user via Supabase Auth admin API.
// Server-side, service-role key (A-05). Run once: `npm run bootstrap`.
//
// Reads BOOTSTRAP_EMAIL + BOOTSTRAP_PASSWORD from .env.local (gitignored).
// Idempotent: skips if the user already exists.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const email = process.env.BOOTSTRAP_EMAIL;
  const password = process.env.BOOTSTRAP_PASSWORD;
  if (!email || !password) {
    console.error(
      "Missing BOOTSTRAP_EMAIL or BOOTSTRAP_PASSWORD in .env.local",
    );
    process.exit(1);
  }

  const admin = createAdminClient();

  // Idempotent: list existing users and skip if email already present.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error("Failed to list users:", listErr.message);
    process.exit(1);
  }
  const existing = list.users.find((u) => u.email === email);
  if (existing) {
    console.log(`User already exists: ${existing.email} (${existing.id}) — skipping.`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  console.log(`Created single user: ${data.user.email} (${data.user.id})`);
  console.log(
    "Profile auto-created by on_auth_user_created trigger (Asia/Jakarta, threshold 30).",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
