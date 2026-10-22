# PrepPulse — Exam Revision Planner

PrepPulse helps students turn exam dates, subjects, and weaker topics into a manageable revision schedule. It includes a study dashboard, session tracking, focus and break tools, and optional AI-assisted topic suggestions.

## Features

- Sign up and log in with Supabase Authentication
- Save subjects, exam dates, profile details, and topics to revise
- Generate a four-week study plan, with Gemini topic suggestions when configured
- Review upcoming sessions and mark sessions complete
- Use the adjustable break timer, reading modes, and light/dark themes

## Tech stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Data and authentication: Supabase
- Optional AI topic suggestions: Google Gemini API

## Requirements

- Node.js and npm
- A Supabase project with Email/Password authentication enabled
- A Gemini API key for AI topic suggestions (optional; the planner has fallback topics)

## Supabase setup

In the Supabase SQL Editor, run the following to create the tables and per-user access policies used by the app:

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  weekly_free_hours integer not null default 8 check (weekly_free_hours between 1 and 80)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weak_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  confidence integer not null default 2 check (confidence between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  study_date date not null,
  start_time time not null,
  end_time time not null,
  topic text not null,
  break_minutes integer not null default 10 check (break_minutes between 0 and 60),
  status text not null default 'planned' check (status in ('planned', 'completed')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.weak_topics enable row level security;
alter table public.study_sessions enable row level security;

drop policy if exists "Users manage their own profile" on public.profiles;
drop policy if exists "Users manage their own subjects" on public.subjects;
drop policy if exists "Users manage their own weak topics" on public.weak_topics;
drop policy if exists "Users manage their own study sessions" on public.study_sessions;

create policy "Users manage their own profile"
  on public.profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage their own subjects"
  on public.subjects for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own weak topics"
  on public.weak_topics for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own study sessions"
  on public.study_sessions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

The policy statements can be rerun safely. `create table if not exists` does not alter an existing table's columns.

## Configure environment variables

Create `backend/.env` (this file is ignored by Git) and add your own Supabase project values:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
PORT=4000
```

`GEMINI_API_KEY` is optional. Keep real credentials in local environment files or your hosting provider's secret settings; never commit them.

The frontend uses `http://localhost:4000` by default for the API. To change it, create `frontend/.env.local` with:

```env
VITE_API_BASE_URL=http://localhost:4000
```

## Run locally

Open two terminal windows from the project root.

Terminal 1 — backend:

```bash
cd backend
npm install
npm run dev
```

Terminal 2 — frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The backend listens on `http://localhost:4000`; its health endpoint is `/api/health`.

## Build

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

## Security notes

- Do not commit `backend/.env`, `frontend/.env.local`, API keys, or service-role keys.
- The backend uses the Supabase publishable key and forwards the signed-in user's access token for database requests. Row Level Security must remain enabled on the app tables.
- Before deploying publicly, configure the frontend API URL, backend environment variables, and allowed CORS origins for your deployment.
