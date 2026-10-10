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
| D-08 | Eksekusi mandiri bertahap tanpa persetujuan per tahap; berhenti hanya pada kondisi kritis | ditetapkan |
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

Parameter berikut dinyatakan dapat dikonfigurasi di `docs/ARCHITECTURE.md`, tetapi belum memiliki nilai awal dan harus ditentukan sebelum atau saat implementasi:

- Ambang sampel kecil (`small_sample_threshold`)
- Latensi maksimum pengamatan SL untuk status `verified`
- Toleransi cross-check risiko (connector vs perhitungan sendiri)
- Toleransi rekonsiliasi (saldo dan bulanan)

Zona waktu batas periode sudah tercantum sebagai masalah terbuka di bagian bawah.

## Penyesuaian terhadap desain Stage 1

| ID | Perubahan | Alasan |
|---|---|---|
| C-01 | `trading_accounts.display_divisor` default **1** (bukan menyiratkan 100 untuk Cent); diubah hanya setelah skala diverifikasi dari data terminal | Sesuai D-10 |
| C-02 | Kunci siklus posisi memakai `cycle_key` = ticket deal pembuka siklus, bukan `cycle_no` berurutan (teknis, bukan keputusan bisnis) | Nomor urut bisa bergeser jika raw direvisi dan merusak assignment manual |
| C-03 | Invarian saldo hanya menjumlahkan deal yang memengaruhi saldo; credit/bonus tidak otomatis termasuk. Klasifikasi divalidasi (V-10) | Credit tidak mengubah saldo; tanpa koreksi invarian bisa salah memicu "riwayat tidak lengkap" |

## Validasi MT5 yang tertunda

Lihat `docs/MASTER_SPEC.md` bagian 16 (V-01..V-10). Belum ada yang diverifikasi.

## Zona waktu batas periode

Belum ditetapkan; dikonfigurasi di Settings. Nilai kerja: 1 September 2026 00:00 di zona yang dipilih pengguna.
