"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CourseManager({ courses }: { courses: any[] }) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("تالتة ثانوي");
  const [price, setPrice] = useState("600");
  const [desc, setDesc] = useState("");
  const [courseCover, setCourseCover] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Unit creation
  const [selectedCourse, setSelectedCourse] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [unitCover, setUnitCover] = useState<File|null>(null);

  // Lesson creation - teacher friendly (no manual Unit ID)
  const [lessonCourseId, setLessonCourseId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video"|"pdf">("video");
  const [file, setFile] = useState<File|null>(null);

  // Load units when course selected for lesson
  useEffect(()=>{
    async function load(){
      if (!lessonCourseId) { setUnits([]); setSelectedUnit(""); return; }
      const supabase = createClient();
      const { data } = await supabase.from("units").select("id,title,cover_url,order_index").eq("course_id", lessonCourseId).order("order_index");
      setUnits(data||[]);
      setSelectedUnit("");
    }
    load();
  }, [lessonCourseId]);

  async function createCourse() {
    setLoading(true);
    setMsg("");
    const supabase = createClient();
    let coverUrl: string | null = null;
    if (courseCover) {
      const path = `courses/${Date.now()}-${courseCover.name.replace(/\s+/g,"-")}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, courseCover);
      if (upErr) { setLoading(false); return setMsg("خطأ رفع صورة الكورس: " + upErr.message); }
      coverUrl = path;
    }
    const { error } = await supabase.from("courses").insert({ title, year, price: parseInt(price), description: desc, cover_url: coverUrl });
    setLoading(false);
    if (error) setMsg("خطأ: " + error.message);
    else { setMsg("تم انشاء الكورس ✓"); location.reload(); }
  }

  async function createUnit() {
    if (!selectedCourse || !unitTitle) return setMsg("اختر الكورس واكتب اسم الـ Unit");
    setMsg("");
    setLoading(true);
    const supabase = createClient();
    let coverUrl: string | null = null;
    if (unitCover) {
      const path = `units/${Date.now()}-${unitCover.name.replace(/\s+/g,"-")}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, unitCover);
      if (upErr) { setLoading(false); return setMsg("خطأ رفع صورة الـ Unit: " + upErr.message + " - تأكد من تشغيل create_buckets.sql"); }
      coverUrl = path;
    }
    const { error } = await supabase.from("units").insert({ course_id: selectedCourse, title: unitTitle, cover_url: coverUrl });
    setLoading(false);
    if (error) setMsg("خطأ: " + error.message);
    else { setMsg("تم انشاء Unit ✓"); location.reload(); }
  }

  async function createLesson() {
    if (!lessonCourseId) return setMsg("اختر الكورس أولاً");
    if (!selectedUnit) return setMsg("اختر الـ Unit");
    if (!lessonTitle) return setMsg("اكتب عنوان الدرس");
    if (!file) return setMsg("اختر الملف");
    setLoading(true);
    setMsg("");
    const supabase = createClient();
    const bucket = lessonType==="video"?"videos":"pdfs";
    const safeName = file.name.replace(/\s+/g, "-");
    const path = `${selectedUnit}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (upErr) {
      setLoading(false);
      if (upErr.message.includes("Bucket not found")) {
        return setMsg("خطأ: الـ Bucket غير موجود. شغّل ملف create_buckets.sql في Supabase SQL Editor");
      }
      return setMsg("خطأ رفع: " + upErr.message);
    }
    const payload: any = { unit_id: selectedUnit, title: lessonTitle, type: lessonType };
    if (lessonType==="video") payload.video_url = path; else payload.pdf_url = path;
    const { error } = await supabase.from("lessons").insert(payload);
    setLoading(false);
    if (error) setMsg("خطأ حفظ الدرس: " + error.message);
    else { setMsg("تم رفع الدرس ✓"); setTimeout(()=>location.reload(), 800); }
  }

  return (
    <div className="gap-6 grid lg:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>1. انشاء كورس جديد</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>العنوان</Label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="الشهر الاول"/></div>
          <div><Label>السنة</Label>
            <select value={year} onChange={e=>setYear(e.target.value)} className="bg-background px-3 border rounded-md w-full h-9 text-sm">
                <option value="اولي ثانوي">اولي ثانوي</option>
                <option value="تانية ثانوي">تانية ثانوي</option>
                <option value="تالتة ثانوي">تالتة ثانوي</option>
            </select>
          </div>
          <div><Label>السعر (جنيه)</Label><Input value={price} onChange={e=>setPrice(e.target.value)}/></div>
          <div><Label>الوصف</Label><Textarea value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <div><Label>صورة غلاف الكورس (اختياري)</Label><Input type="file" accept="image/*" onChange={e=>setCourseCover(e.target.files?.[0]||null)} /></div>
          <Button onClick={createCourse} disabled={loading} className="w-full">انشاء الكورس</Button>
          {msg && <p className="bg-blue-50 p-2 border rounded text-xs whitespace-pre-wrap">{msg}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>2. اضافة Unit للكورس</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>اختر الكورس</Label>
            <select value={selectedCourse} onChange={e=>setSelectedCourse(e.target.value)} className="bg-background px-3 border rounded-md w-full h-9 text-sm">
              <option value="">اختر كورس</option>
              {courses.map((c:any)=><option key={c.id} value={c.id}>{c.title} ({c.year})</option>)}
            </select>
          </div>
          <div><Label>اسم الـ Unit</Label><Input value={unitTitle} onChange={e=>setUnitTitle(e.target.value)} placeholder="Unit 1 - الحركة"/></div>
          <div><Label>صورة غلاف الـ Unit (اختياري)</Label><Input type="file" accept="image/*" onChange={e=>setUnitCover(e.target.files?.[0]||null)} /><p className="mt-1 text-muted-foreground text-xs">تظهر في لوحة الطالب وصفحة الكورس</p></div>
          <Button onClick={createUnit} className="w-full" disabled={loading}>اضافة Unit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3. رفع Video / PDF</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>اختر الكورس</Label>
            <select value={lessonCourseId} onChange={e=>setLessonCourseId(e.target.value)} className="bg-background px-3 border rounded-md w-full h-9 text-sm">
              <option value="">اختر الكورس أولاً</option>
              {courses.map((c:any)=><option key={c.id} value={c.id}>{c.title} ({c.year})</option>)}
            </select>
          </div>
          <div><Label>اختر الـ Unit</Label>
            <select value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)} className="bg-background px-3 border rounded-md w-full h-9 text-sm" disabled={!lessonCourseId}>
              <option value="">{units.length ? "اختر Unit" : "لا يوجد Units - أنشئ Unit أولاً"}</option>
              {units.map((u:any)=><option key={u.id} value={u.id}>{u.title}</option>)}
            </select>
          </div>
          <div><Label>عنوان الدرس</Label><Input value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder="الدرس الأول - الشرح"/></div>
          <div><Label>النوع</Label>
            <select value={lessonType} onChange={e=>setLessonType(e.target.value as any)} className="bg-background px-3 border rounded-md w-full h-9 text-sm">
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <div><Label>الملف {lessonType==="video" ? "(mp4)" : "(pdf)"}</Label><Input type="file" accept={lessonType==="video"?"video/*":"application/pdf"} onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
          <Button onClick={createLesson} disabled={loading} className="w-full">رفع الدرس</Button>
          {msg && <p className="bg-blue-50 p-2 border rounded text-xs whitespace-pre-wrap">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
