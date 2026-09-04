"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Video, FileText, ClipboardCheck, FileQuestion, BookOpen, Layers, GraduationCap } from "lucide-react";

const YEARS = ["الكل", "اولي ثانوي", "تانية ثانوي", "تالتة ثانوي"] as const;

export default function DeleteManager({ courses: initialCourses }: { courses: any[] }) {
  const [filterYear, setFilterYear] = useState("الكل");
  const [courses] = useState(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [units, setUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [lessons, setLessons] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const filteredCourses = filterYear === "الكل" ? courses : courses.filter((c:any)=>c.year===filterYear);
  const selectedCourse = courses.find((c:any)=>c.id===selectedCourseId);
  const selectedUnit = units.find((u:any)=>u.id===selectedUnitId);

  useEffect(()=>{
    async function loadUnits(){
      if (!selectedCourseId) { setUnits([]); setSelectedUnitId(""); return; }
      const supabase = createClient();
      const { data } = await supabase.from("units").select("id,title,cover_url,created_at").eq("course_id", selectedCourseId).order("created_at");
      setUnits(data||[]);
      setSelectedUnitId("");
      setLessons([]); setExams([]);
    }
    loadUnits();
  }, [selectedCourseId]);

  useEffect(()=>{
    async function loadContent(){
      if (!selectedUnitId) { setLessons([]); setExams([]); return; }
      const supabase = createClient();
      const { data: ls } = await supabase.from("lessons").select("id,title,type,youtube_url,video_url,pdf_url").eq("unit_id", selectedUnitId).order("created_at");
      const { data: ex } = await supabase.from("exams").select("id,title,type,is_published").eq("unit_id", selectedUnitId).order("created_at");
      setLessons(ls||[]);
      setExams(ex||[]);
    }
    loadContent();
  }, [selectedUnitId]);

  async function delCourse(id: string) {
    if (!confirm("حذف الكورس سيحذف كل الـ Units والفيديوهات والامتحانات بداخله نهائيا. متأكد؟")) return;
    const supabase = createClient();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) setMsg("خطأ: "+error.message); else { setMsg("تم حذف الكورس"); location.reload(); }
  }
  async function delUnit(id: string) {
    if (!confirm("حذف الـ Unit سيحذف الفيديوهات والامتحانات بداخله. متأكد؟")) return;
    const supabase = createClient();
    const { error } = await supabase.from("units").delete().eq("id", id);
    if (error) setMsg("خطأ: "+error.message); else { setMsg("تم حذف Unit"); setUnits(units.filter(u=>u.id!==id)); setSelectedUnitId(""); }
  }
  async function delLesson(l:any) {
    if (!confirm(`حذف "${l.title}"؟`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("lessons").delete().eq("id", l.id);
    if (error) { setMsg("خطأ: "+error.message); return; }
    if (l.pdf_url) await supabase.storage.from("pdfs").remove([l.pdf_url]);
    if (l.video_url) await supabase.storage.from("videos").remove([l.video_url]);
    setLessons(lessons.filter(x=>x.id!==l.id));
    setMsg("تم حذف الدرس");
  }
  async function delExam(id:string) {
    if (!confirm("حذف الامتحان سيحذف كل الأسئلة. متأكد؟")) return;
    const supabase = createClient();
    const { error } = await supabase.from("exams").delete().eq("id", id);
    if (error) setMsg("خطأ: "+error.message); else { setExams(exams.filter(x=>x.id!==id)); setMsg("تم حذف الامتحان"); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center"><Trash2 size={18}/> إدارة وحذف المحتوى</CardTitle>
        <CardDescription>اختر السنة → الكورس → الـ Unit → احذف ما تريد. الحذف نهائي (cascade).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Year */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">١. اختر السنة</p>
          <div className="flex flex-wrap gap-2">
            {YEARS.map(y=>(
              <button key={y} onClick={()=>{setFilterYear(y); setSelectedCourseId("");}} className={`px-4 py-1.5 rounded-full text-sm border-[1.5px] font-bold transition ${filterYear===y ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-600 border-black hover:bg-[#EDE8D0] dark:hover:bg-zinc-600'}`}>
                {y} {y==="الكل" ? `(${courses.length})` : `(${courses.filter((c:any)=>c.year===y).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Courses */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">٢. اختر الكورس ({filteredCourses.length})</p>
          {filteredCourses.length===0 ? (
            <p className="text-sm text-muted-foreground border rounded-lg p-4 text-center">لا يوجد كورسات في {filterYear}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {filteredCourses.map((c:any)=>(
                <div key={c.id} onClick={()=>setSelectedCourseId(c.id)} className={`flex items-center justify-between p-3 rounded-xl border-[1.5px] cursor-pointer transition ${selectedCourseId===c.id ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-800 dark:text-zinc-100 border-black dark:border-zinc-700 hover:bg-[#F5F1E8] dark:hover:bg-zinc-700'}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen size={16} className={selectedCourseId===c.id ? 'text-white' : 'text-muted-foreground'} />
                    <span className="font-medium truncate text-sm">{c.title}</span>
                    <Badge variant={selectedCourseId===c.id ? "secondary" : "outline"} className="text-xs shrink-0"><GraduationCap size={10}/>{c.year}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className={`shrink-0 ${selectedCourseId===c.id ? 'hover:bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/10 text-white' : ''}`} onClick={(e)=>{e.stopPropagation(); delCourse(c.id);}}>
                    <Trash2 size={16} className="text-red-500"/>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3: Units */}
        {selectedCourseId && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">٣. Units في: <span className="text-foreground font-bold">{selectedCourse?.title}</span> ({units.length})</p>
            {units.length===0 ? (
              <p className="text-sm text-muted-foreground border rounded-lg p-4 text-center">لا يوجد Units — أنشئ من قسم 2 أعلاه</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-2">
                {units.map((u:any)=>(
                  <div key={u.id} onClick={()=>setSelectedUnitId(u.id)} className={`flex items-center justify-between p-3 rounded-xl border-[1.5px] cursor-pointer transition ${selectedUnitId===u.id ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black' : 'bg-[#F5F1E8] dark:bg-zinc-800 dark:text-zinc-100 border-black dark:border-zinc-700 hover:bg-[#EDE8D0] dark:hover:bg-zinc-700'}`}>
                    <span className="flex items-center gap-2 truncate text-sm"><Layers size={14}/> {u.title}</span>
                    <Button variant="ghost" size="icon" className={`shrink-0 ${selectedUnitId===u.id ? 'hover:bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700/10 text-white' : ''}`} onClick={(e)=>{e.stopPropagation(); delUnit(u.id);}}>
                      <Trash2 size={16} className="text-red-500"/>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Content */}
        {selectedUnitId && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border-[1.5px] border-black dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
              <div className="bg-[#EDE8D0] dark:bg-zinc-700 px-3 py-2 flex justify-between items-center border-b border-black dark:border-zinc-700">
                <span className="font-medium text-sm flex gap-2"><Video size={16}/> فيديوهات / PDFs</span>
                <Badge variant="secondary" className="dark:bg-zinc-600 dark:text-white">{lessons.length}</Badge>
              </div>
              <div className="divide-y divide-black/10 dark:divide-zinc-700 max-h-72 overflow-auto">
                {lessons.length===0 ? <p className="p-4 text-sm text-muted-foreground text-center">لا يوجد محتوى</p> :
                  lessons.map((l:any)=>(
                    <div key={l.id} className="flex justify-between items-center p-3 hover:bg-[#F5F1E8] dark:hover:bg-zinc-700">
                      <span className="flex items-center gap-2 text-sm truncate">
                        {l.type==="video" ? <Video size={14} className="text-blue-600"/> : <FileText size={14} className="text-red-600"/>}
                        <span className="truncate">{l.title}</span>
                      </span>
                      <Button variant="ghost" size="icon" onClick={()=>delLesson(l)}><Trash2 size={14} className="text-red-600"/></Button>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="border-[1.5px] border-black dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-800">
              <div className="bg-[#EDE8D0] dark:bg-zinc-700 px-3 py-2 flex justify-between items-center border-b border-black dark:border-zinc-700">
                <span className="font-medium text-sm flex gap-2"><ClipboardCheck size={16}/> امتحانات / واجبات</span>
                <Badge variant="secondary" className="dark:bg-zinc-600 dark:text-white">{exams.length}</Badge>
              </div>
              <div className="divide-y max-h-72 overflow-auto">
                {exams.length===0 ? <p className="p-4 text-sm text-muted-foreground text-center">لا يوجد</p> :
                  exams.map((e:any)=>(
                    <div key={e.id} className="flex justify-between items-center p-3 hover:bg-[#F5F1E8] dark:bg-zinc-800 dark:text-zinc-100">
                      <span className="flex items-center gap-2 text-sm truncate">
                        {e.type==="exam" ? <FileQuestion size={14} className="text-purple-600"/> : <ClipboardCheck size={14} className="text-green-600"/>}
                        <span className="truncate">{e.title}</span>
                        {!e.is_published && <Badge variant="outline" className="text-xs">مسودة</Badge>}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild><a href={`/admin/exams/${e.id}/builder`} className="text-xs underline">تعديل</a></Button>
                        <Button variant="ghost" size="icon" onClick={()=>delExam(e.id)}><Trash2 size={14} className="text-red-600"/></Button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {!selectedCourseId && <p className="text-xs text-muted-foreground text-center">اختر كورس لعرض الـ Units والمحتوى</p>}
        {msg && <p className="text-xs bg-blue-50 border rounded p-2 text-center">{msg}</p>}
      </CardContent>
    </Card>
  );
}
