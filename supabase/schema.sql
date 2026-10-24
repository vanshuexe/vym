-- Vyomatrix database schema for Supabase (Postgres).
-- Run once in the NEW project: Supabase dashboard -> SQL Editor -> paste -> Run.
--
-- Every table keeps the complete original record in `data` (jsonb), so no field can be lost,
-- and exposes the main fields as real columns for filtering and reporting.
-- Row Level Security is ON with no policies: the public (anon) key can read and write nothing.
-- Only the server, using the secret/service key, can touch these tables.

create table if not exists public.courses (
  id         text primary key,
  position   integer not null default 0,           -- order shown on the site
  title      text,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id             text primary key,
  invoice_number text,
  order_id       text,
  program_id     text,
  customer_email text,
  amount_inr     numeric(12,2),
  status         text,
  created_at     timestamptz,
  paid_at        timestamptz,
  payment_id     text,
  data           jsonb not null,
  updated_at     timestamptz not null default now()
);
create index if not exists invoices_order_id_idx on public.invoices (order_id);
create index if not exists invoices_customer_email_idx on public.invoices (customer_email);

create table if not exists public.media (
  id         text primary key,
  position   integer not null default 0,
  slug       text,
  title      text,
  status     text,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Contact enquiries, student registrations and academy enrolments (distinguished by `type`).
create table if not exists public.enquiries (
  id         text primary key,
  type       text,
  name       text,
  email      text,
  created_at timestamptz,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists enquiries_type_idx on public.enquiries (type);

-- password is stored as a salted scrypt hash inside `data`; never returned to browsers.
create table if not exists public.users (
  email         text primary key,
  registered_at timestamptz,
  data          jsonb not null,
  updated_at    timestamptz not null default now()
);

-- Everything that is not a list: payment gateway settings, editable page text, the enrolment page config.
create table if not exists public.cms_kv (
  key        text primary key,                     -- 'settings' | 'pages' | 'academy' | ...
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.courses   enable row level security;
alter table public.invoices  enable row level security;
alter table public.media     enable row level security;
alter table public.enquiries enable row level security;
alter table public.users     enable row level security;
alter table public.cms_kv    enable row level security;
