
-- Create tables for the Formal verification platform

-- Users table (managed by Supabase Auth, this extends it with additional fields)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null
);

-- Projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key not null,
  name text not null,
  description text,
  code text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Verification results table
create table if not exists public.verification_results (
  id uuid default gen_random_uuid() primary key not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  level text not null check (level in ('simple', 'medium', 'advanced')),
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  results jsonb default '[]'::jsonb not null,
  logs text[] default '{}'::text[] not null,
  created_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);

-- Create RLS (Row Level Security) policies
-- Enable RLS on tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.verification_results enable row level security;

-- Set up access policies
-- Profiles can only be read and updated by their owners
create policy "Profiles are viewable by owners only"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles can be updated by owners only"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects can only be read, updated and deleted by their owners
create policy "Projects are viewable by owners only"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Projects can be created by any logged in user"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Projects can be updated by owners only"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Projects can be deleted by owners only"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Verification results can only be read by project owners
create policy "Verification results are viewable by project owners only"
  on public.verification_results for select
  using (auth.uid() = (select user_id from public.projects where id = project_id));

create policy "Verification results can be created by project owners"
  on public.verification_results for insert
  with check (auth.uid() = (select user_id from public.projects where id = project_id));

-- Add some useful functions
-- Function to get projects for the current user
create or replace function public.get_user_projects()
returns setof public.projects
language sql security definer
as $$
  select * from public.projects where user_id = auth.uid() order by updated_at desc;
$$;

-- Function to get verification results for a project
create or replace function public.get_project_verification_results(p_project_id uuid)
returns setof public.verification_results
language sql security definer
as $$
  select * from public.verification_results 
  where project_id = p_project_id 
  order by created_at desc;
$$;

-- Setup public access
grant usage on schema public to anon, authenticated;
grant all on public.profiles to anon, authenticated;
grant all on public.projects to anon, authenticated;
grant all on public.verification_results to anon, authenticated;
grant execute on function public.get_user_projects to anon, authenticated;
grant execute on function public.get_project_verification_results to anon, authenticated;

-- Create trigger to create profile when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
