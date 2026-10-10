import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only admin client using the service-role key (bypasses RLS).
 *
 * SECURITY (A-05): This key is server-only. NEVER import this module in
 * client code. Used for single-user onboarding (K-04) and admin ops only.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
