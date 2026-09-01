-- ============================================
-- منصة الأستاذ - ثانوية عامة
-- Year -> Unit -> (Video, PDF)
-- ============================================

-- Enable UUID
create extension if not exists "uuid-ossp";

-- PROFILES: linked to auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  phone text unique,
  role text not null default 'student' check (role in ('student','admin')),
  year text check (year in ('اولي ثانوي','تانية ثانوي','تالتة ثانوي')),
  created_at timestamp with time zone default now()
);
create unique index if not exists profiles_phone_unique on profiles (phone) where phone is not null and phone <> '';
create index if not exists profiles_year_idx on profiles (year);

-- COURSES: each course belongs to a year (اولي/تانية/تالتة ثانوي)
create table courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  year text not null check (year in ('اولي ثانوي','تانية ثانوي','تالتة ثانوي')),
  cover_url text,
  price integer not null default 0,
  is_published boolean default true,
  created_at timestamp with time zone default now()
);

-- UNITS: inside a course
create table units (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  cover_url text,
  order_index integer not null default 0,
  created_at timestamp with time zone default now()
);

-- LESSONS: inside a unit, can be video or pdf
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  type text not null check (type in ('video','pdf')),
  video_url text, -- path in storage bucket 'videos'
  pdf_url text,   -- path in storage bucket 'pdfs'
  order_index integer not null default 0,
  created_at timestamp with time zone default now()
);

-- ENROLLMENTS: student subscribes to a course, uploads screenshot
create table enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  screenshot_url text, -- path in storage bucket 'proofs'
  admin_note text,
  created_at timestamp with time zone default now(),
  unique(user_id, course_id)
);

-- STORAGE BUCKETS (create via dashboard or SQL)
-- insert into storage.buckets (id, name, public) values ('videos','videos', false);
-- insert into storage.buckets (id, name, public) values ('pdfs','pdfs', false);
-- insert into storage.buckets (id, name, public) values ('proofs','proofs', false);
-- insert into storage.buckets (id, name, public) values ('covers','covers', true);

-- RLS ENABLE
alter table profiles enable row level security;
alter table courses enable row level security;
alter table units enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;

-- POLICIES

-- profiles: users can read all, update own
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- courses: everyone can read published
create policy "courses_select" on courses for select using (is_published = true or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin'));
create policy "courses_admin_all" on courses for all using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin'));

-- units: readable if course is readable
create policy "units_select" on units for select using (true);
create policy "units_admin" on units for all using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin'));

-- lessons: titles visible to all (to show curriculum), video itself protected via storage signedUrl + watch page check
create policy "lessons_select" on lessons for select using (true);
create policy "lessons_admin_all" on lessons for all using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')) with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin'));

-- enrollments: user can read own, insert own, admin can read all
create policy "enrollments_select_own" on enrollments for select using (user_id = auth.uid() or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin'));
create policy "enrollments_insert_own" on enrollments for insert with check (user_id = auth.uid());
create policy "enrollments_update_admin" on enrollments for update using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin'));
create policy "enrollments_update_own_pending" on enrollments for update using (user_id = auth.uid() and status='pending') with check (user_id = auth.uid());

-- STORAGE POLICIES (need to add after buckets creation)
-- Example for private buckets: only approved students + admin can read via signed URL (service role)
-- For proofs: user can upload own proof
-- create policy "proofs_upload" on storage.objects for insert with check (bucket_id='proofs' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "proofs_select" on storage.objects for select using (bucket_id='proofs' and (auth.uid()::text = (storage.foldername(name))[1] or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')));

-- FUNCTION to handle new user -> auto create profile (username/phone from metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_username text;
  v_phone text;
  v_role text;
  v_year text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1))));
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone','')), '');
  v_role := coalesce(new.raw_user_meta_data->>'role','student');
  v_year := nullif(trim(coalesce(new.raw_user_meta_data->>'year','')), '');
  if v_year not in ('اولي ثانوي','تانية ثانوي','تالتة ثانوي') then v_year := null; end if;
  if v_username is null or v_username = '' then
    v_username := split_part(new.email,'@',1);
  end if;
  insert into public.profiles (id, username, phone, role, year)
  values (new.id, v_username, v_phone, v_role, v_year)
  on conflict (id) do update set year = excluded.year;
  return new;
exception
  when unique_violation then
    raise exception 'اسم المستخدم أو رقم الموبايل مستخدم من قبل' using errcode = '23505';
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, SQLERRM;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper to make a user admin (run manually)
-- update profiles set role='admin' where username='ahmed';
