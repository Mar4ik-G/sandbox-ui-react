# Sandbox UI React

Family budgeting app built with React + Vite + Supabase. You can add expenses, invite your partner, and manage multiple households. Transactions, households, and invites live in Supabase; UI preferences live in `localStorage`.

## Supabase setup

1. Create a Supabase project if you do not have one yet.
2. Run the SQL below inside the project (SQL Editor → `New query`). It provisions the schema used by the app.

   ```sql
   create extension if not exists pgcrypto;

   create table if not exists public.profiles (
     id uuid primary key references auth.users on delete cascade,
     email text,
     default_household_id uuid,
     inserted_at timestamptz default now()
   );

   create table if not exists public.households (
     id uuid primary key default gen_random_uuid(),
     name text not null,
     owner_id uuid references profiles(id) on delete cascade,
     created_at timestamptz default now()
   );

   create table if not exists public.household_members (
     household_id uuid references households(id) on delete cascade,
     profile_id uuid references profiles(id) on delete cascade,
     role text not null default 'member',
     created_at timestamptz default now(),
     primary key (household_id, profile_id)
   );

   create table if not exists public.household_invites (
     id uuid primary key default gen_random_uuid(),
     household_id uuid references households(id) on delete cascade,
     email text,
     token text unique not null,
     status text not null default 'pending',
     accepted_profile uuid references profiles(id),
     created_at timestamptz default now()
   );

   create table if not exists public.transactions (
     id uuid primary key default gen_random_uuid(),
     description text not null,
     amount numeric not null,
     category text not null,
     date date not null default now(),
     household_id uuid not null references households(id) on delete cascade,
     created_at timestamptz default now()
   );

   alter table public.transactions enable row level security;
   alter table public.profiles enable row level security;
   alter table public.households enable row level security;
   alter table public.household_members enable row level security;
   alter table public.household_invites enable row level security;

   create policy "Public profiles access" on public.profiles
     using (auth.uid() = id);

   create policy "Households access" on public.households
     using (exists (
       select 1 from public.household_members hm
       where hm.household_id = households.id and hm.profile_id = auth.uid()
     ));

   create policy "Members access" on public.household_members
     using (profile_id = auth.uid())
     with check (profile_id = auth.uid());

   create policy "Invite read" on public.household_invites
     for select
     using (true);

   create policy "Invite insert" on public.household_invites
     for insert with check (
       exists (
         select 1 from public.household_members hm
         where hm.household_id = household_invites.household_id
           and hm.profile_id = auth.uid()
           and hm.role = 'owner'
       )
     );

   create policy "Transactions access" on public.transactions
     using (exists (
       select 1 from public.household_members hm
       where hm.household_id = transactions.household_id and hm.profile_id = auth.uid()
     ))
     with check (exists (
       select 1 from public.household_members hm
       where hm.household_id = transactions.household_id and hm.profile_id = auth.uid()
     ));
   ```

3. Create an `.env` file (or `.env.local`) in the project root and add your credentials:

   ```bash
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

4. Restart `npm run dev` after changing env variables so Vite can load them.

## Development

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build for production: `npm run build`

### Auth flow

- The app uses Supabase email magic links. Users can accept invites by opening `?invite=TOKEN` and signing in with the email used in the invite.
- The first time a user signs in, we create their profile and an owner household automatically.
- Preferences (language, currency, theme) remain device-local in `localStorage`.
