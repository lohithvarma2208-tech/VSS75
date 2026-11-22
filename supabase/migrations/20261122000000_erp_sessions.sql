begin;

create table if not exists public.erp_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null
);

create index if not exists erp_sessions_expiry_idx on public.erp_sessions (expires_at);
alter table public.erp_sessions enable row level security;
revoke all on table public.erp_sessions from public, anon, authenticated;
grant select, insert, delete on table public.erp_sessions to service_role;

commit;
