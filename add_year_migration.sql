-- Migration: إضافة السنة الدراسية للطالب
-- شغّل هذا في Supabase SQL Editor لو قاعدة البيانات موجودة بالفعل

-- 1. إضافة عمود السنة
alter table public.profiles add column if not exists year text check (year in ('اولي ثانوي','تانية ثانوي','تالتة ثانوي'));

-- 2. عمل index للبحث السريع
create index if not exists profiles_year_idx on public.profiles (year);

-- 3. تحديث الـ trigger ليدعم year
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

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
  if v_year not in ('اولي ثانوي','تانية ثانوي','تالتة ثانوي') then
    v_year := null;
  end if;
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. تحديث المستخدمين الحاليين (اختياري - اجعلهم تالتة ثانوي مؤقتا)
-- update public.profiles set year = 'تالتة ثانوي' where year is null and role='student';
