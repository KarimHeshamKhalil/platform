import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Video, FileText, Layers } from "lucide-react";
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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 h-44 bg-zinc-100 rounded-xl flex items-center justify-center overflow-hidden">
          {courseCover ? <img src={courseCover} alt={course.title} className="w-full h-full object-cover"/> : <span className="text-muted-foreground">Cover</span>}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <Badge>{course.year}</Badge>
            <Badge variant="outline">{course.price} جنيه</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
          {isWrongYear && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-3 rounded-lg">
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
          {!isApproved && !isWrongYear && <p className="text-xs text-muted-foreground flex gap-1 items-center"><Lock size={12}/> المحتوي مقفل - الفيديوهات والـ PDFs تظهر فقط بعد موافقة الإدارة على الدفع</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2"><Layers size={20}/> محتوى الكورس - Units</CardTitle>
          <p className="text-sm text-muted-foreground">الـ Units والفيديوهات والـ PDFs - المعاينة فقط بالأسماء</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!units || units.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لم يضف المدرس Units بعد</p>
          ) : units.map((unit: any, idx: number) => {
            const unitCover = getPublicUrl(unit.cover_url);
            return (
            <div key={unit.id} className="border rounded-xl p-4 bg-zinc-50/50">
              <div className="flex gap-4 items-start">
                {unitCover && <img src={unitCover} alt={unit.title} className="w-24 h-24 rounded-lg object-cover border flex-shrink-0" />}
                <div className="flex-1">
                  <h3 className="font-bold flex gap-2">Unit {idx + 1}: {unit.title}</h3>
                  <div className="mt-3 space-y-2">
                    {unit.lessons?.length ? unit.lessons.sort((a:any,b:any)=>a.order_index-b.order_index).map((lesson:any)=>(
                      <div key={lesson.id} className="flex justify-between items-center bg-white border rounded-lg px-3 py-2">
                        <span className="flex gap-2 items-center text-sm">
                          {lesson.type === "video" ? <Video size={16} className="text-blue-600"/> : <FileText size={16} className="text-red-600"/>}
                          {lesson.title}
                          <span className="text-xs text-muted-foreground">({lesson.type === "video" ? "Video" : "PDF"})</span>
                        </span>
                        <span className="text-xs flex gap-1 items-center text-muted-foreground">
                          {isApproved ? <a href={`/dashboard/watch/${lesson.id}`} className="text-primary underline">مشاهدة</a> : <><Lock size={12}/> مقفل</>}
                        </span>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">لا يوجد دروس في هذا الـ Unit بعد</p>}
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
