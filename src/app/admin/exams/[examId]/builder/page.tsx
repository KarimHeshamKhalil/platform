import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import BuilderClient from "./BuilderClient";

export default async function ExamBuilderPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: exam } = await supabase.from("exams").select("*, units!inner(id,title,courses(id,title,year))").eq("id", examId).single();
  if (!exam) return notFound();

  const { data: questions } = await supabase.from("questions").select("*, question_options(*)").eq("exam_id", examId).order("question_order");
  // Ensure options sorted
  const sorted = (questions||[]).map((q:any)=>({
    ...q,
    question_options: (q.question_options||[]).sort((a:any,b:any)=>a.option_order-b.option_order)
  })).sort((a:any,b:any)=>a.question_order-b.question_order);

  return <BuilderClient exam={exam} initialQuestions={sorted} />;
}
