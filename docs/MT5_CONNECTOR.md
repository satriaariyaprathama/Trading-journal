# MT5_CONNECTOR

Diturunkan dari `docs/MASTER_SPEC.md`. **Belum ada kode connector dan belum diuji di MT5 atau Exness nyata.** Semua perilaku di bawah adalah desain.

## Prinsip

- Expert Advisor MQL5 **read-only**: tidak mengirim, mengubah, atau menutup order.
- Tidak menyimpan atau mengirim password MT5. Hanya token connector (scoped, dapat dicabut).
- Tidak memegang kredensial Supabase. Hanya berbicara dengan API Next.js lewat HTTPS.
- Tidak menyimpan state sync lokal yang penting: checkpoint berasal dari server, sehingga pindah PC atau VPS cukup dengan token baru.

## Yang dikirim

- **Kelas A (riwayat):** deals, history orders (SL/TP saat order dibuat), operasi saldo, per rentang waktu dan dalam batch kecil.
- **Kelas B (hanya sejak aktif):** snapshot balance/equity/margin, pengamatan SL/TP posisi terbuka, spesifikasi simbol (contract size, tick size, tick value, volume step, mata uang), informasi akun (login, server, mode margin, mata uang, leverage).

## Perilaku

1. Saat start: handshake; ambil checkpoint dan overlap dari server.
2. Run `initial` jika belum ada checkpoint; selanjutnya `incremental` berkala dan setelah event trade.
3. Membaca ulang dari checkpoint dikurangi overlap. Mengirim batch ≤ batas server; menunggu ack sebelum batch berikut.
4. Retry dengan backoff; setelah putus, handshake ulang dan lanjut dari seq terakhir yang di-ack.
5. Di akhir run: kirim total bulanan dan saldo akun untuk rekonsiliasi.
6. Merespons event deal dengan snapshot dan pengamatan posisi (SL/TP saat entry).
7. Melaporkan deal paling awal dan jumlah total sehingga riwayat terbatas dapat terdeteksi.

## Pemasangan (rencana)

1. Salin EA ke folder `MQL5/Experts` terminal, kompilasi di MetaEditor.
2. Di MT5: Tools → Options → Expert Advisors → izinkan WebRequest dan tambahkan domain API ke daftar URL yang diizinkan.
3. Atur input EA: URL API dan token (dibuat di Settings → Connector). Jangan membagikan token.
4. Pastikan tab History terminal diatur ke seluruh riwayat sebelum impor awal.
5. Pasang EA pada satu chart dan biarkan terminal berjalan. Saat terminal mati, snapshot dan pengamatan SL tidak terekam (celah ditampilkan sebagai cakupan data).

## Batasan

- Token tersimpan di konfigurasi EA di PC pengguna; mitigasinya scope sempit dan pencabutan.
- `WebRequest` mensyaratkan whitelist URL manual.
- Kedalaman riwayat tergantung terminal. Nilai akun Cent disimpan apa adanya (skala belum diverifikasi).
- Seluruh butir V-01..V-10 di MASTER_SPEC bagian 16 memerlukan validasi di terminal nyata.
