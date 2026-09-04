import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Video, FileText, Layers, ClipboardCheck, FileQuestion } from "lucide-react";
import SubscribeButton from "./SubscribeButton";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) return notFound();

  const { data: units } = await supabase.from("units").select(`
    id, title, cover_url, order_index,
    lessons ( id, title, type, order_index )
  `).eq("course_id", id).order("order_index");
  const unitIds = units?.map((u:any)=>u.id) || [];
  let examsByUnit: Record<string, any[]> = {};
  if (unitIds.length) {
    const { data: exams } = await supabase.from("exams").select("id,title,type,is_published,unit_id").in("unit_id", unitIds).order("created_at");
    (exams||[]).forEach((e:any)=>{ if (!examsByUnit[e.unit_id]) examsByUnit[e.unit_id]=[]; examsByUnit[e.unit_id].push(e); });
  }

  const { data: { user } } = await supabase.auth.getUser();
  let enrollment = null;
  let profileYear: string | null = null;
  let isWrongYear = false;
  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("enrollments").select("status").eq("user_id", user.id).eq("course_id", id).single();
    enrollment = data;
    const { data: prof } = await supabase.from("profiles").select("year,role").eq("id", user.id).single();
    profileYear = (prof as any)?.year || null;
    isAdmin = (prof as any)?.role === "admin";
    if (!isAdmin && profileYear && profileYear !== course.year) isWrongYear = true;
  }

  const isApproved = enrollment?.status === "approved" || isAdmin;

  function getPublicUrl(path: string | null) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;
  }
  const courseCover = getPublicUrl(course.cover_url);

  return (
    <div className="space-y-6 mx-auto px-4 py-8 max-w-5xl">
      <div className="flex md:flex-row flex-col gap-6 bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 p-6 md:p-8 border rounded-2xl">
        <div className="flex justify-center items-center bg-[#EDE8D0] rounded-xl w-full md:w-64 h-44 overflow-hidden">
          {courseCover ? <img src={courseCover} alt={course.title} className="w-full h-full object-cover"/> : <span className="text-muted-foreground">Cover</span>}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Badge>{course.year}</Badge>
            <Badge variant="outline">{course.price} جنيه</Badge>
          </div>
          <h1 className="font-bold text-2xl md:text-3xl">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
          {isWrongYear && (
            <div className="bg-orange-50 p-3 border border-orange-200 rounded-lg text-orange-800 text-sm">
              هذا الكورس مخصص لـ <b>{course.year}</b> بينما حسابك مسجل كـ <b>{profileYear}</b> — لا يمكنك الاشتراك إلا في كورسات سنتك. تواصل مع الإدارة لتغيير السنة.
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {!user ? (
              <Button asChild><a href="/login">سجل دخول للاشتراك</a></Button>
            ) : isWrongYear ? (
              <Button disabled>غير متاح لسنتك</Button>
            ) : isApproved ? (
              <Button asChild><a href="/dashboard">مشاهدة الكورس في لوحتي</a></Button>
            ) : (
              <SubscribeButton courseId={id} enrollment={enrollment} />
            )}
          </div>
          {!isApproved && !isWrongYear && <p className="flex items-center gap-1 text-muted-foreground text-xs"><Lock size={12}/> المحتوي مقفل - الفيديوهات والـ PDFs تظهر فقط بعد موافقة الإدارة على الدفع</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2"><Layers size={20}/> محتوى الكورس - Units</CardTitle>
          <p className="text-muted-foreground text-sm">الـ Units والفيديوهات والـ PDFs - المعاينة فقط بالأسماء</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!units || units.length === 0 ? (
            <p className="py-8 text-muted-foreground text-center">لم يضف المدرس Units بعد</p>
          ) : units.map((unit: any, idx: number) => {
            const unitCover = getPublicUrl(unit.cover_url);
            return (
            <div key={unit.id} className="bg-[#F5F1E8] p-4 border rounded-xl">
              <div className="flex items-start gap-4">
                {unitCover && <img src={unitCover} alt={unit.title} className="flex-shrink-0 border rounded-lg w-24 h-24 object-cover" />}
                <div className="flex-1">
                  <h3 className="flex gap-2 font-bold">Unit {idx + 1}: {unit.title}</h3>
                  <div className="space-y-2 mt-3">
                    {unit.lessons?.length ? unit.lessons.sort((a:any,b:any)=>a.order_index-b.order_index).map((lesson:any)=>(
                      <div key={lesson.id} className="flex justify-between items-center bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 px-3 py-2 border rounded-lg">
                        <span className="flex items-center gap-2 text-sm">
                          {lesson.type === "video" ? <Video size={16} className="text-blue-600"/> : <FileText size={16} className="text-red-600"/>}
                          {lesson.title}
                          <span className="text-muted-foreground text-xs">({lesson.type === "video" ? "Video" : "PDF"})</span>
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          {isApproved ? <a href={`/dashboard/watch/${lesson.id}`} className="text-primary underline">مشاهدة</a> : <><Lock size={12}/> مقفل</>}
                        </span>
                      </div>
                    )) : null}
                    {(examsByUnit[unit.id]||[]).map((ex:any)=>(
                      <div key={ex.id} className="flex justify-between items-center bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 px-3 py-2 border rounded-lg border-dashed">
                        <span className="flex items-center gap-2 text-sm">
                          {ex.type==="exam" ? <FileQuestion size={16} className="text-purple-600"/> : <ClipboardCheck size={16} className="text-green-600"/>}
                          {ex.title}
                          <span className="text-muted-foreground text-xs">({ex.type==="exam"?"Exam":"Homework"})</span>
                          {!ex.is_published && isAdmin && <span className="text-xs bg-orange-100 px-1 rounded">مسودة</span>}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          {isApproved ? <a href={`/dashboard/exams/${ex.id}`} className="text-primary underline">فتح</a> : <><Lock size={12}/> مقفل</>}
                        </span>
                      </div>
                    ))}
                    {!unit.lessons?.length && !(examsByUnit[unit.id]||[]).length && <p className="text-muted-foreground text-sm">لا يوجد محتوى في هذا الـ Unit بعد</p>}
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
