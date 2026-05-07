# Supabase schema

BillAudit uses Supabase as the database provider. The Express backend writes audits and leads with a server-only key from `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

## Required environment variables

```bash
SUPABASE_URL=
# or NEXT_PUBLIC_SUPABASE_URL= for the project URL only
SUPABASE_SECRET_KEY=
# or
SUPABASE_SERVICE_ROLE_KEY=
```

Do not expose `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Tables

Run this SQL in the Supabase SQL editor:

```sql
create table if not exists public.audits (
  audit_id uuid primary key,
  payload jsonb not null,
  savings_level text not null check (savings_level in ('high', 'moderate', 'optimal')),
  total_monthly_savings numeric not null default 0,
  total_annual_savings numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists audits_created_at_idx on public.audits (created_at desc);
create index if not exists audits_savings_level_idx on public.audits (savings_level);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  company text,
  role text,
  team_size integer,
  audit_id uuid not null references public.audits (audit_id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists leads_audit_id_idx on public.leads (audit_id);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
```

## RLS note

The current server uses a server-only secret/service role key, so API writes do not depend on browser-side Row Level Security policies. If you later expose Supabase directly to the browser, add explicit RLS policies first.
