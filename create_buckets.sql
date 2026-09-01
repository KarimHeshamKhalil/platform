-- شغّل هذا في Supabase SQL Editor مرة واحدة لإنشاء الـ Storage buckets
-- يحل خطأ Bucket not found عند رفع video/pdf/proof

insert into storage.buckets (id, name, public) values ('videos','videos', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('pdfs','pdfs', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('proofs','proofs', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('covers','covers', true) on conflict (id) do nothing;

-- Policies: اسمح للأدمن والطالب المصادق عليه بالرفع/القراءة عبر Signed URL
-- نستخدم service_role للـ signedUrl لذا لا نحتاج policies معقدة، لكن هذه تسمح بالرفع من الـ client

-- احذف القديمة لو موجودة
drop policy if exists "videos_upload" on storage.objects;
drop policy if exists "videos_select" on storage.objects;
drop policy if exists "pdfs_upload" on storage.objects;
drop policy if exists "pdfs_select" on storage.objects;
drop policy if exists "proofs_upload" on storage.objects;
drop policy if exists "proofs_select" on storage.objects;
drop policy if exists "covers_all" on storage.objects;

-- السماح للـ authenticated بالرفع في هذه البuckets
create policy "videos_upload" on storage.objects for insert to authenticated with check (bucket_id in ('videos','pdfs','proofs','covers'));
create policy "videos_select" on storage.objects for select to authenticated using (bucket_id in ('videos','pdfs','proofs','covers'));
create policy "videos_update" on storage.objects for update to authenticated using (bucket_id in ('videos','pdfs','proofs'));
create policy "videos_delete" on storage.objects for delete to authenticated using (bucket_id in ('videos','pdfs','proofs'));

-- Covers public read
create policy "covers_public_select" on storage.objects for select to anon, authenticated using (bucket_id='covers');

select 'buckets created' as status;
