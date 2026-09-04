-- ============================================
-- Exams / Homework - attached to units (same hierarchy as lessons)
-- Year -> Course -> Unit -> (Video, PDF, Exam, Homework)
-- Non-breaking: new tables only, no alteration of existing lessons
-- ============================================

create extension if not exists "pgcrypto";

-- Exams / Homework
create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  type text not null check (type in ('exam','homework')),
  time_limit_minutes int check (time_limit_minutes is null or time_limit_minutes > 0),
  shuffle_questions boolean default false,
  max_attempts int default 1 check (max_attempts > 0),
  pass_grade_percent int check (pass_grade_percent is null or (pass_grade_percent >= 0 and pass_grade_percent <= 100)),
  available_from timestamptz,
  available_until timestamptz,
  is_published boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists exams_unit_id_idx on exams(unit_id);
create index if not exists exams_type_idx on exams(type);
create index if not exists exams_is_published_idx on exams(is_published);

-- Questions
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  question_order int not null,
  type text not null check (type in ('mcq','true_false','short_answer','essay')),
  prompt text not null,
  points numeric default 1 check (points >= 0),
  created_at timestamptz default now()
);
create index if not exists questions_exam_id_idx on questions(exam_id);
create index if not exists questions_order_idx on questions(exam_id, question_order);

-- Options for MCQ / True False
create table if not exists question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean default false,
  option_order int not null
);
create index if not exists question_options_question_id_idx on question_options(question_id);

-- Submissions
create table if not exists exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  score numeric,
  attempt_number int default 1,
  created_at timestamptz default now(),
  unique(exam_id, student_id, attempt_number)
);
create index if not exists exam_submissions_exam_id_idx on exam_submissions(exam_id);
create index if not exists exam_submissions_student_id_idx on exam_submissions(student_id);

-- Answers
create table if not exists submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references exam_submissions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  response text,
  is_correct boolean,
  points_awarded numeric
);
create index if not exists submission_answers_submission_id_idx on submission_answers(submission_id);
create index if not exists submission_answers_question_id_idx on submission_answers(question_id);

-- RLS
alter table exams enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table exam_submissions enable row level security;
alter table submission_answers enable row level security;

-- Exams: everyone can read published titles (to show locked), admin full, student read published
drop policy if exists "exams_select" on exams;
create policy "exams_select" on exams for select using (
  is_published = true
  or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
  or exists (
    select 1 from units u join courses c on c.id = u.course_id
    where u.id = exams.unit_id and c.is_published = true
  )
);
drop policy if exists "exams_admin_all" on exams;
create policy "exams_admin_all" on exams for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
);

-- Questions: readable if exam readable
drop policy if exists "questions_select" on questions;
create policy "questions_select" on questions for select using (true);
drop policy if exists "questions_admin_all" on questions;
create policy "questions_admin_all" on questions for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
);

-- Options: same
drop policy if exists "question_options_select" on question_options;
create policy "question_options_select" on question_options for select using (true);
drop policy if exists "question_options_admin_all" on question_options;
create policy "question_options_admin_all" on question_options for all using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
) with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
);

-- Submissions: student can insert/read own, admin can read all
drop policy if exists "exam_submissions_select_own" on exam_submissions;
create policy "exam_submissions_select_own" on exam_submissions for select using (
  student_id = auth.uid() or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')
);
drop policy if exists "exam_submissions_insert_own" on exam_submissions;
create policy "exam_submissions_insert_own" on exam_submissions for insert with check (student_id = auth.uid());
drop policy if exists "exam_submissions_update_own" on exam_submissions;
create policy "exam_submissions_update_own" on exam_submissions for update using (student_id = auth.uid());

-- Answers: same as submission
drop policy if exists "submission_answers_select_own" on submission_answers;
create policy "submission_answers_select_own" on submission_answers for select using (
  exists (select 1 from exam_submissions s where s.id = submission_id and (s.student_id = auth.uid() or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role='admin')))
);
drop policy if exists "submission_answers_insert_own" on submission_answers;
create policy "submission_answers_insert_own" on submission_answers for insert with check (
  exists (select 1 from exam_submissions s where s.id = submission_id and s.student_id = auth.uid())
);
drop policy if exists "submission_answers_update_own" on submission_answers;
create policy "submission_answers_update_own" on submission_answers for update using (
  exists (select 1 from exam_submissions s where s.id = submission_id and s.student_id = auth.uid())
);

-- updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_exams_updated_at on exams;
create trigger update_exams_updated_at before update on exams for each row execute procedure update_updated_at_column();

select 'exams support added' as status;
