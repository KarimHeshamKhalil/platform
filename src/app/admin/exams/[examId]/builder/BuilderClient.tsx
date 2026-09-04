"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { examSchema, questionSchema, isExamValid } from "@/lib/examSchema";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import QuestionCard from "@/components/admin/QuestionCard";
import ExamPreview from "@/components/admin/ExamPreview";
import { Plus, Eye, Save, Check, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";

type Q = {
  id?: string;
  tempId: string;
  type: "mcq"|"true_false"|"short_answer"|"essay";
  prompt: string;
  points: number;
  question_order: number;
  options?: { id?: string; option_text: string; is_correct: boolean; option_order: number }[];
  _open?: boolean;
};

export default function BuilderClient({ exam, initialQuestions }: { exam: any; initialQuestions: any[] }) {
  const router = useRouter();
  const [meta, setMeta] = useState({
    title: exam.title,
    type: exam.type as "exam"|"homework",
    time_limit_minutes: exam.time_limit_minutes || "",
    shuffle_questions: !!exam.shuffle_questions,
    max_attempts: exam.max_attempts || 1,
    pass_grade_percent: exam.pass_grade_percent || "",
    available_from: exam.available_from ? exam.available_from.slice(0,16) : "",
    available_until: exam.available_until ? exam.available_until.slice(0,16) : "",
    is_published: !!exam.is_published,
  });
  const [questions, setQuestions] = useState<Q[]>(
    initialQuestions.map((q:any, idx:number)=>({
      id: q.id,
      tempId: q.id,
      type: q.type,
      prompt: q.prompt,
      points: Number(q.points),
      question_order: idx,
      options: q.type==="mcq" ? q.question_options?.map((o:any)=>({ id:o.id, option_text:o.option_text, is_correct:o.is_correct, option_order:o.option_order })) :
               q.type==="true_false" ? q.question_options?.map((o:any)=>({ id:o.id, option_text:o.option_text, is_correct:o.is_correct, option_order:o.option_order })) :
               [],
      _open: false,
    }))
  );
  const [saving, setSaving] = useState<"idle"|"saving"|"saved">("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [publishError, setPublishError] = useState("");
  const isSavingRef = useState(() => ({ current: false }))[0];

  const sensors = useSensors(useSensor(PointerSensor));

  // Derived validation
  const valid = isExamValid(meta.title, questions.map(q=>({
    type: q.type, prompt: q.prompt, points: q.points, question_order: q.question_order,
    options: q.options
  } as any)));

  const autosave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaving("saving");
    const supabase = createClient();
    const parsed = examSchema.safeParse({
      title: meta.title, type: meta.type,
      time_limit_minutes: meta.time_limit_minutes ? Number(meta.time_limit_minutes) : null,
      shuffle_questions: meta.shuffle_questions,
      max_attempts: Number(meta.max_attempts),
      pass_grade_percent: meta.pass_grade_percent ? Number(meta.pass_grade_percent) : null,
      available_from: meta.available_from ? new Date(meta.available_from).toISOString() : null,
      available_until: meta.available_until ? new Date(meta.available_until).toISOString() : null,
      is_published: meta.is_published,
    });
    if (parsed.success) {
      await supabase.from("exams").update({
        title: parsed.data.title,
        time_limit_minutes: parsed.data.time_limit_minutes,
        shuffle_questions: parsed.data.shuffle_questions,
        max_attempts: parsed.data.max_attempts,
        pass_grade_percent: parsed.data.pass_grade_percent,
        available_from: parsed.data.available_from,
        available_until: parsed.data.available_until,
      }).eq("id", exam.id);
    }
    // Save questions sequentially - fix duplicate bug by syncing ids back to state
    let hasNewIds = false;
    const updated = [...questions];
    for (let i=0;i<updated.length;i++) {
      const q = updated[i];
      const qPayload: any = { exam_id: exam.id, question_order: i, type: q.type, prompt: q.prompt, points: q.points };
      let qId = q.id;
      if (qId) {
        await supabase.from("questions").update(qPayload).eq("id", qId);
      } else {
        const { data } = await supabase.from("questions").insert(qPayload).select("id").single();
        if (data) {
          qId = data.id;
          updated[i] = { ...q, id: qId };
          hasNewIds = true;
        }
      }
      if ((q.type==="mcq"||q.type==="true_false") && qId) {
        await supabase.from("question_options").delete().eq("question_id", qId);
        if (q.options && q.options.length) {
          const opts = q.options.map((o, idx)=>({ question_id: qId, option_text: o.option_text, is_correct: o.is_correct, option_order: idx }));
          await supabase.from("question_options").insert(opts);
        }
      }
    }
    if (hasNewIds) {
      setQuestions(updated);
    }
    setSaving("saved");
    setTimeout(()=>setSaving("idle"), 1500);
    isSavingRef.current = false;
  }, [meta, questions, exam.id, isSavingRef]);

  // Debounced autosave 1.5s - use refs to avoid stale closure inserting duplicates
  useEffect(()=>{
    const t = setTimeout(()=>{ autosave(); }, 1500);
    return ()=> clearTimeout(t);
  }, [meta, questions, autosave]);

  function addQuestion(type: Q["type"]) {
    const base: Q = {
      tempId: Math.random().toString(36).slice(2),
      type, prompt: "", points: 1, question_order: questions.length, _open: true,
      options: type==="mcq" ? [{ option_text:"", is_correct:true, option_order:0 },{ option_text:"", is_correct:false, option_order:1 }] :
               type==="true_false" ? [{ option_text:"صح", is_correct:true, option_order:0 },{ option_text:"خطأ", is_correct:false, option_order:1 }] : []
    };
    // Ensure MCQ never gets صح/خطأ defaults
    if (type==="mcq" && base.options) base.options = base.options.map(o=>({ ...o, option_text: "" }));
    setQuestions([...questions, base]);
  }

  async function publish() {
    setPublishError("");
    if (!valid) { setPublishError("أكمل كل الأسئلة: كل سؤال له نص، وكل اختيار من متعدد له خياران وإجابة صحيحة واحدة"); return; }
    const supabase = createClient();
    await autosave();
    const { error } = await supabase.from("exams").update({ is_published: true }).eq("id", exam.id);
    if (error) setPublishError(error.message);
    else { setMeta(m=>({...m, is_published:true})); }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">باني {meta.type==="exam"?"الامتحان":"الواجب"} — {exam.units?.courses?.title} / {exam.units?.title}</h1>
          <p className="text-sm text-muted-foreground">السحب لإعادة الترتيب • حفظ تلقائي كل 1.5 ثانية • المعاينة قبل النشر</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>setShowPreview(true)}><Eye size={16}/> معاينة كطالب</Button>
          <Button variant={meta.is_published ? "secondary" : "default"} onClick={publish} disabled={!valid || meta.is_published}>
            {meta.is_published ? <><Check size={16}/> منشور</> : "نشر"}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {saving==="saving" && <span className="text-muted-foreground">Saving...</span>}
        {saving==="saved" && <span className="text-green-600">Saved ✓</span>}
        {!valid && <span className="text-orange-600">أكمل البيانات قبل النشر</span>}
        {publishError && <span className="text-red-600">{publishError}</span>}
      </div>

      <Card>
        <CardHeader><CardTitle>الإعدادات</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>العنوان</Label><Input value={meta.title} onChange={e=>setMeta({...meta, title:e.target.value})} /></div>
          <div><Label>النوع</Label><Badge>{meta.type==="exam"?"Exam":"Homework"}</Badge></div>
          <div><Label>وقت محدد (دقائق - اختياري)</Label><Input type="number" value={meta.time_limit_minutes} onChange={e=>setMeta({...meta, time_limit_minutes:e.target.value})} placeholder="مثال: 30" /></div>
          <div><Label>محاولات</Label><Input type="number" value={meta.max_attempts} onChange={e=>setMeta({...meta, max_attempts:Number(e.target.value)})} /></div>
          <div><Label>درجة النجاح %</Label><Input type="number" value={meta.pass_grade_percent} onChange={e=>setMeta({...meta, pass_grade_percent:e.target.value})} /></div>
          <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={meta.shuffle_questions} onChange={e=>setMeta({...meta, shuffle_questions:e.target.checked})} /><Label>خلط الأسئلة</Label></div>
          <div><Label>متاح من</Label><Input type="datetime-local" value={meta.available_from} onChange={e=>setMeta({...meta, available_from:e.target.value})} /></div>
          <div><Label>متاح حتى</Label><Input type="datetime-local" value={meta.available_until} onChange={e=>setMeta({...meta, available_until:e.target.value})} /></div>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={()=>addQuestion("mcq")}>+ اختيار من متعدد</Button>
        <Button variant="outline" onClick={()=>addQuestion("true_false")}>+ صح/خطأ</Button>
        <Button variant="outline" onClick={()=>addQuestion("short_answer")}>+ إجابة قصيرة</Button>
        <Button variant="outline" onClick={()=>addQuestion("essay")}>+ مقالي</Button>
        <span className="text-xs text-muted-foreground self-center">اسحب بالـ Grip لإعادة الترتيب</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({active, over})=>{
        if (!over || active.id===over.id) return;
        const oldIdx = questions.findIndex(q=> (q.id||q.tempId)===active.id);
        const newIdx = questions.findIndex(q=> (q.id||q.tempId)===over.id);
        setQuestions(arrayMove(questions, oldIdx, newIdx).map((q,i)=>({...q, question_order:i})));
      }}>
        <SortableContext items={questions.map(q=> (q.id||q.tempId) as string)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {questions.map((q, idx)=>(
              <QuestionCard key={q.id||q.tempId} q={q} index={idx} onChange={(nq)=>setQuestions(qs=>qs.map(x=> (x.id||x.tempId)===(q.id||q.tempId) ? {...nq, tempId:x.tempId, id:x.id} : x))} onDelete={async()=>{
                if (q.id) {
                  const s=createClient();
                  await s.from("questions").delete().eq("id", q.id);
                }
                setQuestions(qs=>qs.filter(x=> (x.id||x.tempId)!==(q.id||q.tempId)).map((x,i)=>({...x, question_order:i})));
              }} onDuplicate={()=>{
                const dup: Q = { ...q, id: undefined, tempId: Math.random().toString(36).slice(2), question_order: questions.length, _open: true };
                setQuestions([...questions, dup]);
              }} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showPreview && <ExamPreview exam={{...exam, title: meta.title}} questions={questions} onClose={()=>setShowPreview(false)} />}

      <div className="flex gap-2">
        <Button onClick={autosave} variant="secondary"><Save size={16}/> حفظ الآن</Button>
        <Button variant="ghost" onClick={()=> window.location.href="/admin"}>رجوع للوحة الإدارة</Button>
      </div>
    </div>
  );
}
