# Supabase Postgres schema

BillAudit uses Supabase Postgres through Drizzle ORM. Next route handlers on Vercel and the local Express backend both write audits and leads with a server-only Postgres connection string.

## Required environment variables

```bash
DATABASE_URL=postgresql://...
```

Do not expose `DATABASE_URL` to browser code.

## Tables

The canonical Drizzle schema lives in `server/db/schema.ts`. You can apply it with:

```bash
npm run db:push
```

Equivalent SQL:

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
  lead_summary text,
  contact_priority text not null default 'standard',
  created_at timestamptz not null default now()
);

create index if not exists leads_audit_id_idx on public.leads (audit_id);
create index if not exists leads_created_at_idx on public.leads (created_at desc);
```

## Access note

The current server connects directly to Postgres with a server-only connection string. If you later expose Supabase directly to the browser, add explicit RLS policies first.

## Deployment note

Vercel builds need `DATABASE_URL` available for production runtime. CI uses a safe placeholder only to type-check and build; real audit persistence requires the Supabase connection string in the deployment environment.
