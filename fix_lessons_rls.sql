-- يصلح مشكلة الطالب لا يرى الـ Units/Lessons
-- السبب: policy القديمة كانت تسمح برؤية الدروس فقط للمشترك approved،
-- لذا حتى صفحة الكورس كانت تظهر "لا يوجد دروس" للطالب الغير مشترك
-- الحل: السماح للجميع برؤية عناوين الدروس، وحماية الفيديو نفسه عبر watch page + storage signedUrl

drop policy if exists "lessons_select" on public.lessons;
drop policy if exists "lessons_admin" on public.lessons;

-- الجميع يرى قائمة الدروس (العناوين فقط) - الفيديو محمي في storage + watch
create policy "lessons_select" on public.lessons for select using (true);

-- فقط الأدمن يضيف/يعدل/يحذف
create policy "lessons_admin_all" on public.lessons for all using (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role='admin')
) with check (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role='admin')
);

-- تأكد أن units أيضا مفتوحة للقراءة
drop policy if exists "units_select" on public.units;
create policy "units_select" on public.units for select using (true);

select 'lessons RLS fixed - titles visible to all, video protected by watch page' as status;
