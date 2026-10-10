-- ============================================================
-- 0001_config_foundation.sql
-- Tahap B: config tables + uniform RLS + profiles auto-create trigger.
-- Derived from docs/DATA_MODEL.md. Types inferred (conservative defaults).
-- Safe to create now: does NOT touch raw/derived tables (those wait for
-- V-01..V-10 per DATA_MODEL "Keamanan").
-- Apply once via Supabase Dashboard -> SQL Editor -> Run.
-- ============================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ============================================================
-- evaluation_periods
-- ============================================================
create table if not exists evaluation_periods (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  starts_on_local date,
  ends_on_local   date,
  timezone        text not null default 'Asia/Jakarta',   -- K-01
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- strategies (optional user label, K-03)
-- ============================================================
create table if not exists strategies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- trading_accounts  (display_divisor default 1 — C-01, Cent stored as-is)
-- ============================================================
create table if not exists trading_accounts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  login              text not null,
  server             text not null,
  broker             text,
  account_type_label text,
  currency           text,
  margin_mode        text,
  leverage           integer,
  display_divisor    numeric not null default 1,
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, login, server)
);

-- ============================================================
-- profiles  (PK = user_id; defaults Asia/Jakarta + 30)
-- ============================================================
create table if not exists profiles (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  timezone               text not null default 'Asia/Jakarta',      -- K-01
  default_period_id      uuid references evaluation_periods(id) on delete set null,
  small_sample_threshold integer not null default 30,               -- K-02
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ============================================================
-- RLS: enable on all tables
-- ============================================================
alter table evaluation_periods enable row level security;
alter table strategies        enable row level security;
alter table trading_accounts  enable row level security;
alter table profiles          enable row level security;

-- Uniform policy pattern: user_id = auth.uid() for all four operations.
-- evaluation_periods
create policy "ep_sel" on evaluation_periods for select using (user_id = auth.uid());
create policy "ep_ins" on evaluation_periods for insert with check (user_id = auth.uid());
create policy "ep_upd" on evaluation_periods for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ep_del" on evaluation_periods for delete using (user_id = auth.uid());

-- strategies
create policy "st_sel" on strategies for select using (user_id = auth.uid());
create policy "st_ins" on strategies for insert with check (user_id = auth.uid());
create policy "st_upd" on strategies for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "st_del" on strategies for delete using (user_id = auth.uid());

-- trading_accounts
create policy "ta_sel" on trading_accounts for select using (user_id = auth.uid());
create policy "ta_ins" on trading_accounts for insert with check (user_id = auth.uid());
create policy "ta_upd" on trading_accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ta_del" on trading_accounts for delete using (user_id = auth.uid());

-- profiles (user_id is the PK; same pattern)
create policy "pr_sel" on profiles for select using (user_id = auth.uid());
create policy "pr_ins" on profiles for insert with check (user_id = auth.uid());
create policy "pr_upd" on profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "pr_del" on profiles for delete using (user_id = auth.uid());

-- ============================================================
-- Trigger: auto-create profile on auth.users insert
-- (SECURITY DEFINER, search_path pinned — standard Supabase pattern)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, timezone, small_sample_threshold)
  values (new.id, 'Asia/Jakarta', 30)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- updated_at maintenance helper (applied to all four tables)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array['evaluation_periods','strategies','trading_accounts','profiles'])
  loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format('create trigger set_updated_at before update on %I for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;
