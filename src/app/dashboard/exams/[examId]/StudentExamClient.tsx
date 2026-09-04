"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function StudentExamClient({ exam, questions, userId, lastAttempt, attemptsUsed, isAdmin }: { exam:any; questions:any[]; userId:string; lastAttempt:any; attemptsUsed:number; isAdmin:boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [gradedAnswers, setGradedAnswers] = useState<any[]>([]);

  const autoQs = questions.filter((q:any)=>q.type==="mcq"||q.type==="true_false");
  const writtenQs = questions.filter((q:any)=>q.type==="short_answer"||q.type==="essay");
  const autoTotal = autoQs.reduce((s:any,q:any)=>s+Number(q.points),0);

  const canAttempt = isAdmin || attemptsUsed < (exam.max_attempts || 1);

  // If student already submitted, load latest graded answers for display
  useEffect(()=>{
    async function loadGraded(){
      if (!lastAttempt) return;
      const supabase = createClient();
      const { data } = await supabase.from("submission_answers").select("*, questions(prompt,points,type)").eq("submission_id", lastAttempt.id);
      if (data) setGradedAnswers(data);
    }
    loadGraded();
  }, [lastAttempt]);

  async function submit() {
    if (!canAttempt) return;
    setSubmitting(true);
    const supabase = createClient();
    const attempt = attemptsUsed + 1;
    const { data: sub } = await supabase.from("exam_submissions").insert({
      exam_id: exam.id, student_id: userId, attempt_number: attempt
    }).select("id").single();
    if (!sub) { setSubmitting(false); return; }

    let autoScore = 0;
    for (const q of questions) {
      const resp = answers[q.id] || "";
      let is_correct: boolean | null = null;
      let points = 0;
      if (q.type==="mcq" || q.type==="true_false") {
        const correct = q.question_options.find((o:any)=>o.is_correct);
        is_correct = resp === correct?.id;
        if (is_correct) points = Number(q.points);
        autoScore += points;
      }
      await supabase.from("submission_answers").insert({
        submission_id: sub.id, question_id: q.id, response: resp, is_correct, points_awarded: points
      });
    }
    await supabase.from("exam_submissions").update({ submitted_at: new Date().toISOString(), score: autoScore }).eq("id", sub.id);
    setResult({ autoScore, autoTotal, pending: writtenQs.length });
    setSubmitting(false);
  }

  // Show graded result after admin correction
  if (lastAttempt && !result) {
    const autoScore = gradedAnswers.filter((a:any)=> a.is_correct!==null).reduce((s:number,a:any)=>s+Number(a.points_awarded||0),0);
    const pending = gradedAnswers.filter((a:any)=> a.is_correct===null).length;
    const totalAuto = autoQs.reduce((s:number,q:any)=>s+Number(q.points),0);
    const totalWritten = writtenQs.reduce((s:number,q:any)=>s+Number(q.points),0);
    const gradedWritten = gradedAnswers.filter((a:any)=> a.questions?.type==="short_answer"||a.questions?.type==="essay").filter((a:any)=>a.is_correct!==null);
    const hasGradedWritten = gradedWritten.length>0 || pending===0 && writtenQs.length>0;

    // If submission exists, show result card instead of form
    if (lastAttempt.submitted_at) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
          <Card>
            <CardHeader><CardTitle>نتيجة آخر محاولة</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">درجة الأسئلة الموضوعية: {autoScore} / {totalAuto} {exam.pass_grade_percent ? `— ${autoScore/totalAuto*100 >= exam.pass_grade_percent ? "ناجح" : "راسب"} (للنجاح ${exam.pass_grade_percent}%)` : ""}</p>
              {writtenQs.length>0 && pending>0 && <p className="text-sm bg-orange-50 border border-orange-200 rounded p-2">لديك {pending} أسئلة مقالية قيد التصحيح بواسطة المدرس. الدرجة النهائية ستظهر بعد التصحيح.</p>}
              {writtenQs.length>0 && pending===0 && hasGradedWritten && <p className="text-sm bg-green-50 border rounded p-2">تم تصحيح الأسئلة المقالية — الدرجة الكاملة: {(autoScore + gradedWritten.reduce((s:number,a:any)=>s+Number(a.points_awarded||0),0))} / {totalAuto + totalWritten}</p>}
              <Button variant="outline" onClick={()=>window.location.href="/dashboard"}>رجوع للوحة</Button>
            </CardContent>
          </Card>
          {gradedAnswers.length>0 && (
            <div className="space-y-3">
              <h3 className="font-bold">تفاصيل الإجابات</h3>
              {gradedAnswers.map((a:any)=>{
                const qType = a.questions?.type;
                const isWritten = qType==="short_answer" || qType==="essay";
                return (
                <Card key={a.id} className="overflow-hidden">
                  <CardContent className="pt-4 space-y-2">
                    <p className="font-medium text-sm break-words whitespace-pre-wrap">{a.questions?.prompt}</p>
                    {isWritten ? (
                      <div className="bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border rounded-lg p-3 w-full overflow-hidden">
                        <p className="text-xs text-muted-foreground mb-1">إجابتك:</p>
                        <p className="text-sm whitespace-pre-wrap break-words break-all max-w-full leading-relaxed bg-zinc-50 rounded p-2 border min-h-[40px]">{a.response?.trim() ? a.response : "— لم يجب"}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {a.is_correct ? <Badge className="bg-green-600">صحيح ✓</Badge> : a.is_correct===false ? <Badge variant="destructive">خطأ ✗</Badge> : <Badge variant="secondary">قيد التصحيح</Badge>}
                        <span className="text-sm text-muted-foreground">{a.is_correct!==null ? `${a.points_awarded ?? 0} نقطة` : ""}</span>
                      </div>
                    )}
                    {a.is_correct===null && isWritten && <Badge variant="secondary">قيد التصحيح</Badge>}
                    {a.admin_note && <p className="text-sm bg-blue-50 border rounded p-2 break-words whitespace-pre-wrap">ملاحظة المدرس: {a.admin_note}</p>}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
          {canAttempt && <Button onClick={()=>window.location.reload()} className="w-full">إعادة المحاولة ({attemptsUsed}/{exam.max_attempts})</Button>}
        </div>
      );
    }
  }

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card><CardHeader><CardTitle>تم التسليم ✓</CardTitle></CardHeader><CardContent className="space-y-2">
          <p>درجة الأسئلة الموضوعية: {result.autoScore} / {result.autoTotal}</p>
          {result.pending>0 && <p className="text-sm bg-orange-50 border rounded p-2">{result.pending} أسئلة مقالية قيد التصحيح — ستظهر النتيجة النهائية بعد تصحيح المدرس من لوحة الإدارة.</p>}
          {result.pending===0 && exam.pass_grade_percent && <p>{result.autoScore / result.autoTotal * 100 >= exam.pass_grade_percent ? "ناجح" : "راسب"}</p>}
          <Button className="mt-4" onClick={()=>window.location.href="/dashboard"}>رجوع</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{exam.title} <Badge>{exam.type==="exam"?"امتحان":"واجب"}</Badge></h1>
        <p className="text-xs text-muted-foreground">الموضوعي: {autoQs.length} سؤال ({autoTotal} نقطة) • المقالي: {writtenQs.length} سؤال {writtenQs.length>0 && "— سيتم تصحيحه يدويا"}</p>
        {!canAttempt && <p className="text-red-600">وصلت للحد الأقصى للمحاولات ({exam.max_attempts})</p>}
      </div>
      {questions.map((q:any, idx:number)=>(
        <Card key={q.id}>
          <CardHeader><CardTitle className="text-base">س{idx+1}: {q.prompt} <Badge variant="outline">{q.points} نقطة</Badge> <Badge variant="secondary" className="text-xs">{q.type==="mcq"?"اختيار":q.type==="true_false"?"صح/خطأ":q.type==="short_answer"?"قصير":"مقالي"}</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(q.type==="mcq" || q.type==="true_false") && q.question_options.map((o:any)=>(
              <label key={o.id} className="flex gap-2 items-center border rounded px-3 py-2 hover:bg-zinc-50 cursor-pointer">
                <input type="radio" name={q.id} checked={answers[q.id]===o.id} onChange={()=>setAnswers({...answers, [q.id]:o.id})} />
                <span>{o.option_text}</span>
              </label>
            ))}
            {q.type==="short_answer" && <Input value={answers[q.id]||""} onChange={e=>setAnswers({...answers, [q.id]:e.target.value})} placeholder="اكتب إجابتك" />}
            {q.type==="essay" && <Textarea value={answers[q.id]||""} onChange={e=>setAnswers({...answers, [q.id]:e.target.value})} placeholder="إجابة مفصلة" rows={4} />}
          </CardContent>
        </Card>
      ))}
      <Button onClick={submit} disabled={!canAttempt || submitting} className="w-full">{submitting ? "جاري التسليم..." : "تسليم"}</Button>
    </div>
  );
}
