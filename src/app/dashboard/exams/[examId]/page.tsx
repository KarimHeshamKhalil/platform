import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StudentExamClient from "./StudentExamClient";

function ExamMessage({ title, msg, href }: { title: string; msg: string; href?: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-bold mb-3">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{msg}</p>
      {href && <Link href={href} className="underline text-primary text-sm">رجوع</Link>}
    </div>
  );
}

export default async function StudentExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: exam } = await supabase.from("exams").select("*, units!inner(id,title,courses(id,title,year))").eq("id", examId).single();
  if (!exam) return <ExamMessage title="الامتحان غير موجود" msg="تأكد أن المدرس أنشأ الامتحان وأن قاعدة البيانات تم تحديثها (add_exams_support.sql)." href="/dashboard" />;

  const courseId = (exam.units as any).courses.id;
  const courseYear = (exam.units as any).courses.year;
  const { data: profile } = await supabase.from("profiles").select("role,year").eq("id", user.id).single();
  const isAdmin = (profile as any)?.role==="admin";

  if (!isAdmin) {
    if ((profile as any)?.year && (profile as any).year !== courseYear) {
      return <ExamMessage title="غير متاح لسنتك" msg={`هذا الامتحان مخصص لـ ${courseYear} بينما حسابك ${ (profile as any).year }`} href="/dashboard" />;
    }
    const { data: enr } = await supabase.from("enrollments").select("status").eq("user_id", user.id).eq("course_id", courseId).single();
    if (enr?.status !== "approved") {
      return <ExamMessage title="الامتحان مقفل" msg="يجب الاشتراك في الكورس وانتظار موافقة الإدارة قبل فتح الامتحان." href={`/courses/${courseId}`} />;
    }
    if (!exam.is_published) {
      return <ExamMessage title="الامتحان غير منشور بعد" msg="المدرس أنشأ الامتحان لكنه لم يضغط نشر. افتح الباني واضغط نشر (يجب أن يكون كل سؤال مكتمل)." href="/dashboard" />;
    }
    const now = new Date();
    if (exam.available_from && new Date(exam.available_from) > now) {
      return <ExamMessage title="الامتحان لم يبدأ بعد" msg={`متاح من ${new Date(exam.available_from).toLocaleString("ar-EG")}`} href="/dashboard" />;
    }
    if (exam.available_until && new Date(exam.available_until) < now) {
      return <ExamMessage title="انتهى وقت الامتحان" msg={`كان متاح حتى ${new Date(exam.available_until).toLocaleString("ar-EG")}`} href="/dashboard" />;
    }
  }

  const { data: questions } = await supabase.from("questions").select("*, question_options(*)").eq("exam_id", examId).order("question_order");
  const qs = (questions||[]).map((q:any)=>({
    ...q,
    question_options: (q.question_options||[]).sort((a:any,b:any)=>a.option_order-b.option_order)
  }));
  const displayQs = exam.shuffle_questions ? [...qs].sort(()=>Math.random()-0.5) : qs;

  if (!isAdmin && displayQs.length===0) {
    return <ExamMessage title="لا يوجد أسئلة بعد" msg="المدرس لم يضف أسئلة لهذا الامتحان بعد." href="/dashboard" />;
  }

  const { data: submissions } = await supabase.from("exam_submissions").select("*").eq("exam_id", examId).eq("student_id", user.id).order("attempt_number", { ascending: false });
  const lastAttempt = submissions?.[0];
  const attemptsUsed = submissions?.length || 0;

  return <StudentExamClient exam={exam} questions={displayQs} userId={user.id} lastAttempt={lastAttempt} attemptsUsed={attemptsUsed} isAdmin={isAdmin} />;
}
