# ARCHITECTURE

Diturunkan dari `docs/MASTER_SPEC.md`. Belum diimplementasikan.

## Komponen dan alur

```
MT5 (PC Windows) -- MQL5 EA read-only
   | HTTPS + bearer token (scoped, revocable)
   v
Vercel: Next.js (UI + /api/connector/v1/*)
   | modul server-only (service-role hanya di env server);
   | user_id dan account_id dari token
   v
Supabase: Postgres (RLS) · Auth · Storage
```

Alur data: raw → turunan (alokasi, posisi, agregat setup) → metrik (dihitung saat dibaca). Keputusan pengguna (assignment, review) berdiri sendiri dan mereferensikan kunci alami.

## Prinsip

- Kalkulasi finansial adalah modul TypeScript murni tanpa dependensi DB/UI, diuji dengan fixture berhitung independen.
- Satu fungsi query untuk periode dan setup, dipakai semua halaman.
- Worker derivasi memproses `derivation_jobs` dalam potongan kecil (batas waktu fungsi Vercel); aman diulang.
- Connector tidak punya hak baca data jurnal.
- Tidak ada order, tidak ada deploy produksi tanpa persetujuan.

## Struktur folder (usulan)

```
app/                       halaman: dashboard, journal, review, analytics, calendar, settings
app/api/connector/v1/      handshake, runs, batches, complete, events
lib/calc/                  engine murni (+ tests)
lib/sync/                  ingest, hash, rekonsiliasi, derivasi
lib/grouping/              suggestions dan operasi manual
lib/supabase/              klien browser dan modul admin server-only
supabase/migrations/       migrasi SQL + catatan rollback
supabase/tests/            tes RLS dan integrasi DB
connector/mql5/            Expert Advisor
fixtures/                  fixture SYNTHETIC + nilai harapan independen
docs/                      dokumen ini
PROJECT_STATE.md
```

## Urutan implementasi (A–I)

A audit repo → B auth, skema konfigurasi, RLS → C ingestion raw, token connector, sync run → D derivasi dan kalkulasi → E grouping → F plan builder dan review → G halaman UI → H connector MQL5 dan dokumentasi pemasangan → I integrasi, regresi, keamanan, responsif.

Penyesuaian urutan harus dicatat di `PROJECT_STATE.md`. Migrasi tabel raw/turunan sebaiknya menunggu langkah C–D; tabel konfigurasi (profil, akun, strategi, periode, plan, connector) dapat dibuat di B.

## Parameter yang dapat dikonfigurasi

Overlap sync, staleness equity, ukuran batch, interval snapshot, ambang sampel kecil, latensi maksimum pengamatan SL untuk `verified`, toleransi cross-check risiko, toleransi rekonsiliasi, zona waktu dan batas periode, `display_divisor` per akun. Nilai awal untuk overlap, staleness, batch, dan snapshot ada di `docs/DECISIONS.md` (A-07); zona waktu (default `Asia/Jakarta`, K-01, ditetapkan) dan ambang sampel kecil (default 30, K-02, diasumsikan) telah ditetapkan; latensi SL `verified`, toleransi cross-check risiko, dan toleransi rekonsiliasi belum ditetapkan (lihat `docs/DECISIONS.md`).
