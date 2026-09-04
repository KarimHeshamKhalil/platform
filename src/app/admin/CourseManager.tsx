"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extractYoutubeId } from "@/lib/youtube";
import { Video, FileText, ClipboardCheck, FileQuestion } from "lucide-react";

export default function CourseManager({ courses }: { courses: any[] }) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("تالتة ثانوي");
  const [price, setPrice] = useState("600");
  const [desc, setDesc] = useState("");
  const [courseCover, setCourseCover] = useState<File|null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Year filter for the add-content selects (top of card 3 + card 2)
  const [filterYear, setFilterYear] = useState<string>("الكل");
  const filteredCourses = filterYear === "الكل" ? courses : courses.filter((c:any)=>c.year===filterYear);

  // Unit creation
  const [selectedCourse, setSelectedCourse] = useState("");
  const [unitTitle, setUnitTitle] = useState("");
  const [unitCover, setUnitCover] = useState<File|null>(null);

  // Lesson creation
  const [lessonCourseId, setLessonCourseId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<"video"|"pdf"|"exam"|"homework">("video");
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
    if (!lessonTitle) return setMsg("اكتب عنوان المحتوى");
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

    if (lessonType === "exam" || lessonType === "homework") {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("exams").insert({
        unit_id: selectedUnit,
        title: lessonTitle,
        type: lessonType,
        created_by: user?.id,
      }).select("id").single();
      setLoading(false);
      if (error) setMsg("خطأ إنشاء "+ (lessonType==="exam"?"الامتحان":"الواجب") +": " + error.message + " - تأكد من تشغيل add_exams_support.sql");
      else {
        setMsg("تم إنشاء "+ (lessonType==="exam"?"الامتحان":"الواجب") +" ✓ - جاري فتح الباني...");
        setTimeout(()=> window.location.href = `/admin/exams/${data.id}/builder`, 600);
      }
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
      <Card className="bg-[#F5F1E8] dark:bg-zinc-800">
        <CardHeader className="bg-white dark:bg-zinc-900 -mx-6 -mt-6 px-6 py-3 pt-5 border-black dark:border-zinc-700 border-b-[1.5px] rounded-t-[20px]"><CardTitle className="flex items-center gap-2 text-sm"><span className="flex justify-center items-center bg-black rounded-full w-6 h-6 text-white text-xs">1</span> انشاء كورس جديد</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div><Label>العنوان</Label><Input className="bg-white dark:bg-zinc-900 border-black" value={title} onChange={e=>setTitle(e.target.value)} placeholder="الشهر الاول"/></div>
          <div><Label>السنة</Label>
            <select value={year} onChange={e=>setYear(e.target.value)} className="bg-white dark:bg-zinc-900 px-3 border-[1.5px] border-black rounded-full w-full h-9 text-sm">
                <option value="اولي ثانوي">اولي ثانوي</option>
                <option value="تانية ثانوي">تانية ثانوي</option>
                <option value="تالتة ثانوي">تالتة ثانوي</option>
            </select>
          </div>
          <div><Label>السعر (جنيه)</Label><Input className="bg-white dark:bg-zinc-900 border-black" value={price} onChange={e=>setPrice(e.target.value)}/></div>
          <div><Label>الوصف</Label><Textarea className="bg-white dark:bg-zinc-900 border-black" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <div><Label>صورة غلاف الكورس (اختياري)</Label><Input className="bg-white dark:bg-zinc-900 border-black" type="file" accept="image/*" onChange={e=>setCourseCover(e.target.files?.[0]||null)} /></div>
          <Button onClick={createCourse} disabled={loading} className="rounded-full w-full">انشاء الكورس</Button>
          {msg && <p className="bg-[#F7F36A] dark:bg-[#4A4000] px-3 py-1 border border-black dark:border-zinc-600 rounded-full text-black dark:text-[#F7F36A] text-xs text-center whitespace-pre-wrap">{msg}</p>}
        </CardContent>
      </Card>

      <Card className="bg-[#FFE8D6] dark:bg-zinc-800">
        <CardHeader className="bg-[#FF6B35] -mx-6 -mt-6 px-6 py-3 pt-5 border-black border-b-[1.5px] rounded-t-[20px] font-bold"><CardTitle className="flex items-center gap-2 text-white text-sm"><span className="flex justify-center items-center bg-white rounded-full w-6 h-6 text-black text-xs">2</span> اضافة Unit للكورس</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div><Label>تصفية حسب السنة</Label>
            <select value={filterYear} onChange={e=>setFilterYear(e.target.value)} className="bg-white dark:bg-zinc-900 px-3 border-[1.5px] border-black rounded-full w-full h-8 text-xs">
              <option value="الكل">الكل ({courses.length})</option>
              <option value="اولي ثانوي">اولي ثانوي ({courses.filter((c:any)=>c.year==="اولي ثانوي").length})</option>
              <option value="تانية ثانوي">تانية ثانوي ({courses.filter((c:any)=>c.year==="تانية ثانوي").length})</option>
              <option value="تالتة ثانوي">تالتة ثانوي ({courses.filter((c:any)=>c.year==="تالتة ثانوي").length})</option>
            </select>
          </div>
          <div><Label>اختر الكورس</Label>
            <select value={selectedCourse} onChange={e=>setSelectedCourse(e.target.value)} className="bg-white dark:bg-zinc-900 px-3 border-[1.5px] border-black rounded-full w-full h-9 text-sm">
              <option value="">اختر كورس</option>
              {filteredCourses.map((c:any)=><option key={c.id} value={c.id}>{c.title}</option>)}
              {filteredCourses.length===0 && <option disabled>لا يوجد كورسات في {filterYear}</option>}
            </select>
          </div>
          <div><Label>اسم الـ Unit</Label><Input className="bg-white dark:bg-zinc-900 border-black" value={unitTitle} onChange={e=>setUnitTitle(e.target.value)} placeholder="Unit 1 - الحركة"/></div>
          <div><Label>صورة غلاف الـ Unit (اختياري)</Label><Input className="bg-white dark:bg-zinc-900 border-black" type="file" accept="image/*" onChange={e=>setUnitCover(e.target.files?.[0]||null)} /></div>
          <Button onClick={createUnit} disabled={loading} className="bg-black rounded-full w-full">اضافة Unit</Button>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader className="bg-[#F7F36A] dark:bg-[#4A4000] -mx-6 -mt-6 px-6 py-3 pt-5 border-black dark:border-zinc-600 border-b-[1.5px] rounded-t-[20px] text-black dark:text-[#F7F36A]"><CardTitle className="flex items-center gap-2 text-sm"><span className="flex justify-center items-center bg-black rounded-full w-6 h-6 text-white text-xs">3</span> اضافة درس</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>تصفية حسب السنة</Label>
            <select value={filterYear} onChange={e=>{setFilterYear(e.target.value); setLessonCourseId("");}} className="bg-white dark:bg-zinc-800 px-3 border-[1.5px] border-black dark:border-zinc-600 rounded-full w-full h-8 dark:text-white text-xs">
              <option value="الكل">الكل ({courses.length})</option>
              <option value="اولي ثانوي">اولي ثانوي</option>
              <option value="تانية ثانوي">تانية ثانوي</option>
              <option value="تالتة ثانوي">تالتة ثانوي</option>
            </select>
          </div>
          <div><Label>اختر الكورس</Label>
            <select value={lessonCourseId} onChange={e=>setLessonCourseId(e.target.value)} className="bg-white dark:bg-zinc-800 px-3 border-[1.5px] border-black dark:border-zinc-600 rounded-full w-full h-9 dark:text-white text-sm">
              <option value="">اختر الكورس أولاً</option>
              {filteredCourses.map((c:any)=><option key={c.id} value={c.id}>{c.title}</option>)}
              {filteredCourses.length===0 && <option disabled>لا يوجد كورسات في {filterYear}</option>}
            </select>
          </div>
          <div><Label>اختر الـ Unit</Label>
            <select value={selectedUnit} onChange={e=>setSelectedUnit(e.target.value)} className="bg-white dark:bg-zinc-800 px-3 border-[1.5px] border-black dark:border-zinc-600 rounded-full w-full h-9 dark:text-white text-sm" disabled={!lessonCourseId}>
              <option value="">{units.length ? "اختر Unit" : "لا يوجد Units - أنشئ Unit أولاً"}</option>
              {units.map((u:any)=><option key={u.id} value={u.id}>{u.title}</option>)}
            </select>
          </div>
          <div><Label>عنوان المحتوى</Label><Input className="bg-white dark:bg-zinc-800 border-black dark:text-white" value={lessonTitle} onChange={e=>setLessonTitle(e.target.value)} placeholder={lessonType==="exam"?"مثال: امتحان Unit 1": lessonType==="homework"?"مثال: واجب الدرس الأول":"الدرس الأول - الشرح"}/></div>
          <div><Label>النوع</Label>
            <div className="gap-1 grid grid-cols-4">
              {[
                {v:"video", label:"Video", icon: Video},
                {v:"pdf", label:"PDF", icon: FileText},
                {v:"exam", label:"Exam", icon: FileQuestion},
                {v:"homework", label:"Homework", icon: ClipboardCheck},
              ].map(({v,label,icon:Icon})=>(
                <button key={v} type="button" onClick={()=>{setLessonType(v as any); setYoutubeLink(""); setFile(null);}} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-[1.5px] text-xs font-bold transition ${lessonType===v ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-600 border-black hover:bg-zinc-50 dark:hover:bg-zinc-600'}`}>
                  <Icon size={18} />{label}
                </button>
              ))}
            </div>
          </div>
          {lessonType==="video" ? (
            <>
              <div><Label>رابط يوتيوب Unlisted</Label><Input className="bg-white dark:bg-zinc-800 border-black dark:text-white" placeholder="https://www.youtube.com/watch?v=..." value={youtubeLink} onChange={e=>setYoutubeLink(e.target.value)} dir="ltr" /></div>
              {ytPreviewId && <div className="border border-black rounded-xl overflow-hidden"><img src={`https://img.youtube.com/vi/${ytPreviewId}/hqdefault.jpg`} alt="preview" className="w-full" /><p className="bg-[#F5F1E8] dark:bg-zinc-700 p-1 text-xs text-center">ID: {ytPreviewId} ✓</p></div>}
              <p className="text-muted-foreground text-xs">الصق رابط الفيديو بعد رفعه كـ Unlisted</p>
            </>
          ) : lessonType==="pdf" ? (
            <div><Label>ملف PDF</Label><Input className="bg-white dark:bg-zinc-800 border-black" type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></div>
          ) : (
            <p className="bg-[#F5F1E8] dark:bg-zinc-700 p-2 border border-black rounded-xl dark:text-zinc-100 text-xs">سيتم إنشاء {lessonType==="exam"?"امتحان":"واجب"} فارغ وفتح الباني لإضافة الأسئلة</p>
          )}
          <Button onClick={createLesson} disabled={loading} className="w-full">{lessonType==="video" ? "اضافة الفيديو" : lessonType==="pdf" ? "رفع PDF" : `إنشاء ${lessonType==="exam"?"Exam":"Homework"} وفتح الباني`}</Button>
          {msg && <p className="bg-blue-50 p-2 border rounded text-xs whitespace-pre-wrap">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
