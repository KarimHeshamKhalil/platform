-- Admin grading for short_answer / essay
alter table submission_answers add column if not exists admin_note text;

-- Allow admin to update any answer
drop policy if exists "submission_answers_admin_update" on submission_answers;
create policy "submission_answers_admin_update" on submission_answers for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
);

-- Allow admin to update submissions score
drop policy if exists "exam_submissions_admin_update" on exam_submissions;
create policy "exam_submissions_admin_update" on exam_submissions for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
);

select 'admin grading enabled' as status;
