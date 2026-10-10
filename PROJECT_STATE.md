# PROJECT_STATE

Terakhir diperbarui: 2026-10-10 (scaffold proyek Next.js + Supabase client; tooling lolos quality gate).

## Status

- Tahap: **scaffold (Tahap A) selesai**; transisi ke Tahap B. Belum ada migrasi/RLS/connector/logika bisnis.
- Git: branch `main`; commit `9e08a19` (initial docs + `.gitignore`), `6188591` (finalize design decisions), `84215f4` (confirm core decisions), plus **checkpoint scaffold sesi ini** (Next.js + tooling + Supabase client).
- Scaffold: Next.js 16.4.0 (App Router, Turbopack) + React 19.3.0 + TypeScript 5 (strict) + ESLint 9 (flat config, `eslint-config-next`). Package manager: npm.
- Supabase client: `@supabase/ssr` (browser + server cookie session, RLS-enforced) + `@supabase/supabase-js` (admin/service-role, server-only per A-05). Fondasi `lib/supabase/` (browser/server/admin) siap; `.env.example` dibuat.
- Struktur folder per ARCHITECTURE dibuat: `app/`, `lib/{calc,sync,grouping,supabase}/`, `supabase/{migrations,tests}/`, `connector/mql5/`, `fixtures/` (placeholder).
- Quality gate (2026-10-10): **lint ✓, typecheck ✓ (standalone), build ✓**.
- npm audit: 5 "high" — semua di rantai dev-only `braces→micromatch→fast-glob→@next/eslint-plugin-next→eslint-config-next` (DoS glob library saat lint). **Tidak berdampak runtime produksi.** `npm audit fix --force` akan menurunkan `eslint-config-next` 16→14 (merusak flat config) → tidak dijalankan (K-05). Difer.
- Test yang dijalankan: belum ada (T-* di TEST_PLAN masih planned).
- Deployment: tidak dilakukan.
- Data derivasi: belum ada.

## Blocker Tahap B

**Runtime Supabase belum tersedia.** Docker dan Supabase CLI tidak terpasang di mesin ini → `supabase start` (lokal) tidak bisa dijalankan. Tidak ada kredensial cloud Supabase di repo. Akibatnya Auth/Postgres/RLS/tes RLS (inti Tahap B) belum bisa diimplementasikan/diuji.

Resolusi (perlu input pengguna):
1. Pasang Docker Desktop + Supabase CLI → Supabase lokal (rekomendasi dev/test, offline, tanpa akun cloud), atau
2. Sediakan proyek Supabase cloud (URL + anon key public; service-role key via file `.env.local` yang tidak dibaca ke chat).

## Dokumen

| File | Status |
|---|---|
| `docs/MASTER_SPEC.md` | v0.1 draft; §1, §2, §8 diperbarui (onboarding K-04, Strategy K-03, timezone Asia/Jakarta K-01) |
| `docs/DECISIONS.md` | D-01..D-10, A-01..A-07 (diasumsikan), C-01..C-03, K-01..K-05 (ditetapkan) |
| `docs/DATA_MODEL.md` | v0.1; default profiles/evaluation_periods (Asia/Jakarta)/strategies diperbarui (K-01..K-03) |
| `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/MT5_CONNECTOR.md`, `docs/TEST_PLAN.md` | v0.1 diturunkan; belum diverifikasi terhadap implementasi |

## Hasil pemeriksaan konsistensi (inspeksi dokumen, bukan test)

- C-02: cycle key = ticket deal pembuka (bukan `cycle_no`).
- C-03: invarian saldo hanya deal saldo-affecting; credit/bonus eksklusif (V-10).
- V-10: DECISIONS dikoreksi "V-01..V-09" → "V-01..V-10" (cocok MASTER_SPEC §16).
- Parameter configurable: `small_sample_threshold` = 30 (K-02); timezone = Asia/Jakarta (K-01); 3 parameter lain belum ditetapkan.
- Referensi "prompt eksekusi" eksternal dihapus; kondisi berhenti kritis didefinisikan (K-05).

## Asumsi yang berlaku

A-01..A-07 di `docs/DECISIONS.md` masih `diasumsikan` (menunggu konfirmasi pengguna). K-01..K-05 `ditetapkan`. Waktu deal tetap UTC; Asia/Jakarta hanya batas periode/tampilan.

## Keputusan scaffold (implementasi, konservatif)

- Package manager: npm (satu-satunya tersedia di mesin).
- Styling: tanpa Tailwind (minimal; styling ditangguhkan ke Tahap G).
- Import alias `@/*` → `./*`; tanpa `src/` (per ARCHITECTURE, `app/` di root).
- Layout signature: `ReactNode` plain (typecheck build-independent).
- `next.config.ts`: `cacheComponents` + `partialPrefetching` (default Next 16 dari create-next-app; akan ditinjau ulang di Tahap C saat data fetching).
- Supabase client: `@supabase/ssr` (App Router cookie auth) + `@supabase/supabase-js` (admin).

## Belum diimplementasikan

Semua fitur V1 (MASTER_SPEC §14). Validasi MT5 V-01..V-10 belum dilakukan. Auth/RLS/migrasi/tabel (Tahap B) tertunda blocker Supabase runtime.

## Langkah berikutnya

1. Konfirmasi asumsi A-01..A-07 (masih diasumsikan).
2. Pilih resolusi Supabase runtime (Docker lokal vs cloud) → unblock Tahap B.
3. Tahap B: bootstrap single-user (K-04), tabel konfigurasi, migrasi, RLS, tes RLS dua pengguna (T-SEC). Quality gates + catat hasil aktual.
4. Lanjut C–I per ARCHITECTURE. Berhenti pada kondisi kritis (K-05).

## Masalah terbuka

- **A-01..A-07 menunggu konfirmasi pengguna.**
- **Supabase runtime blocker** (Docker/CLI tidak ada; lihat §Blocker Tahap B).
- 3 parameter configurable belum punya nilai: latensi SL `verified`, toleransi cross-check risiko, toleransi rekonsiliasi (C–D).
- npm audit: 5 high dev-only (difer; lihat §Status).
- V-01..V-10 belum dilakukan (butuh terminal MT5 nyata).
