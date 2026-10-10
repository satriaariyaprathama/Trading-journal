# TEST_PLAN

Diturunkan dari `docs/MASTER_SPEC.md` bagian 14–16. **Semua baris di bawah berstatus: direncanakan.** Belum ada yang dijalankan. Hasil aktual dicatat di `PROJECT_STATE.md` hanya setelah dijalankan dan diamati.

Legenda: **F** = dapat dengan fixture sintetis (berlabel `SYNTHETIC`); **M** = juga butuh validasi terminal MT5 / akun nyata.
Nilai harapan fixture dihitung independen (spreadsheet atau perhitungan tangan), bukan dari keluaran engine.

## Kalkulasi (unit)

| ID | Kasus | Jenis |
|---|---|---|
| T-CALC-01 | Hedging: satu posisi, penutupan penuh | F |
| T-CALC-02 | Partial close (hedging dan netting) | F |
| T-CALC-03 | Layering: banyak deal pada satu posisi netting | F |
| T-CALC-04 | Layering: beberapa posisi hedging dalam satu setup | F |
| T-CALC-05 | Netting reversal (`INOUT`), konvensi alokasi, invarian alokasi | F (konvensi: M) |
| T-CALC-06 | `OUT_BY` (close by) | F (perilaku: M) |
| T-CALC-07 | Commission, swap, fee dengan berbagai tanda (termasuk positif) | F (format `fee`: M) |
| T-CALC-08 | Deposit, withdrawal, credit, bonus, correction tidak masuk trading P/L; `account_cost` terpisah | F (klasifikasi tipe: M) |
| T-CALC-09 | Win rate: breakeven di denominator, bukan win | F |
| T-CALC-10 | Expectancy, avg win/loss, drawdown trading P/L | F |
| T-CALC-11 | Risiko: verified, reconstructed, unknown, konflik, tanpa SL, spesifikasi terlambat | F (OrderCalcProfit dan konversi: M) |
| T-CALC-12 | Equity tidak tersedia; balance direkonstruksi tidak dilabeli equity | F |
| T-CALC-13 | Satu posisi ambigu (volume vs position_id tidak konsisten) ditandai | F |

## Data, sinkronisasi, derivasi (integrasi)

| ID | Kasus | Jenis |
|---|---|---|
| T-SYNC-01 | Impor ganda tidak menambah baris atau mengubah metrik | F |
| T-SYNC-02 | Retry batch yang sama idempoten | F |
| T-SYNC-03 | Sync terputus di tengah run lalu dilanjutkan dari seq terakhir | F |
| T-SYNC-04 | Record direvisi: revision +1, derivasi dan setup diperbarui, review ditandai | F |
| T-SYNC-05 | Derivasi terputus: job tetap pending, UI menandai stale | F |
| T-SYNC-06 | Rekonsiliasi tidak cocok: bulan ditandai/diambil ulang, tanpa penghapusan | F |
| T-SYNC-07 | Invarian saldo cocok dan tidak cocok | F (klasifikasi saldo: M) |
| T-SYNC-08 | Impor besar (puluhan ribu deal), batas batch dan waktu | F |
| T-SYNC-09 | Handshake menolak akun tidak cocok; token dicabut ditolak | F |
| T-SYNC-10 | Connector sebenarnya terhadap MT5/Exness | M saja |

## Grouping, plan, periode

| ID | Kasus | Jenis |
|---|---|---|
| T-GRP-01 | Posisi baru menjadi `auto_single`; tidak ada merge otomatis | F |
| T-GRP-02 | Suggestion: alasan, confidence, accept, reject, tidak muncul lagi setelah ditolak | F |
| T-GRP-03 | Merge, split, move menulis `grouping_events` dan menghitung ulang agregat | F |
| T-GRP-04 | Keputusan manual bertahan setelah sync dan rebuild (termasuk revisi raw, `cycle_key` stabil) | F |
| T-GRP-05 | Grouping ambigu dinyatakan tidak dapat disimpulkan | F |
| T-PLAN-01 | Edit versi terpakai membuat versi baru; review lama tidak berubah | F |
| T-PLAN-02 | Custom field: rename, ganti tipe, nonaktif tidak merusak nilai lama; `na` ≠ pass/fail | F |
| T-PER-01 | Batas Legacy/New: entry 31 Agustus tutup 1 September; merge lintas batas; zona waktu | F |
| T-PER-02 | Selector periode konsisten di semua halaman | F |

## Keamanan dan UI

| ID | Kasus | Jenis |
|---|---|---|
| T-SEC-01 | RLS dua pengguna: SELECT/INSERT/UPDATE/DELETE silang ditolak di semua tabel | F |
| T-SEC-02 | Storage: akses file pengguna lain ditolak | F |
| T-SEC-03 | API: token akun A tidak dapat menulis ke akun B; scope dibatasi | F |
| T-SEC-04 | Service-role key tidak ada di bundle browser atau repo | F |
| T-UI-01 | Alur esensial di desktop dan mobile; loading, error, empty | F (smoke) + pemeriksaan manual |
| T-VAL-01 | Metrik cocok dengan sampel MT5 nyata dan hitungan independen | M saja |

## Gerbang kualitas per unit perubahan

Periksa diff → format/lint → pemeriksaan TypeScript → unit test relevan → integrasi jika menyentuh DB/API/sync → build bila fondasi/integrasi berubah → periksa dokumentasi → regresi → catat hasil di `PROJECT_STATE.md`. Hanya perintah yang benar-benar ada di repo yang dijalankan.
