import dotenv from "dotenv";

// Load .env.local (gitignored) so test files can read Supabase env vars
// via process.env. vitest/Vite does not expose NEXT_PUBLIC_* vars to
// process.env by default, so we load them explicitly here.
dotenv.config({ path: ".env.local" });
