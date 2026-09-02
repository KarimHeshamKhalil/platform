"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractYoutubeId } from "@/lib/youtube";

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

  // Lesson creation
  const [lessonCourseId, setLessonCourseId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video"|"pdf">("video");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [file, setFile] = useState<File|null>(null);

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
      if (upErr) { setLoading(false); return setMsg("خطأ رفع صورة الـ Unit: " + upErr.message); }
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
    setLoading(true);
    setMsg("");
    const supabase = createClient();

    if (lessonType === "video") {
      const ytId = extractYoutubeId(youtubeLink);
      if (!ytId) { setLoading(false); return setMsg("رابط اليوتيوب غير صحيح. الصق رابط مثل https://www.youtube.com/watch?v=XXXX أو https://youtu.be/XXXX"); }
      const payload: any = { unit_id: selectedUnit, title: lessonTitle, type: "video", youtube_url: youtubeLink.trim(), video_url: null };
      const { error } = await supabase.from("lessons").insert(payload);
      setLoading(false);
      if (error) setMsg("خطأ حفظ الدرس: " + error.message + " - تأكد من تشغيل add_youtube_support.sql");
      else { setMsg("تم اضافة الفيديو ✓ (YouTube ID: "+ytId+")"); setTimeout(()=>location.reload(), 800); }
      return;
    }

    // PDF
    if (!file) { setLoading(false); return setMsg("اختر ملف PDF"); }
    const safeName = file.name.replace(/\s+/g, "-");
    const path = `${selectedUnit}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("pdfs").upload(path, file, { upsert: false });
    if (upErr) {
      setLoading(false);
      if (upErr.message.includes("Bucket not found")) return setMsg("خطأ: الـ Bucket غير موجود. شغّل create_buckets.sql");
      return setMsg("خطأ رفع: " + upErr.message);
    }
    const payload: any = { unit_id: selectedUnit, title: lessonTitle, type: "pdf", pdf_url: path };
    const { error } = await supabase.from("lessons").insert(payload);
    setLoading(false);
    if (error) setMsg("خطأ حفظ الدرس: " + error.message);
    else { setMsg("تم رفع PDF ✓"); setTimeout(()=>location.reload(), 800); }
  }

  const ytPreviewId = extractYoutubeId(youtubeLink);

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
          <div><Label>صورة غلاف الـ Unit (اختياري)</Label><Input type="file" accept="image/*" onChange={e=>setUnitCover(e.target.files?.[0]||null)} /></div>
          <Button onClick={createUnit} className="w-full" disabled={loading}>اضافة Unit</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>3. اضافة درس</CardTitle></CardHeader>
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
            <select value={lessonType} onChange={e=>{setLessonType(e.target.value as any); setYoutubeLink(""); setFile(null);}} className="bg-background px-3 border rounded-md w-full h-9 text-sm">
              <option value="video">Video (YouTube Unlisted)</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          {lessonType==="video" ? (
            <>
              <div><Label>رابط يوتيوب Unlisted</Label><Input placeholder="https://www.youtube.com/watch?v=..." value={youtubeLink} onChange={e=>setYoutubeLink(e.target.value)} dir="ltr" /></div>
              {ytPreviewId && <div className="rounded border overflow-hidden"><img src={`https://img.youtube.com/vi/${ytPreviewId}/hqdefault.jpg`} alt="preview" className="w-full" /><p className="text-xs text-center p-1 bg-zinc-50">ID: {ytPreviewId} ✓</p></div>}
              <p className="text-xs text-muted-foreground">الصق رابط الفيديو بعد رفعه كـ Unlisted على قناة المدرس</p>
            </>
          ) : (
            <div><Label>ملف PDF</Label><Input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
          )}
          <Button onClick={createLesson} disabled={loading} className="w-full">{lessonType==="video" ? "اضافة الفيديو" : "رفع PDF"}</Button>
          {msg && <p className="bg-blue-50 p-2 border rounded text-xs whitespace-pre-wrap">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
