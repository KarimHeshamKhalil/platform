"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function GradingClient({ exam, submissions: initial }: { exam:any; submissions:any[] }) {
  const [subs, setSubs] = useState(initial);
  const [selected, setSelected] = useState<string | null>(initial[0]?.id || null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all"|"pending">("all");

  useEffect(()=>{
    async function load(){
      if (!selected) return;
      const supabase = createClient();
      const { data: qs } = await supabase.from("questions").select("*, question_options(*)").eq("exam_id", exam.id).order("question_order");
      setQuestions(qs||[]);
      const { data: ans } = await supabase.from("submission_answers").select("*").eq("submission_id", selected);
      setAnswers(ans||[]);
    }
    load();
  }, [selected, exam.id]);

  async function grade(answerId: string, is_correct: boolean, points: number, note: string) {
    const supabase = createClient();
    const ans = answers.find(a=>a.id===answerId);
    const q = questions.find(qq=>qq.id===ans?.question_id);
    const max = Number(q?.points || 1);
    const clamped = Math.max(0, Math.min(points, max));
    await supabase.from("submission_answers").update({ is_correct, points_awarded: clamped, admin_note: note }).eq("id", answerId);
    setAnswers(answers.map(a=> a.id===answerId ? {...a, is_correct, points_awarded: clamped, admin_note: note} : a));
    const total = answers.reduce((s,a)=> s + (a.id===answerId ? clamped : Number(a.points_awarded||0)), 0);
    await supabase.from("exam_submissions").update({ score: total }).eq("id", selected);
    setSubs(subs.map(s=> s.id===selected ? {...s, score: total, pending: answers.filter(a=> a.id===answerId ? is_correct===null : a.is_correct===null).length} : s));
  }

  const selectedSub = subs.find(s=>s.id===selected);
  const pendingCount = subs.filter((s:any)=>s.pending>0).length;
  const avg = subs.length ? (subs.reduce((s:any,x:any)=>s+Number(x.score||0),0)/subs.length) : 0;
  const filteredSubs = filter==="pending" ? subs.filter((s:any)=>s.pending>0) : subs;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="font-bold text-xl">تصحيح: {exam.title}</h1>
        <p className="text-sm text-muted-foreground">{exam.units.courses.title} / {exam.units.title} • {exam.type==="exam" ? "امتحان" : "واجب"}</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* LEFT: Answers - takes 3 cols */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          {!selected ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">اختر طالب من القائمة الجانبية لعرض إجاباته</CardContent></Card>
          ) : answers.length===0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">لا يوجد إجابات</CardContent></Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">إجابات: {selectedSub?.profiles?.username} <span className="text-sm font-normal text-muted-foreground">محاولة {selectedSub?.attempt_number} • {selectedSub?.score ?? 0} نقطة</span></h2>
                <Badge variant={selectedSub?.pending>0 ? "secondary" : "default"}>{selectedSub?.pending>0 ? `قيد التصحيح (${selectedSub.pending})` : "مكتمل"}</Badge>
              </div>
              {answers.map((a:any)=>{
                const q = questions.find((qq:any)=>qq.id===a.question_id);
                if (!q) return null;
                const isWritten = q.type==="short_answer" || q.type==="essay";
                return (
                  <Card key={a.id} className="overflow-hidden w-full">
                    <CardHeader className="py-3 bg-zinc-50">
                      <CardTitle className="text-sm flex flex-wrap gap-2 items-start">
                        <span className="flex-1 min-w-0 break-words whitespace-pre-wrap">{q.prompt}</span>
                        <Badge variant="outline" className="shrink-0">{q.points} نقطة</Badge>
                        <Badge variant="secondary" className="text-xs shrink-0">{q.type==="mcq"?"اختيار":q.type==="true_false"?"صح/خطأ":q.type==="short_answer"?"قصير":"مقالي"}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      {isWritten ? (
                        <div className="bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border rounded-lg p-3 w-full overflow-hidden">
                          <p className="text-xs font-medium text-muted-foreground mb-2">إجابة الطالب:</p>
                          <div className="text-sm whitespace-pre-wrap break-words break-all max-w-full overflow-hidden leading-relaxed bg-zinc-50 rounded p-3 min-h-[70px] border">
                            {a.response?.trim() ? a.response : "— لم يجب"}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border rounded-lg p-3">
                          {a.is_correct ? <Badge className="bg-green-600 shrink-0">صحيح ✓</Badge> : a.is_correct===false ? <Badge variant="destructive" className="shrink-0">خطأ ✗</Badge> : <Badge variant="secondary" className="shrink-0">قيد التصحيح</Badge>}
                          <span className="text-sm">{a.points_awarded ?? 0} / {q.points} نقطة — {a.is_correct ? "إجابة صحيحة" : a.is_correct===false ? "إجابة خاطئة" : ""}</span>
                        </div>
                      )}

                      {isWritten && (
                        <>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Button size="sm" variant={a.is_correct===true ? "default" : "outline"} onClick={()=>grade(a.id, true, Number(q.points), a.admin_note||"")}>صحيح (+{q.points})</Button>
                            <Button size="sm" variant={a.is_correct===false ? "destructive" : "outline"} onClick={()=>grade(a.id, false, 0, a.admin_note||"")}>خطأ (0)</Button>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">درجة:</span>
                              <Input type="number" min={0} max={Number(q.points)} className="w-20 h-8" value={a.points_awarded ?? 0} onChange={(e)=>{
                                const v = Number(e.target.value);
                                setAnswers(answers.map(x=> x.id===a.id ? {...x, points_awarded: v} : x));
                              }} onBlur={(e)=>grade(a.id, Number(e.target.value)>0, Number(e.target.value), a.admin_note||"")} />
                              <span className="text-xs text-muted-foreground">/ {q.points}</span>
                            </div>
                          </div>
                          <div className="w-full">
                            <p className="text-xs font-medium mb-1">ملاحظة للطالب (تظهر للطالب بعد التصحيح):</p>
                            <Textarea placeholder="اكتب ملاحظة..." value={a.admin_note||""} onChange={(e)=>setAnswers(answers.map(x=> x.id===a.id ? {...x, admin_note: e.target.value} : x))} onBlur={(e)=>grade(a.id, !!a.is_correct, Number(a.points_awarded||0), e.target.value)} rows={3} className="w-full min-h-[80px] resize-y" />
                          </div>
                          {a.is_correct!==null && <p className="text-xs text-green-600">تم التصحيح ✓</p>}
                        </>
                      )}
                      {!isWritten && a.is_correct!==null && a.admin_note && (
                        <p className="text-xs bg-blue-50 border rounded p-2 break-words whitespace-pre-wrap">ملاحظة: {a.admin_note}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        {/* RIGHT: Analytics + Student list */}
        <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">إحصائيات الامتحان</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-1">
              <p>التسليمات: <b>{subs.length}</b></p>
              <p>متوسط الدرجة: <b>{avg.toFixed(1)}</b></p>
              <p>أعلى: <b>{subs.length ? Math.max(...subs.map((s:any)=>Number(s.score||0))) : 0}</b> • أقل: <b>{subs.length ? Math.min(...subs.map((s:any)=>Number(s.score||0))) : 0}</b></p>
              <p>قيد التصحيح: <b className="text-orange-600">{subs.reduce((s:any,x:any)=>s+(x.pending||0),0)} أسئلة</b> • طلاب يحتاجون مراجعة: <b>{pendingCount}</b></p>
            </CardContent>
          </Card>

          {selectedSub && (
            <Card className="border-black">
              <CardHeader className="pb-2"><CardTitle className="text-sm">الطالب الحالي</CardTitle><CardDescription className="text-xs">{selectedSub.profiles?.username} • {selectedSub.profiles?.phone}</CardDescription></CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>محاولة {selectedSub.attempt_number} • درجة: <b>{selectedSub.score ?? 0}</b></p>
                <p>الحالة: {selectedSub.pending>0 ? <Badge variant="secondary">يحتاج تصحيح مقالي ({selectedSub.pending})</Badge> : <Badge className="bg-green-600">مكتمل</Badge>}</p>
                <p className="text-muted-foreground">{selectedSub.submitted_at ? new Date(selectedSub.submitted_at).toLocaleString("ar-EG") : "لم يسلم"}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>الطلاب ({filteredSubs.length})</span>
                <div className="flex gap-1">
                  <Button variant={filter==="all" ? "secondary" : "ghost"} size="sm" className="h-6 text-xs px-2" onClick={()=>setFilter("all")}>الكل</Button>
                  <Button variant={filter==="pending" ? "secondary" : "ghost"} size="sm" className="h-6 text-xs px-2" onClick={()=>setFilter("pending")}>يحتاج مراجعة ({pendingCount})</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-auto">
              {filteredSubs.length===0 ? <p className="text-xs text-muted-foreground text-center py-4">لا يوجد</p> :
                filteredSubs.map((s:any)=>(
                  <div key={s.id} onClick={()=>setSelected(s.id)} className={`cursor-pointer border rounded-lg p-3 hover:bg-zinc-50 transition ${selected===s.id ? 'bg-zinc-900 text-white border-zinc-900' : s.pending>0 ? 'border-orange-300 bg-orange-50' : ''}`}>
                    <p className={`font-medium text-sm truncate ${selected===s.id ? 'text-white' : ''}`}>{s.profiles?.username}</p>
                    <p className={`text-xs ${selected===s.id ? 'text-white/70' : 'text-muted-foreground'}`}>{s.profiles?.phone}</p>
                    <p className="text-xs mt-1">محاولة {s.attempt_number} • {s.score ?? 0} نقطة {s.pending>0 ? <Badge variant="destructive" className="text-xs">مقالي ({s.pending})</Badge> : <Badge variant="outline" className="text-xs bg-green-50">جاهز</Badge>}</p>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
