# DATA_MODEL

Diturunkan dari `docs/MASTER_SPEC.md` v0.1. Ini model logis; migration SQL belum ada. Semua tabel memiliki `user_id uuid not null references auth.users` dan RLS `user_id = auth.uid()` (SELECT/INSERT/UPDATE/DELETE), kecuali dinyatakan lain. Tabel yang ditulis connector hanya ditulis lewat server dengan `user_id` dari token.

## Akun dan koneksi

| Tabel | Kolom inti | Kunci / constraint |
|---|---|---|
| `profiles` | timezone (default Asia/Jakarta, K-01), default_period_id, small_sample_threshold (default 30, K-02) | PK user_id |
| `trading_accounts` | login, server, broker, account_type_label, currency, margin_mode, leverage, display_divisor (default 1), is_demo | UNIQUE(user_id, login, server) |
| `connector_registrations` | account_id, token_prefix, token_hash, scopes, device_label, last_seen_at, revoked_at | UNIQUE(token_prefix); FK account |
| `sync_state` | account_id, cursor_time_msc, cursor_ticket, overlap_days, last_success_at, history_earliest_seen, status | PK account_id |
| `sync_runs` | account_id, mode, status, acked_seq, counts, error, started_at | partial UNIQUE: satu run aktif per akun |
| `sync_logs` | run_id, level, message, context (tanpa secret) | FK run |

## Raw

| Tabel | Kolom inti | Kunci / constraint |
|---|---|---|
| `raw_deals` | deal_ticket, order_ticket, position_id, time_msc, type, entry, symbol, volume, price, profit, commission, swap, fee, magic, comment, reason, class, content_hash, revision, raw jsonb | UNIQUE(account_id, deal_ticket) |
| `raw_record_revisions` | record_ref, revision, raw jsonb, content_hash, seen_at | FK record |
| `raw_orders` | order_ticket, position_id, type, state, volume, price, sl, tp, time_setup_msc, time_done_msc, raw jsonb, content_hash | UNIQUE(account_id, order_ticket) |
| `symbol_specs` | symbol, contract_size, tick_size, tick_value, tick_value_profit, tick_value_loss, volume_step, volume_min, volume_max, currency_base, currency_profit, currency_margin, captured_at | UNIQUE(account_id, symbol, captured_at) |
| `position_observations` | position_id, observed_at, sl, tp, volume, source | UNIQUE(account_id, position_id, observed_at) |
| `account_snapshots` | taken_at, balance, equity, margin, free_margin, floating, source (timer/trade_event) | UNIQUE(account_id, taken_at, source) |

## Turunan (rebuildable)

| Tabel | Kolom inti | Catatan |
|---|---|---|
| `deal_allocations` | deal_id, position_key, volume, profit_alloc, commission_alloc, swap_alloc, fee_alloc, allocation_method | Invarian: Σ alokasi per deal = nilai deal per komponen |
| `positions` | account_id, mt5_position_id, cycle_key, symbol, direction, opened_at, closed_at, status, volume_in, volume_out, net_pl, flags (multi_cycle, inout_split, ambiguous), initial_risk_amount, risk_status, risk_provenance, equity_before_entry, equity_status, equity_source, equity_staleness_sec | UNIQUE(account_id, mt5_position_id, cycle_key) |
| `derivation_jobs` | target_type, target_key, reason, status, attempts, last_error | Dibuat dalam transaksi upsert raw |

## Keputusan pengguna dan grouping

| Tabel | Kolom inti | Catatan |
|---|---|---|
| `setups` | strategy_id, title, notes, status (open/completed/merged_into), merged_into_id, opened_at, closed_at, grouping_state (auto_single/confirmed), aggregates, source_hash, calc_version | Agregat adalah cache |
| `setup_assignments` | account_id, mt5_position_id, cycle_key, setup_id, origin (auto_default/suggestion_accepted/manual) | PK (account_id, mt5_position_id, cycle_key); mereferensikan kunci alami, bukan id turunan |
| `grouping_suggestions` | kind, rule_id, rule_version, evidence jsonb, confidence, status, fingerprint | UNIQUE(user_id, fingerprint) |
| `grouping_suggestion_positions` | suggestion_id, position key | |
| `grouping_events` | action, setup ids, before/after jsonb, actor, at | Append-only (tanpa UPDATE/DELETE) |
| `strategies` | name, description, active | Entitas opsional (K-03); `setups.strategy_id` nullable |
| `evaluation_periods` | name, starts_on_local, ends_on_local, timezone (default Asia/Jakarta, K-01), is_default | Tanpa FK ke setup |

## Plan dan review

| Tabel | Kolom inti | Catatan |
|---|---|---|
| `plan_versions` | version_no, name, status, effective_from, locked_at, based_on_id | Terkunci saat review pertama dibuat |
| `plan_item_definitions` | created_at, replaces_id | Identitas stabil lintas versi |
| `plan_items` | version_id, definition_id, kind, label, description, mandatory, active, sort_order, category, field_type, options jsonb | Trigger: tidak dapat diubah jika versi terkunci |
| `setup_reviews` | setup_id, plan_version_id, status (draft/final), notes, finalized_at, data_changed_since_review | |
| `review_item_values` | review_id, plan_item_id, status (pass/fail/na/not_evaluated), value_text, value_number, value_json, note | FK plan_item RESTRICT |
| `setup_attachments` | setup_id, storage_path, mime, size | Bucket privat; path `{user_id}/{setup_id}/…` |

## Keamanan

- RLS pada semua tabel di atas. Policy Storage berdasarkan folder pertama path = `auth.uid()`.
- `grouping_events` dan `raw_record_revisions` append-only.
- Modul admin (service-role) hanya diimpor oleh route handler connector dan worker server.
- Catatan implementasi: tabel yang aman dibuat di fondasi (profil, akun, strategi, periode, plan, connector) dipisah dari tabel raw dan turunan; migrasi tabel raw/turunan menunggu validasi V-01..V-10 hanya untuk bagian yang bergantung padanya (alokasi INOUT, klasifikasi tipe deal).
