# DECISIONS

Status: `ditetapkan` = keputusan eksplisit pengguna. `diasumsikan` = asumsi teknis, berlaku sebagai opsi konservatif sampai dikonfirmasi atau dikoreksi pengguna.

## Keputusan pengguna

| ID | Keputusan | Status |
|---|---|---|
| D-01 | Broker Exness, akun Cent, USD; Forex dan Gold saja (bukan crypto/saham); tipe akun lain mungkin ditambah | ditetapkan |
| D-02 | Belum ada akun demo; tes awal pakai fixture berlabel sintetis | ditetapkan |
| D-03 | Connector V1 di PC Windows; VPS tidak ditutup | ditetapkan |
| D-04 | Stop Loss tidak selalu dipakai; risiko `unknown` jika tidak tersedia | ditetapkan |
| D-05 | New Trading Plan mulai September 2026 (default dapat diubah di Settings); sebelumnya Legacy | ditetapkan |
| D-06 | Single user di V1; skema tetap mendukung multi-user | ditetapkan |
| D-07 | Auto-grouping hanya saran dengan alasan dan confidence; manual bertahan setelah sync | ditetapkan |
| D-08 | Eksekusi mandiri bertahap tanpa persetujuan per tahap; berhenti hanya pada kondisi kritis (kondisi: lihat K-05) | ditetapkan |
| D-09 | Tidak ada deploy produksi atau migrasi destruktif tanpa persetujuan eksplisit | ditetapkan |
| D-10 | Nilai akun Cent tidak diasumsikan dibagi 100; simpan nilai apa adanya | ditetapkan |

## Asumsi teknis (belum dikonfirmasi eksplisit)

| ID | Asumsi | Status |
|---|---|---|
| A-01 | Tiap posisi baru = satu setup (`auto_single`) sampai dikonfirmasi; cakupan grouping terkonfirmasi tampil di analitik | diasumsikan |
| A-02 | Periode ditentukan oleh waktu entry pertama setup | diasumsikan |
| A-03 | Versi plan default untuk review = versi yang berlaku saat entry setup | diasumsikan |
| A-04 | `user_declared` risk opsional dan dikecualikan dari metrik R secara default | diasumsikan |
| A-05 | Service-role key hanya di environment server Vercel, modul server-only | diasumsikan |
| A-06 | Unit grouping V1 = posisi; memecah satu posisi netting tidak masuk V1 | diasumsikan |
| A-07 | Parameter awal: overlap 7 hari, staleness equity 5 menit, batch ≈200 record, snapshot tiap 5 menit jika berubah | diasumsikan |

## Parameter awal yang belum ditetapkan

Parameter berikut dinyatakan dapat dikonfigurasi di `docs/ARCHITECTURE.md`. Ambang sampel kecil telah ditetapkan (K-02, default 30); tiga lainnya belum memiliki nilai awal dan harus ditentukan sebelum atau saat implementasi:

- Latensi maksimum pengamatan SL untuk status `verified`
- Toleransi cross-check risiko (connector vs perhitungan sendiri)
- Toleransi rekonsiliasi (saldo dan bulanan)

Zona waktu batas periode telah ditetapkan (K-01, `Asia/Jakarta`).

## Penyesuaian terhadap desain Stage 1

| ID | Perubahan | Alasan |
|---|---|---|
| C-01 | `trading_accounts.display_divisor` default **1** (bukan menyiratkan 100 untuk Cent); diubah hanya setelah skala diverifikasi dari data terminal | Sesuai D-10 |
| C-02 | Kunci siklus posisi memakai `cycle_key` = ticket deal pembuka siklus, bukan `cycle_no` berurutan (teknis, bukan keputusan bisnis) | Nomor urut bisa bergeser jika raw direvisi dan merusak assignment manual |
| C-03 | Invarian saldo hanya menjumlahkan deal yang memengaruhi saldo; credit/bonus tidak otomatis termasuk. Klasifikasi divalidasi (V-10) | Credit tidak mengubah saldo; tanpa koreksi invarian bisa salah memicu "riwayat tidak lengkap" |

## Validasi MT5 yang tertunda

Lihat `docs/MASTER_SPEC.md` bagian 16 (V-01..V-10). Belum ada yang diverifikasi.

## Zona waktu batas periode

Default: `Asia/Jakarta` (WIB, UTC+7) (K-01, ditetapkan), dapat diubah ke zona lain di Settings. Nilai kerja "1 September 2026 00:00" ditafsirkan sebagai 00:00 Asia/Jakarta (1 Sep 00:00 WIB = 31 Agu 17:00 UTC). Waktu deal tetap UTC; offset server broker dicatat terpisah.

## Keputusan dari audit 2026-10-10

Keputusan berikut ditetapkan oleh audit dokumentasi agar Tahap B tidak terblokir. Semua K-01..K-05 telah dikonfirmasi pengguna (`ditetapkan`).

| ID | Keputusan | Alasan / catatan | Status |
|---|---|---|---|
| K-01 | Zona waktu default `Asia/Jakarta` (WIB, UTC+7) untuk `profiles.timezone` dan `evaluation_periods.timezone` | Zona lokal pengguna (bahasa Indonesia, broker Exness); dapat diganti di Settings. Waktu deal tetap disimpan UTC; zona ini hanya untuk batas periode dan tampilan | ditetapkan |
| K-02 | `small_sample_threshold` default `30` | Ambang konvensional "sampel kecil" (n < 30); peringatan muncul di bawah ambang ini; dapat dikonfigurasi per pengguna | ditetapkan |
| K-03 | `Strategy` = entitas opsional buatan pengguna untuk melabeli `Setup` (nama, deskripsi, aktif); `setups.strategy_id` nullable; tidak dibuat otomatis, tidak wajib, tidak memengaruhi P/L atau grouping | Mengisi gap: `strategies` ada di DATA_MODEL tapi tidak di MASTER_SPEC §2; paling tidak-invasif | ditetapkan |
| K-04 | Onboarding single-user: satu pengguna V1 dibootstrap sekali via Supabase Auth admin API (server-side, service-role key per A-05), email + password; sign-up publik dimatikan; pengguna tambahan dibuat cara yang sama | Sesuai D-06; tidak ada alur sign-up publik di UI | ditetapkan |
| K-05 | Kondisi berhenti kritis (D-08): eksekusi mandiri berhenti dan meminta persetujuan pengguna jika (1) gerbang kualitas gagal pada ketepatan data/keamanan (RLS, invarian alokasi, rekonsiliasi tak teratasi); (2) operasi akan menyebabkan kehilangan data irreversibel; (3) secret terdeteksi di browser bundle/repo/log; (4) upaya deploy produksi atau migrasi destruktif (D-09); (5) sync/derivasi gagal berulang tanpa pemulihan otomatis; (6) penyimpangan dari MASTER_SPEC yang mengubah semantik perhitungan finansial tanpa keputusan eksplisit | Elaborasi D-08; konservatif = berhenti pada risiko data/keamanan/irreversibilitas | ditetapkan |
