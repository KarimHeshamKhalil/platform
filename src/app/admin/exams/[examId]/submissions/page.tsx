import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GradingClient from "./GradingClient";

export default async function SubmissionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: exam } = await supabase.from("exams").select("*, units!inner(title,courses(title,year))").eq("id", examId).single();
  if (!exam) return notFound();

  // Fetch submissions without implicit join to profiles (FK is to auth.users, not profiles)
  const { data: subs, error } = await supabase.from("exam_submissions").select("*").eq("exam_id", examId).order("submitted_at", { ascending: false }).limit(50);
  if (error) {
    // Fallback debug: still show raw error in server logs
    console.error("fetch submissions error", error);
  }

  // Fetch profiles for these student_ids separately
  const studentIds = (subs||[]).map((s:any)=>s.student_id).filter(Boolean);
  let profilesMap: Record<string, any> = {};
  if (studentIds.length) {
    const { data: profs } = await supabase.from("profiles").select("id,username,phone").in("id", studentIds);
    (profs||[]).forEach((p:any)=>{ profilesMap[p.id]=p; });
  }

  const enriched = (subs||[]).map((s:any)=>({
    ...s,
    profiles: profilesMap[s.student_id] || { username: s.student_id.slice(0,8), phone: "" }
  }));

  const withPending = await Promise.all(enriched.map(async (s:any)=>{
    const { data: answers } = await supabase.from("submission_answers").select("id,is_correct").eq("submission_id", s.id);
    const pending = (answers||[]).filter((a:any)=>a.is_correct===null).length;
    return { ...s, pending, total: answers?.length||0 };
  }));

  return <GradingClient exam={exam} submissions={withPending} />;
}
