# PROJECT_STATE

Terakhir diperbarui: 2026-10-10 (finalisasi keputusan desain awal).

## Status

- Tahap: desain dan dokumentasi. **Tidak ada kode aplikasi, migrasi, atau connector yang ditulis atau dijalankan.**
- Git: diinisialisasi di `C:\Trading-journal` (branch `main`); commit awal `9e08a19` (dokumentasi + `.gitignore`); finalisasi keputusan desain di-commit pada sesi ini (`docs: finalize initial design decisions`).
- Audit repository (struktur, dependensi, perintah lint/typecheck/test/build): **belum dapat dijalankan substansial** karena belum ada scaffold proyek; hanya audit dokumentasi yang dilakukan.
- Audit dokumentasi: dilakukan 2026-10-10 (perbaikan, kesiapan Tahap 1, finalisasi keputusan).
- Keputusan dari audit K-01..K-05: K-01 (zona waktu `Asia/Jakarta`) dan K-04 (onboarding) telah dikonfirmasi pengguna (`ditetapkan`); K-02, K-03, K-05 masih `diasumsikan` (lihat `docs/DECISIONS.md`).
- Test yang dijalankan: **tidak ada.**
- Build/lint/typecheck: belum dijalankan (belum ada proyek yang diperiksa).
- Deployment: tidak dilakukan.
- Data derivasi: belum ada.

## Dokumen

| File | Status |
|---|---|
| `docs/MASTER_SPEC.md` | v0.1 draft (dari desain Stage 1 revisi); §1, §2, §8 diperbarui (onboarding, Strategy, timezone `Asia/Jakarta`) |
| `docs/DECISIONS.md` | D-01..D-10, A-01..A-07, C-01..C-03, K-01..K-05 (K-01, K-04 ditetapkan; K-02, K-03, K-05 diasumsikan) |
| `docs/DATA_MODEL.md` | v0.1; default `profiles`/`evaluation_periods` (timezone `Asia/Jakarta`)/`strategies` diperbarui (K-01..K-03) |
| `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/MT5_CONNECTOR.md`, `docs/TEST_PLAN.md` | v0.1 diturunkan; belum diperiksa terhadap implementasi |

## Hasil pemeriksaan konsistensi MASTER_SPEC dan DECISIONS (inspeksi dokumen, bukan test)

- C-02: kunci siklus posisi diganti dari `cycle_no` menjadi `cycle_key` (ticket deal pembuka) agar revisi raw tidak merusak assignment manual.
- C-03: invarian saldo hanya menjumlahkan deal yang memengaruhi saldo; credit/bonus tidak otomatis termasuk (V-10).
- V-10: DECISIONS telah dikoreksi dari "V-01..V-09" menjadi "V-01..V-10" agar cocok dengan MASTER_SPEC §16.
- Parameter configurable: `small_sample_threshold` diberi default 30 (K-02, diasumsikan); zona waktu ditetapkan `Asia/Jakarta` (K-01); 3 parameter lain (latensi SL `verified`, toleransi cross-check risiko, toleransi rekonsiliasi) belum ditetapkan.
- Referensi "prompt eksekusi" eksternal dihapus/diganti; kondisi berhenti kritis kini didefinisikan (K-05).
- Tidak ditemukan konflik kritis lain pada tingkat dokumen.

## Asumsi yang berlaku

A-01..A-07, K-02, K-03, K-05 di `docs/DECISIONS.md` masih `diasumsikan` (menunggu konfirmasi pengguna). K-01 (zona waktu `Asia/Jakarta`) dan K-04 (onboarding) telah `ditetapkan`. Parameter yang berubah dibuat sebagai konfigurasi. Waktu deal tetap UTC; zona `Asia/Jakarta` hanya untuk batas periode dan tampilan.

## Belum diimplementasikan

Semua fitur V1 (lihat MASTER_SPEC bagian 14). Validasi MT5 V-01..V-10 belum dilakukan.

## Kesiapan Tahap 1 (audit 2026-10-10)

**Belum siap memulai Tahap B.** Blocker yang masih ada:
- Tidak ada scaffold proyek (Next.js + Supabase + tooling).
- Tidak ada proyek/konfigurasi Supabase di repo (Auth, Postgres+RLS, Storage).
- Rencana A–I tidak punya langkah eksplisit "scaffold/init proyek" (A mengasumsikan repo berisi kode).

Keputusan K-01..K-05 menutup celah desain berikut sehingga Tahap B tidak terblokir olehnya: timezone, `small_sample_threshold`, `strategies`, onboarding single-user, kondisi berhenti kritis (D-08). K-01 dan K-04 telah dikonfirmasi; K-02, K-03, K-05 masih butuh konfirmasi.

Catatan: V-01..V-10 **tidak** memblokir Tahap B (hanya C–D untuk bagian yang bergantung pada INOUT/klasifikasi deal, per `docs/DATA_MODEL.md`).

## Langkah berikutnya (untuk OpenCode)

1. Konfirmasi K-02, K-03, K-05 (dan asumsi A-01..A-07) di `docs/DECISIONS.md`. K-01 (zona waktu `Asia/Jakarta`) dan K-04 (onboarding) telah ditetapkan.
2. Scaffold proyek: Next.js + Supabase (lokal/CLI) + tooling (lint, typecheck, test, build). Buat checkpoint Git.
3. Tahap B: auth (bootstrap single-user K-04), tabel konfigurasi, RLS, tes RLS dua pengguna. Jalankan quality gates dan catat hasil aktual di file ini.
4. Lanjut C sampai I sesuai `docs/ARCHITECTURE.md`. Berhenti pada kondisi kritis (K-05).

## Masalah terbuka

- **K-02, K-03, K-05 menunggu konfirmasi pengguna** (K-01, K-04 telah ditetapkan; lihat `docs/DECISIONS.md`).
- **A-01..A-07 menunggu konfirmasi pengguna** (diasumsikan).
- 3 parameter configurable belum punya nilai awal: latensi maksimum pengamatan SL (`verified`), toleransi cross-check risiko, toleransi rekonsiliasi (menyentuh C–D, bukan B).
- Semua validasi yang butuh terminal MT5 nyata (V-01..V-10) belum dilakukan.
