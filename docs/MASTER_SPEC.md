# MASTER_SPEC — MT5 Trading Journal

**Status:** DRAFT v0.1. Diturunkan dari desain Stage 1 (revisi). Belum ada implementasi dan belum ada pengujian terhadap MT5 nyata.
Asumsi teknis A-01..A-07 ada di `docs/DECISIONS.md` dan berstatus *diasumsikan* sampai dikonfirmasi pengguna.

## 1. Ruang lingkup

- Jurnal dan analitik MT5 untuk **Forex dan Gold**. Bukan crypto/saham. **Bukan bot**: tidak mengirim, mengubah, atau menutup order.
- Akun saat ini: Exness Cent, mata uang dilaporkan sebagai USD oleh pengguna (satuan sebenarnya dibaca dari MT5). Tipe akun lain mungkin ditambah. Tidak ada spesifikasi akun/simbol yang di-hardcode.
- Single user di V1. Semua tabel tetap memiliki `user_id`. Sign-up publik dimatikan.
- Akun demo belum ada. Pengujian awal memakai fixture berlabel `SYNTHETIC`.
- Connector V1 berjalan di PC Windows (VPS tidak ditutup). Tidak boleh menyimpan atau mengirim password MT5.

## 2. Entitas

| Entitas | Arti |
|---|---|
| Order | Permintaan trading (membawa SL/TP saat dibuat) |
| Deal | Eksekusi nyata; sumber semua nilai uang |
| Position | Siklus hidup volume pada satu simbol; dapat berisi banyak deal |
| Setup | Satu ide trading buatan pengguna; satu atau lebih posisi |

Satu deal bukan satu trade. `position_id` MT5 bukan satu setup.

## 3. Lapisan data

1. **Raw** (`raw_deals`, `raw_orders`, `raw_record_revisions`): sumber kebenaran, tidak ditimpa tanpa jejak revisi.
2. **Turunan** (`deal_allocations`, `positions`, agregat `setups`): dapat dibangun ulang dari raw + keputusan pengguna.
3. **Keputusan pengguna** (`setup_assignments`, `grouping_events`, review, catatan, lampiran): tidak boleh hilang saat rebuild.
4. **Metrik**: dihitung saat dibaca dari setup. Hanya agregat setup yang di-cache (dengan `source_hash` dan `calc_version`).

## 4. Akuntansi

- Klasifikasi `raw_deals.class`: `trading` (BUY/SELL), `balance_op` (deposit, withdrawal, credit, bonus, correction, dan sejenisnya), `account_cost` (charge/commission harian atau bulanan yang tidak terikat deal).
- **Net P/L deal** = profit + commission + swap + fee, tanda sesuai MT5 (commission/fee bisa positif).
- **Net P/L posisi/setup** = jumlah `deal_allocations`. Invarian: jumlah alokasi per deal = nilai deal untuk setiap komponen (tepat satu kali).
- `balance_op` tidak masuk trading P/L. `account_cost` tidak masuk P/L setup; tampil sebagai biaya akun tak teralokasi; ikut rekonsiliasi.
- Nilai disimpan **apa adanya** sesuai laporan MT5. `trading_accounts.display_divisor` default 1; hanya diubah setelah skala diverifikasi dari data terminal nyata.

### Siklus posisi, netting, hedging, reversal

- Siklus posisi dihitung dari **volume bersih berjalan** (per simbol untuk netting, per posisi untuk hedging); `position_id` hanya cross-check. Ketidakcocokan menghasilkan flag `ambiguous`.
- Hedging: `IN` membuka, `OUT` menutup sebagian/penuh, `OUT_BY` dicatat per deal pada posisi masing-masing.
- Netting: `IN` yang menambah = layering dalam siklus yang sama; `OUT` yang mengurangi = partial close.
- `INOUT` (reversal): deal dipecah menjadi leg tutup dan leg buka (siklus baru). Konvensi awal: profit dan swap ke leg tutup; commission dan fee proporsional volume. Disimpan sebagai `allocation_method`. **Belum tervalidasi dengan data nyata.**
- Kunci posisi: `(account_id, mt5_position_id, cycle_key)`. `cycle_key` = ticket deal pembuka siklus (deterministik, bukan nomor urut) supaya revisi raw tidak menggeser kunci dan merusak assignment manual.
- Posisi netting dengan banyak siklus layering/partial diberi flag `multi_cycle`. Unit grouping V1 adalah posisi, bukan deal (batasan terdokumentasi).

## 5. Risiko

Status provenance: `verified`, `reconstructed`, `unknown`, dan opsional `user_declared` (dikecualikan dari metrik R secara default).

- Harga entry: harga deal pembuka. SL: pengamatan connector saat entry (`verified` jika latensi dalam batas dan tidak ada modifikasi di antaranya) atau SL pada history order pembuka (`reconstructed`).
- **Tidak boleh** memakai SL saat ini, harga penutupan, atau `DEAL_REASON_SL` untuk mengklaim risiko saat entry.
- Spesifikasi simbol dari `symbol_specs` terdekat sebelum atau pada waktu entry. Spesifikasi yang ditangkap setelah entry menurunkan kepercayaan.
- Nilai risiko dihitung dari jarak entry-SL, volume, dan spesifikasi simbol; konversi ke mata uang akun dengan basis yang dicatat. Jika connector tersedia, dicross-check dengan perhitungan MT5; konflik di atas toleransi → `unknown`.
- Tidak termasuk spread, slippage, commission, swap.
- Risiko awal dipisah dari risiko saat ini. Hanya risiko awal untuk R-multiple.
- Risiko setup = jumlah risiko awal posisi anggota; jika ada anggota `unknown` maka `unknown` (jumlah parsial hanya sebagai "terdokumentasi sebagian", berlabel).
- R-multiple = net P/L setup ÷ risiko awal setup, hanya jika risiko valid. Risk % = risiko awal ÷ equity sebelum entry × 100, hanya jika kedua input valid.

## 6. Equity dan balance

- `observed_before_entry`: snapshot terakhir sebelum entry dalam batas staleness (default 5 menit). `observed_at_entry`: snapshot dari event deal (setelah fill), kepercayaan lebih rendah. Selain itu `unknown`.
- Dari riwayat hanya **balance** yang dapat direkonstruksi (`reconstructed_balance`, andal jika rekonsiliasi saldo cocok). Tidak pernah ditampilkan sebagai equity; metrik terhadap balance dan terhadap equity dipisah.
- Equity historis sebelum connector aktif tidak dapat dipulihkan.

## 7. Grouping

- Posisi baru otomatis menjadi setup sendiri (`grouping_state = auto_single`). Tidak ada penggabungan otomatis.
- `grouping_suggestions`: jenis, aturan + versi, bukti (`evidence`), confidence ordinal (tinggi/sedang/rendah; bukan probabilitas), status (pending/accepted/rejected/stale), `fingerprint`. Yang ditolak tidak muncul lagi kecuali bukti berubah. Bukti tidak cukup → dinyatakan tidak dapat disimpulkan.
- `setup_assignments` (kunci alami posisi) dengan `origin`: `auto_default`, `suggestion_accepted`, `manual`. Proses otomatis tidak pernah mengubah origin selain `auto_default`.
- Aksi accept/reject/merge/split/move/confirm dicatat di `grouping_events` (append-only) dan memicu hitung ulang setup terdampak.
- Merge: setup yang hilang berstatus `merged_into`, review tetap read-only dan terhubung. Split: review tetap di setup asal. Review terdampak diberi tanda "grouping berubah setelah review".
- Batas: data MT5 tidak memuat maksud pengguna.

## 8. Periode evaluasi

- Periode ditentukan oleh **waktu entry pertama setup** (`opened_at` = min waktu buka posisi anggota). Setup terbuka masuk periode berdasarkan entry tetapi tidak masuk win rate.
- Batas disimpan sebagai tanggal lokal + zona waktu (dikonfigurasi di Settings, belum ditetapkan), diterjemahkan ke instan UTC. Nilai kerja awal New Trading Plan: 1 September 2026 00:00 di zona yang dipilih. Waktu deal tetap UTC; offset server broker dicatat.
- Satu selector global dan satu fungsi query untuk Dashboard, Trade Journal, Analytics, Calendar & History. Merge lintas batas periode memicu peringatan.
- Mengubah batas mengubah tampilan analitik, tidak mengubah review atau versi plan; perubahan batas dicatat.

## 9. Metrik

| Metrik | Definisi |
|---|---|
| Win rate | setup selesai dengan net P/L > 0 ÷ semua setup selesai (breakeven di denominator, bukan win) |
| Avg win / avg loss | rata-rata net P/L setup menang / kalah |
| Expectancy | Σ net P/L setup selesai ÷ jumlah setup selesai |
| R-expectancy | rata-rata R pada setup dengan risiko valid; cakupan n/N selalu tampil |
| Drawdown trading P/L | peak-to-trough kumulatif net P/L setup selesai, urut waktu close; selalu tersedia |
| Equity drawdown | dari `account_snapshots`, dikoreksi arus deposit/withdrawal; hanya di rentang bersnapshot, dengan cakupan |
| Kepatuhan | per versi plan: pass ÷ (pass + fail) item mandatory yang dievaluasi; `na` dan `not_evaluated` dilaporkan sebagai kelengkapan |

Selalu tampil: jumlah sampel, cakupan grouping terkonfirmasi, cakupan risiko/equity/review, peringatan sampel kecil. Perbandingan antar versi plan dilabeli korelasi, bukan sebab-akibat.

## 10. Trading Plan

- Tabel: `plan_versions`, `plan_item_definitions` (identitas stabil lintas versi), `plan_items` (per versi; kind rule/confirmation/custom_field; label, deskripsi, mandatory, active, urutan, kategori, tipe, opsi), `setup_reviews`, `review_item_values` (status `pass`/`fail`/`na`/`not_evaluated`).
- Versi **terkunci** saat review pertama (termasuk draft) dibuat; setelah itu perubahan membuat versi baru. Baris `plan_items` pada versi terkunci tidak dapat diubah (trigger). FK dari nilai review ke item bersifat RESTRICT.
- Menonaktifkan item = versi baru dengan `active = false`. Ganti tipe tidak kompatibel = definisi baru dengan pointer `replaces`.
- Versi aktif ditentukan eksplisit atau lewat `effective_from` (dihitung saat dibaca). Default versi untuk review = versi yang berlaku pada waktu entry setup; dapat diganti manual.
- Jumlah item tidak dibatasi.

## 11. Derivasi dan revisi raw

1. Upsert berdasarkan unique key; jika `content_hash` berubah: `revision`+1, versi lama ke `raw_record_revisions`, log.
2. Dalam transaksi yang sama dibuat `derivation_jobs` untuk posisi terdampak.
3. Worker menghitung ulang alokasi → posisi → setup. Setiap langkah fungsi murni dari raw + assignment, aman diulang.
4. `setups.source_hash` dan `calc_version` mendeteksi data basi.
5. Terputus: job tetap `pending`; run `derivation_pending`; UI menampilkan data turunan belum mutakhir. Angka lama tidak ditampilkan seolah mutakhir.
6. Review final yang setup-nya berubah angkanya diberi tanda "data berubah setelah review" tanpa mengubah isinya.
7. Tersedia rebuild penuh per akun.

## 12. Sinkronisasi

- Kelas A (dari riwayat): deals, history orders, operasi saldo. Kelas B (hanya sejak connector aktif): snapshot equity, pengamatan SL/TP, spesifikasi simbol dari waktu ke waktu.
- Endpoint v1: `POST /handshake`, `/runs`, `/runs/{id}/batches`, `/runs/{id}/complete`, `/events`. Detail di `docs/API_CONTRACT.md`.
- Cursor `(time_msc, ticket)` maju hanya setelah batch di-ack. Overlap (default 7 hari). Batch ≈200 record. Satu run aktif per akun. Retry dengan backoff; kirim ulang idempoten. Server adalah sumber kebenaran state sync.
- Rekonsiliasi: (a) invarian saldo: Σ(profit+commission+swap+fee) deal yang memengaruhi saldo (credit/bonus tidak otomatis termasuk; klasifikasi per tipe deal divalidasi, V-10) = saldo akun saat ini dalam toleransi; (b) bulanan: jumlah deal dan Σ tiap komponen terminal vs server. Bulan yang tidak cocok diambil ulang; jika tetap beda, ditandai. Tidak ada penghapusan otomatis.
- Connector melaporkan deal paling awal dan jumlah total; UI memperingatkan riwayat terbatas.

## 13. Keamanan

- RLS pada semua tabel milik pengguna; Storage bucket privat, path `{user_id}/{setup_id}/…`.
- Service-role key hanya di environment server (modul server-only); tidak pernah di browser atau connector.
- Token connector: acak 256 bit, hash SHA-256 di DB, scope (`sync:write`, `events:write`), terikat satu akun, dapat dicabut/diputar. `user_id` dan `account_id` selalu dari token. Handshake menolak login/server yang tidak cocok.
- Validasi skema, batas ukuran, rate limit; token dan secret tidak masuk log atau source control.
- Tes akses lintas pengguna untuk DB, Storage, dan API. Tidak ada deploy produksi atau migrasi destruktif tanpa persetujuan eksplisit.

## 14. Kriteria V1 dan bukti yang dibutuhkan

| # | Kriteria | Bukti minimum |
|---|---|---|
| 1 | Auth dan isolasi | Tes dua pengguna (tabel, Storage, API) dijalankan dan lolos |
| 2 | Impor riwayat penuh | Fixture besar + rekonsiliasi; validasi terminal nyata ditandai terpisah |
| 3 | Sync inkremental dan recovery | Tes impor ganda, putus di tengah, revisi |
| 4 | Saran grouping + koreksi manual | Tes accept/reject/merge/split/move; manual bertahan setelah sync |
| 5 | Agregasi, partial close, layering | Unit test dengan hasil hitung independen |
| 6 | Equity sebelum entry dan risiko | Tes tanpa SL/equity/konflik; label provenance di UI |
| 7 | Plan fleksibel dan versioned | Edit setelah dipakai menghasilkan versi baru; review lama tidak berubah |
| 8 | Legacy vs New Plan | Fixture batas periode |
| 9 | Metrik cocok dengan sampel MT5 | Perbandingan dengan sampel nyata + hitung independen |
| 10 | UX desktop dan mobile | Checklist manual + smoke test viewport |

V1 tidak dinyatakan selesai sebelum setiap kriteria punya bukti yang benar-benar dijalankan.

## 15. Klasifikasi pengujian

- **Dapat dengan fixture sintetis:** semua kasus berikut (partial close, layering, netting, hedging, INOUT versi sintetis, biaya, balance_op, duplikasi, putus, revisi, grouping manual, tanpa SL/equity, win rate, plan, periode, RLS, impor besar, UI).
- **Butuh terminal MT5 / akun nyata:** semua butir di bagian 16. Connector tidak boleh diklaim teruji dengan Exness/MT5 nyata jika hanya mock atau unit test.

## 16. Perlu validasi MT5 (belum diverifikasi)

V-01 mode margin akun (hedging/netting). V-02 satuan akun Cent dan nilai `display_divisor`. V-03 perilaku `position_id` dan `INOUT` saat reversal netting serta konvensi alokasi. V-04 format dan tanda `fee`/commission. V-05 akhiran simbol broker. V-06 spesifikasi simbol per tipe akun. V-07 kedalaman riwayat terminal. V-08 perilaku `OrderCalcProfit` dan konversi kurs non-USD. V-09 offset waktu server dan DST. V-10 tipe deal mana yang memengaruhi saldo (credit, bonus, charge, dan sejenisnya) untuk invarian saldo.

## 17. Tidak dapat diketahui dari riwayat

Equity historis sebelum entry; SL saat entry jika dipasang setelah posisi terbuka tanpa connector aktif; perubahan SL sebelum connector aktif; spesifikasi simbol dan kurs masa lalu; maksud pengguna; equity drawdown pada periode tanpa snapshot.
