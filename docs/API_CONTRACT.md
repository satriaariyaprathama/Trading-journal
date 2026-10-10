# API_CONTRACT — Connector v1

Diturunkan dari `docs/MASTER_SPEC.md` bagian 12–13. Kontrak ini belum diimplementasikan atau diuji.

## Umum

- Base path: `/api/connector/v1`. Hanya HTTPS. JSON.
- Header: `Authorization: Bearer <token>`. `user_id` dan `account_id` selalu diturunkan dari token, tidak dibaca dari payload.
- Scope: `sync:write` (handshake, runs, batches, complete) dan `events:write` (events). Token tidak dapat membaca data jurnal.
- Waktu: UTC, milidetik (`time_msc`). Nilai uang dalam satuan yang dilaporkan MT5.
- Error: `{ "error": { "code", "message", "retryable" } }`.
- Kode: 401 token tidak valid/dicabut; 403 scope atau akun tidak cocok; 409 sudah ada run aktif; 413 payload terlalu besar; 422 validasi gagal; 429 rate limit; 5xx boleh diulang. Kirim ulang batch dan event aman (idempoten).
- Token dan secret tidak boleh masuk log.

## POST /handshake

Request: `protocol_version`; `account` {login, server, company, currency, margin_mode, leverage, trade_mode}; `terminal` {build, server_gmt_offset_sec}; `connector_time_utc`; `history` {earliest_deal_time_msc, total_deals}.
Response: `account_id`; `checkpoint` {time_msc, ticket}; `overlap_days`; `open_run` {run_id, acked_seq} atau null; `limits` {max_batch_records, max_payload_bytes}; `server_time_utc`.
Ditolak (403) jika login/server tidak cocok dengan akun yang terikat pada token. Selisih jam terlalu besar dilaporkan sebagai peringatan.

## POST /runs

Request: `client_run_id`; `mode` (initial/incremental/reconcile); `window_from_msc`; `window_to_msc`.
Response: `run_id`. Ditolak 409 jika ada run aktif untuk akun.

## POST /runs/{run_id}/batches

Request: `batch_id`; `batch_seq`; `checksum`; `deals[]`; `orders[]`; `symbol_specs[]`.
- Deal: deal_ticket, order_ticket, position_id, time_msc, type, entry, symbol, volume, price, profit, commission, swap, fee, magic, comment, reason.
- Order: order_ticket, position_id, type, state, volume, price, sl, tp, time_setup_msc, time_done_msc.
Response: `acked_seq`; `inserted`; `unchanged`; `revised`; `rejected[]` {ref, reason}.
Perilaku: upsert idempoten berdasarkan unique key; `content_hash` berbeda → revision +1 dan antrean derivasi. Cursor maju hanya setelah batch di-ack. Batch yang sama dikirim ulang menghasilkan `unchanged`.

## POST /runs/{run_id}/complete

Request: `terminal_totals` {account_balance, account_currency, earliest_deal_time_msc, by_month[] {month, count, sum_profit, sum_commission, sum_swap, sum_fee}}.
Response: `reconciliation` {status, mismatches[]}; `balance_invariant` {status, difference}; `derivation` {status (pending/done)}.
Ketidakcocokan menandai bulan untuk diambil ulang atau ditandai bagi pengguna. Tidak ada penghapusan otomatis.

## POST /events

Request: `snapshots[]` {taken_at, balance, equity, margin, free_margin, floating, source}; `position_observations[]` {position_id, observed_at, sl, tp, volume}.
Response: jumlah diterima dan duplikat. Idempoten per kunci waktu.

## Batas awal (dapat dikonfigurasi)

Batch ≈200 record; ukuran payload dibatasi; overlap 7 hari; snapshot tiap 5 menit jika ada perubahan, plus pada event deal.
