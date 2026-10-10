# PROJECT_STATE

Terakhir diperbarui: 2026-10-10 (Tahap B selesai & terverifikasi: migrasi, RLS, bootstrap, T-SEC-01).

## Status

- Tahap: **Tahap B selesai** (auth + config schema + RLS + bootstrap single-user + tes RLS). Transisi ke Tahap C.
- Git: branch `main`; commit `9e08a19` (initial docs), `6188591` (finalize decisions), `84215f4` (confirm decisions), `c2cea60` (scaffold), plus **checkpoint Tahap B sesi ini** (migrasi + RLS + bootstrap + tes).
- Scaffold: Next.js 16.4.0 (App Router, Turbopack) + React 19.3.0 + TypeScript 5 (strict) + ESLint 9 (flat config, `eslint-config-next`). Package manager: npm.
- Supabase: **proyek cloud** (`lkvnwghldslelhxjadbi`). Key format: baru (`sb_publishable_...` / `sb_secret_...`). `.env.local` berisi URL + anon + service-role + bootstrap creds (5 vars, gitignored).
- Supabase client: `@supabase/ssr` (browser + server cookie session, RLS-enforced) + `@supabase/supabase-js` (admin/service-role, server-only per A-05). `lib/supabase/{browser,server,admin}.ts` siap.
- Tahap B deliverables:
  - Migrasi `0001_config_foundation.sql`: tabel `profiles`, `evaluation_periods`, `strategies`, `trading_accounts` + RLS uniform (`user_id = auth.uid()`) + trigger `handle_new_user` (auto-create profile: Asia/Jakarta + 30) + `updated_at` triggers. **Diaplikasikan via Dashboard SQL Editor** (cloud, tanpa CLI).
  - Bootstrap single-user (K-04): user dibuat via `admin.auth.admin.createUser` (script `scripts/bootstrap-user.ts`). Profile auto-created oleh trigger. Sign-up publik **dinonaktifkan** (Dashboard → Auth → Email → Allow new users = off).
  - T-SEC-01: 10 tes RLS via vitest + supabase-js (dua user ephemeral, cross SELECT/INSERT/UPDATE/DELETE denied di semua 4 tabel + profiles trigger + forge denied). **10/10 passed.**
- Test tooling: vitest 5 + tsx + dotenv (devDeps). `vitest.config.ts` + `vitest.setup.ts` (load .env.local). Scripts: `test`, `test:rls`, `bootstrap`.
- Quality gate (2026-10-10): **lint ✓, typecheck ✓, build ✓, test:rls ✓ (10/10)**.
- npm audit: 5 "high" dev-only (`braces→micromatch→fast-glob→@next/eslint-plugin-next→eslint-config-next`). Tidak berdampak runtime produksi. Difer (K-05).
- Deployment: tidak dilakukan (D-09).
- Data derivasi: belum ada.

## Dokumen

| File | Status |
|---|---|
| `docs/MASTER_SPEC.md` | v0.1 draft; §1, §2, §8 diperbarui (K-04, K-03, K-01) |
| `docs/DECISIONS.md` | D-01..D-10, A-01..A-07 (diasumsikan), C-01..C-03, K-01..K-05 (ditetapkan) |
| `docs/DATA_MODEL.md` | v0.1; Tahap B foundation tables sesuai spec |
| `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/MT5_CONNECTOR.md`, `docs/TEST_PLAN.md` | v0.1; T-SEC-01 diadaptasi dari pgTAP → vitest (cloud, tanpa Docker) |

## Hasil tes aktual

- **T-SEC-01 (RLS two-user isolation)**: ✓ 10/10 passed (2026-10-10). Cross-user SELECT/INSERT/UPDATE/DELETE denied di `strategies`, `trading_accounts`, `evaluation_periods`, `profiles`. Trigger `handle_new_user` menciptakan profile per user (Asia/Jakarta, threshold 30). Forge profile untuk user lain denied. User ephemeral dibuat & dihapus per run (cascade).

## Asumsi yang berlaku

A-01..A-07 di `docs/DECISIONS.md` masih `diasumsikan` (menunggu konfirmasi pengguna). K-01..K-05 `ditetapkan`. Waktu deal tetap UTC; Asia/Jakarta hanya batas periode/tampilan.

## Keputusan implementasi (Tahap B)

- Supabase runtime: **cloud** (bukan Docker lokal). Migrasi DDL diaplikasikan via Dashboard SQL Editor (supabase-js REST = CRUD only, bukan DDL). Migration files tetap version-controlled di `supabase/migrations/`.
- Key format: baru (`sb_publishable_...` / `sb_secret_...`). Service-role key = `sb_secret_...` (server-only, A-05).
- Test runner: vitest (bukan pgTAP) — cloud/tanpa Docker; coverage equivalent dari perspektif klien.
- Bootstrap: `scripts/bootstrap-user.ts` via tsx, baca `.env.local` (dotenv). Idempotent (skip jika user exists).
- RLS test clients: `createClient<any>` dengan file-level eslint-disable (generated Database types belum tersedia; runtime memvalidasi query). TODO: ganti dengan generated types saat CLI diadopsi.
- `@types/node` upgraded ^20 → ^26 (vitest 5 peer requirement; matches Node 26 runtime).

## Belum diimplementasikan

- Tahap C–I per ARCHITECTURE (raw/derived tables, sync, grouping, calc, connector, UI).
- Validasi MT5 V-01..V-10 (butuh terminal MT5 nyata).
- Generated Database types (butuh Supabase CLI atau Dashboard type export).

## Langkah berikutnya

1. Konfirmasi asumsi A-01..A-07 (masih diasumsikan; menyangkut grouping/sync Tahap C–E).
2. Tahap C: tabel raw (deals) + INOUT validation, sync connector MQL5.
3. Lanjut D–I per ARCHITECTURE. Berhenti pada kondisi kritis (K-05).

## Masalah terbuka

- **A-01..A-07 menunggu konfirmasi pengguna.**
- 3 parameter configurable belum punya nilai: latensi SL `verified`, toleransi cross-check risiko, toleransi rekonsiliasi (C–D).
- vitest config warning: ESM syntax in `.ts` loaded as CommonJS (benign; future Vite major may require `.mts` rename or `type: module`).
- RLS test uses `createClient<any>` (pending generated Database types).
- npm audit: 5 high dev-only (difer; lihat §Status).
- V-01..V-10 belum dilakukan (butuh terminal MT5 nyata).
