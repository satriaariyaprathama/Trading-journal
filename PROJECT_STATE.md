# PROJECT_STATE

Terakhir diperbarui: 2026-10-10 (audit dan perbaikan dokumentasi).

## Status

- Tahap: desain dan dokumentasi. **Tidak ada kode aplikasi, migrasi, atau connector yang ditulis atau dijalankan.**
- Audit repository (Git, struktur, dependensi, perintah): **belum dilakukan.** Merupakan langkah pertama implementasi (lihat di bawah).
- Audit dokumentasi: dilakukan 2026-10-10. Perbaikan: path referensi, referensi prompt eksternal yang hilang, hitungan V-10 di DECISIONS, dan parameter tanpa nilai awal. Sisa masalah terbuka ada di bawah.
- Test yang dijalankan: **tidak ada.**
- Build/lint/typecheck: belum dijalankan (belum ada proyek yang diperiksa).
- Deployment: tidak dilakukan.
- Data derivasi: belum ada.

## Dokumen

| File | Status |
|---|---|
| `docs/MASTER_SPEC.md` | v0.1 draft (dari desain Stage 1 revisi) |
| `docs/DECISIONS.md` | D-01..D-10, A-01..A-07 (diasumsikan, dipakai sebagai default sesuai instruksi pengguna), C-01..C-03 |
| `docs/DATA_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API_CONTRACT.md`, `docs/MT5_CONNECTOR.md`, `docs/TEST_PLAN.md` | v0.1 diturunkan; belum diperiksa terhadap implementasi |

## Hasil pemeriksaan konsistensi MASTER_SPEC dan DECISIONS (inspeksi dokumen, bukan test)

- C-02: kunci siklus posisi diganti dari `cycle_no` menjadi `cycle_key` (ticket deal pembuka) agar revisi raw tidak merusak assignment manual.
- C-03: invarian saldo hanya menjumlahkan deal yang memengaruhi saldo; credit/bonus tidak otomatis termasuk (V-10).
- V-10: DECISIONS telah dikoreksi dari "V-01..V-09" menjadi "V-01..V-10" agar cocok dengan MASTER_SPEC §16.
- Parameter configurable tanpa nilai awal (ambang sampel kecil, latensi SL `verified`, toleransi cross-check risiko, toleransi rekonsiliasi) ditandai sebagai belum ditetapkan di DECISIONS.
- Referensi ke "prompt eksekusi" eksternal (di MASTER_SPEC §15, ARCHITECTURE, dan PROJECT_STATE) dihapus atau diganti; kondisi berhenti kritis yang belum ada kontennya ditandai sebagai masalah terbuka.
- Tidak ditemukan konflik kritis lain pada tingkat dokumen.

## Asumsi yang berlaku

A-01..A-07 di `docs/DECISIONS.md`. Parameter yang berubah dibuat sebagai konfigurasi. Batas periode memakai nilai kerja 1 September 2026 00:00 di zona waktu yang dipilih pengguna (belum ditetapkan).

## Belum diimplementasikan

Semua fitur V1 (lihat MASTER_SPEC bagian 14). Validasi MT5 V-01..V-10 belum dilakukan.

## Langkah berikutnya (untuk OpenCode)

Audit dokumentasi v0.1 telah dilakukan (2026-10-10): path, referensi prompt eksternal, hitungan V-10, dan parameter tanpa default diperbaiki. Sisa masalah terbuka ada di bawah.

1. Audit repo: status Git, struktur, dependensi, perintah yang tersedia (lint, typecheck, test, build). Jangan menimpa perubahan yang belum di-commit; buat checkpoint Git. (Belum ada kode; repo belum di-init Git.)
2. Periksa kesesuaian dokumen v0.1 dengan repo saat kode mulai ditulis; catat selisih di `docs/DECISIONS.md`.
3. Tahap B: auth, tabel konfigurasi, RLS, tes RLS dua pengguna. Jalankan quality gates dan catat hasil aktual di file ini.
4. Lanjut C sampai I sesuai `docs/ARCHITECTURE.md`. Berhenti hanya pada kondisi kritis (kondisi kritis belum didefinisikan di dokumentasi; lihat "Masalah terbuka").

## Masalah terbuka

- Zona waktu batas periode belum ditetapkan.
- Nilai awal untuk ambang sampel kecil, latensi maksimum pengamatan SL (`verified`), toleransi cross-check risiko, dan toleransi rekonsiliasi belum ditetapkan (lihat `docs/DECISIONS.md`).
- Kondisi berhenti kritis untuk eksekusi bertahap belum didefinisikan di dokumentasi.
- Semua validasi yang butuh terminal MT5 nyata (V-01..V-10) belum dilakukan.
