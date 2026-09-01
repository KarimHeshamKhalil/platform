-- إضافة صورة غلاف للـ Unit
alter table public.units add column if not exists cover_url text;

select 'units cover_url added' as status;
