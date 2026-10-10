/* eslint-disable @typescript-eslint/no-explicit-any -- integration test;
   generated Database types not yet available (Supabase CLI pending, migration
   not yet applied). Runtime validates all queries; <any> only relaxes
   compile-time column checking in this test file. Replace with generated
   Database types (Supabase CLI / Dashboard) once available. */
// supabase/tests/rls.test.ts
// T-SEC-01: RLS two-user isolation — cross-user SELECT/INSERT/UPDATE/DELETE
// must be denied on all Tahap-B tables.
//
// Adapted from pgTAP (docs/TEST_PLAN) to TypeScript integration tests because
// the project uses a cloud Supabase project without Docker (no local pgTAP).
// Coverage is equivalent: exercises RLS from the client perspective via supabase-js.
//
// Env (NEXT_PUBLIC_SUPABASE_URL, anon key, service-role key) is loaded from
// .env.local by vitest.setup.ts. Test users are ephemeral and cleaned up.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase env vars — ensure .env.local is present (loaded via vitest.setup.ts)",
  );
}

// Helper so all clients share one concrete return type (avoids generic mismatch).
function makeClient(key: string): SupabaseClient<any> {
  return createClient<any>(url, key, { auth: { persistSession: false } });
}

const admin = makeClient(serviceRoleKey);

// Two ephemeral test users (unique per run).
const ts = Date.now();
const userA = { email: `rls-a-${ts}@test.local`, password: "PassRLS-A!1234" };
const userB = { email: `rls-b-${ts}@test.local`, password: "PassRLS-B!1234" };

let aId = "";
let bId = "";
let clientA!: ReturnType<typeof makeClient>;
let clientB!: ReturnType<typeof makeClient>;

async function signIn(email: string, password: string) {
  const c = makeClient(anonKey);
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("signIn: no user returned");
  return { client: c, id: data.user.id };
}

beforeAll(async () => {
  // Create two users (trigger auto-creates their profiles).
  const a = await admin.auth.admin.createUser({
    email: userA.email,
    password: userA.password,
    email_confirm: true,
  });
  const b = await admin.auth.admin.createUser({
    email: userB.email,
    password: userB.password,
    email_confirm: true,
  });
  if (a.error || b.error)
    throw new Error(
      "failed to create test users: " + (a.error?.message ?? b.error?.message),
    );
  if (!a.data.user || !b.data.user) throw new Error("createUser returned no user");
  aId = a.data.user.id;
  bId = b.data.user.id;

  const sa = await signIn(userA.email, userA.password);
  const sb = await signIn(userB.email, userB.password);
  clientA = sa.client;
  clientB = sb.client;

  // Seed one row per user in the non-profile config tables.
  await clientA.from("strategies").insert({ user_id: aId, name: "A strat" });
  await clientB.from("strategies").insert({ user_id: bId, name: "B strat" });
  await clientA
    .from("trading_accounts")
    .insert({ user_id: aId, login: "A1", server: "svA" });
  await clientB
    .from("trading_accounts")
    .insert({ user_id: bId, login: "B1", server: "svB" });
  await clientA
    .from("evaluation_periods")
    .insert({ user_id: aId, name: "A period" });
  await clientB
    .from("evaluation_periods")
    .insert({ user_id: bId, name: "B period" });
});

afterAll(async () => {
  // Cascade delete removes all rows owned by the user.
  if (aId) await admin.auth.admin.deleteUser(aId);
  if (bId) await admin.auth.admin.deleteUser(bId);
});

describe("T-SEC-01: RLS two-user isolation", () => {
  it("user A sees only own rows (strategies)", async () => {
    const { data } = await clientA.from("strategies").select();
    expect(data?.length).toBe(1);
    expect(data?.[0].name).toBe("A strat");
  });

  it("user B sees only own rows (strategies)", async () => {
    const { data } = await clientB.from("strategies").select();
    expect(data?.length).toBe(1);
    expect(data?.[0].name).toBe("B strat");
  });

  it("user A cannot INSERT a row claiming B's user_id", async () => {
    const { error } = await clientA
      .from("strategies")
      .insert({ user_id: bId, name: "forged" });
    expect(error).toBeTruthy(); // RLS WITH CHECK denies
  });

  it("user A cannot UPDATE B's row (B row unchanged)", async () => {
    await clientA
      .from("strategies")
      .update({ name: "hacked" })
      .eq("user_id", bId);
    const { data } = await clientB
      .from("strategies")
      .select()
      .eq("user_id", bId)
      .single();
    expect(data?.name).toBe("B strat");
  });

  it("user A cannot DELETE B's row (B row survives)", async () => {
    await clientA.from("strategies").delete().eq("user_id", bId);
    const { data } = await clientB.from("strategies").select().eq("user_id", bId);
    expect(data?.length).toBe(1);
  });

  it("user A CAN update their own row (RLS permits own data)", async () => {
    const { data } = await clientA
      .from("strategies")
      .update({ name: "A strat v2" })
      .eq("user_id", aId)
      .select();
    expect(data?.length).toBe(1);
    expect(data?.[0].name).toBe("A strat v2");
  });

  it("isolation holds on trading_accounts", async () => {
    const { data: aData } = await clientA.from("trading_accounts").select();
    const { data: bData } = await clientB.from("trading_accounts").select();
    expect(aData?.length).toBe(1);
    expect(aData?.[0].login).toBe("A1");
    expect(bData?.length).toBe(1);
    expect(bData?.[0].login).toBe("B1");
  });

  it("isolation holds on evaluation_periods", async () => {
    const { data: aData } = await clientA.from("evaluation_periods").select();
    const { data: bData } = await clientB.from("evaluation_periods").select();
    expect(aData?.length).toBe(1);
    expect(bData?.length).toBe(1);
  });

  it("profiles: trigger created a profile per user, isolation holds", async () => {
    const { data: aData } = await clientA.from("profiles").select();
    const { data: bData } = await clientB.from("profiles").select();
    expect(aData?.length).toBe(1);
    expect(aData?.[0].user_id).toBe(aId);
    expect(aData?.[0].timezone).toBe("Asia/Jakarta");
    expect(aData?.[0].small_sample_threshold).toBe(30);
    expect(bData?.length).toBe(1);
    expect(bData?.[0].user_id).toBe(bId);
  });

  it("user A cannot forge a profile for B", async () => {
    const { error } = await clientA.from("profiles").insert({ user_id: bId });
    expect(error).toBeTruthy();
  });
});
