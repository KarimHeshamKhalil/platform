import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function GradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subs } = await supabase.from("exam_submissions").select("*, exams!inner(id,title,type,pass_grade_percent, units!inner(courses(title,year)))").eq("student_id", user.id).order("submitted_at", { ascending: false });

  // Fetch total points per exam for analytics
  const examIds = [...new Set((subs||[]).map((s:any)=>s.exam_id))];
  let totals: Record<string, number> = {};
  if (examIds.length) {
    const { data: qs } = await supabase.from("questions").select("exam_id, points").in("exam_id", examIds);
    (qs||[]).forEach((q:any)=>{ totals[q.exam_id] = (totals[q.exam_id]||0) + Number(q.points); });
  }

  const totalExams = subs?.length || 0;
  const avgScore = totalExams ? (subs!.reduce((s:any,x:any)=>s+Number(x.score||0),0) / subs!.reduce((s:number,x:any)=>s + (totals[x.exam_id]||1),0) *100).toFixed(1) : "0";
  const passed = (subs||[]).filter((s:any)=>{
    const ex = s.exams;
    const tot = totals[s.exam_id]||1;
    return ex.pass_grade_percent ? Number(s.score||0)/tot*100 >= ex.pass_grade_percent : true;
  }).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">درجاتي</h1>
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">إجمالي المحاولات</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{totalExams}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">متوسط الدرجات</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{avgScore}%</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ناجح</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{passed} / {totalExams}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">قيد التصحيح</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-orange-600">{(subs||[]).filter((s:any)=> s.score===null).length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>سجل الامتحانات</CardTitle></CardHeader>
        <CardContent>
          {!subs?.length ? <p className="text-sm text-muted-foreground text-center py-8">لم تحل أي امتحان بعد</p> : (
            <div className="space-y-2">
              {subs.map((s:any)=>{
                const tot = totals[s.exam_id] || 0;
                const pct = tot ? Number(s.score||0)/tot*100 : 0;
                const passedThis = s.exams.pass_grade_percent ? pct >= s.exams.pass_grade_percent : true;
                return (
                  <div key={s.id} className="flex flex-wrap justify-between items-center border rounded-lg p-3 hover:bg-[#F5F1E8] dark:bg-zinc-800 dark:text-zinc-100">
                    <div>
                      <p className="font-medium text-sm">{s.exams.title} <Badge variant="outline">{s.exams.type==="exam"?"امتحان":"واجب"}</Badge> <Badge variant="secondary" className="text-xs">{s.exams.units.courses.title}</Badge></p>
                      <p className="text-xs text-muted-foreground">{s.submitted_at ? new Date(s.submitted_at).toLocaleString("ar-EG") : "قيد الحل"} • محاولة {s.attempt_number}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{s.score ?? 0} / {tot} <span className={`text-xs ${passedThis ? 'text-green-600' : 'text-red-600'}`}>{pct.toFixed(0)}%</span></p>
                      <Link href={`/dashboard/exams/${s.exam_id}`} className="text-xs underline text-primary">عرض التفاصيل</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
