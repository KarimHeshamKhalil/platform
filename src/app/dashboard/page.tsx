import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Video, FileText, GraduationCap, ClipboardCheck, FileQuestion, BookOpen, Award, Sparkles } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const userYear = profile.year as string | null;
  const isAdmin = profile.role === "admin";
  const { data: enrollments } = await supabase.from("enrollments").select("*, courses(id,title,year,cover_url,price,description)").eq("user_id", user.id).order("created_at", { ascending: false });
  const approved = enrollments?.filter(e=>e.status==="approved") || [];
  let approvedDetails: any[] = [];
  if (approved.length) {
    const ids = approved.map(a=>a.course_id);
    const { data: courses } = await supabase.from("courses").select("id,title,year").in("id", ids);
    for (const c of courses||[]) {
      const { data: units } = await supabase.from("units").select("id,title,cover_url,order_index, lessons(id,title,type,order_index)").eq("course_id", c.id).order("order_index");
      const unitIds = (units||[]).map((u:any)=>u.id);
      let examsByUnit: Record<string, any[]> = {};
      if (unitIds.length) {
        const { data: exams } = await supabase.from("exams").select("id,title,type,is_published,unit_id").in("unit_id", unitIds).order("created_at");
        (exams||[]).forEach((e:any)=>{ if (!examsByUnit[e.unit_id]) examsByUnit[e.unit_id]=[]; examsByUnit[e.unit_id].push(e); });
      }
      approvedDetails.push({ course: c, units, examsByUnit });
    }
  }
  let yearCourses: any[] = [];
  if (isAdmin) {
    const { data } = await supabase.from("courses").select("id,title,description,year,price,cover_url,is_published").order("created_at", { ascending: false });
    yearCourses = data || [];
  } else if (userYear) {
    const { data } = await supabase.from("courses").select("id,title,description,year,price,cover_url").eq("year", userYear).eq("is_published", true).order("created_at", { ascending: false });
    yearCourses = data || [];
  } else {
    const { data } = await supabase.from("courses").select("id,title,description,year,price,cover_url").eq("is_published", true).limit(6);
    yearCourses = data || [];
  }
  let adminAllContent: any[] = [];
  if (isAdmin && approvedDetails.length === 0) {
    const { data: allCourses } = await supabase.from("courses").select("id,title,year").order("created_at", { ascending: false }).limit(10);
    for (const c of allCourses||[]) {
      const { data: units } = await supabase.from("units").select("id,title,cover_url,order_index, lessons(id,title,type,order_index)").eq("course_id", c.id).order("order_index");
      const unitIds = (units||[]).map((u:any)=>u.id);
      let examsByUnit: Record<string, any[]> = {};
      if (unitIds.length) {
        const { data: exams } = await supabase.from("exams").select("id,title,type,is_published,unit_id").in("unit_id", unitIds).order("created_at");
        (exams||[]).forEach((e:any)=>{ if (!examsByUnit[e.unit_id]) examsByUnit[e.unit_id]=[]; examsByUnit[e.unit_id].push(e); });
      }
      adminAllContent.push({ course: c, units, examsByUnit });
    }
  }
  function getPublicCoverUrl(path: string | null) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;
  }
  const enrollMap = new Map((enrollments||[]).map((e:any)=>[e.course_id, e.status]));
  const displayApproved = isAdmin ? (approvedDetails.length>0 ? approvedDetails : adminAllContent) : approvedDetails;
  const yearColor = (y:string) => y==="تالتة ثانوي" ? "bg-[#FF6B35] text-white border-black" : y==="تانية ثانوي" ? "bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 text-black border-black" : "bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border-black";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 space-y-6">
      {/* Header bento */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bento-card-peach p-5 flex justify-between items-center">
          <div>
            <h1 className="font-black text-xl flex gap-2 items-center">أهلاً {profile.username} <Sparkles size={18} className="text-[#FF6B35]"/></h1>
            <p className="text-sm text-muted-foreground flex gap-2 items-center flex-wrap mt-1">
              <span className="bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border border-black rounded-full px-2 py-0.5 text-xs">{profile.phone}</span>
              {userYear ? <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${yearColor(userYear)}`}>{userYear}</span> : <Badge variant="destructive">لم تحدد السنة</Badge>}
              {isAdmin && <span className="bg-black text-white rounded-full px-2 py-0.5 text-xs">admin</span>}
            </p>
          </div>
          <div className="hidden sm:flex bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border border-black rounded-full p-1.5"><GraduationCap size={24}/></div>
        </div>
        <div className="bento-card p-4 flex flex-col justify-center gap-2">
          <p className="font-bold text-sm">درجاتي والإحصائيات</p>
          <p className="text-xs text-muted-foreground">تابع نتائج الامتحانات والواجبات</p>
          <Button size="sm" className="rounded-full" asChild><Link href="/dashboard/grades">عرض الدرجات</Link></Button>
        </div>
      </div>

      {!userYear && !isAdmin && (
        <div className="bento-card-lime p-3 text-sm dark:text-black">حدد سنتك لإظهار كورساتك فقط. تواصل مع الإدارة: <code className="bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border border-black rounded px-1">update profiles set year='تالتة ثانوي' where id='{user.id}'</code></div>
      )}

      {/* My courses - highlighted as most important */}
      <div className="bento-card p-4 sm:p-5 border-[2px] border-black dark:border-zinc-600 ring-2 ring-[#FF6B35]/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-6 bg-[#FF6B35] border border-black rounded-full animate-pulse" />
          <h2 className="font-black text-lg">{isAdmin ? "كل المحتوى (أدمن)" : "كورساتي المشتراة"}</h2>
          <span className="text-xs bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 border border-black rounded-full px-2 py-0.5 font-bold">{displayApproved.length} كورس</span>
          <span className="text-xs bg-[#FF6B35] text-white rounded-full px-2 py-0.5">مهم</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">هذا أهم قسم — كل فيديوهاتك و واجباتك المفعلة هنا</p>
        {displayApproved.length===0 ? (
          <div className="bento-card-warm p-8 text-center text-sm"> {isAdmin ? "لا يوجد كورسات بعد — أنشئ من لوحة الإدارة" : "لم يتم تفعيل أي كورس بعد. اشترك من الأسفل وانتظر الموافقة."} </div>
        ) : (
          <div className="space-y-4">
            {displayApproved.map(({course, units, examsByUnit}:any)=>(
              <div key={course.id} className="border-[1.5px] border-black dark:border-zinc-700 rounded-2xl overflow-hidden bg-[#F5F1E8] dark:bg-zinc-800">
                <div className="bg-white dark:bg-zinc-900 border-b-[1.5px] border-black dark:border-zinc-700 px-4 py-2 flex gap-2 items-center">
                  <BookOpen size={14}/><span className="font-black text-sm">{course.title}</span><span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${yearColor(course.year)}`}>{course.year}</span>
                  {isAdmin && <span className="text-xs bg-black dark:bg-white dark:text-black text-white rounded-full px-2">admin view</span>}
                </div>
                <div className="p-3 space-y-3">
                  {!units?.length ? <p className="text-sm text-muted-foreground">لا يوجد Units بعد</p> : units.map((u:any)=>{
                    const unitCover = getPublicCoverUrl(u.cover_url);
                    return (
                      <div key={u.id} className="bg-white dark:bg-zinc-900 border border-black dark:border-zinc-700 rounded-xl p-3">
                        <div className="flex gap-3">
                          {unitCover && <img src={unitCover} alt={u.title} className="w-16 h-16 rounded-lg object-cover border border-black shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm flex gap-1 items-center">Unit: {u.title} <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] border border-black inline-block" /></p>
                            <div className="mt-2 grid gap-1.5">
                              {u.lessons?.sort((a:any,b:any)=>a.order_index-b.order_index).map((l:any)=>(
                                <Link key={l.id} href={`/dashboard/watch/${l.id}`} className="flex justify-between items-center bg-[#F5F1E8] dark:bg-zinc-800 hover:bg-[#EDE8D0] dark:hover:bg-zinc-700 border border-black dark:border-zinc-600 rounded-full px-3 py-1.5 text-sm">
                                  <span className="flex gap-2 items-center truncate"><span className={`w-6 h-6 rounded-full flex items-center justify-center border border-black shrink-0 ${l.type==="video"?"bg-[#FF6B35] text-white":"bg-white dark:bg-zinc-700"}`}>{l.type==="video"?<Video size={12}/>:<FileText size={12}/>}</span><span className="truncate">{l.title}</span></span>
                                  <span className="text-xs bg-black dark:bg-white dark:text-black text-white rounded-full px-2 py-0.5 shrink-0">فتح</span>
                                </Link>
                              ))}
                              {(examsByUnit?.[u.id]||[]).map((ex:any)=>(
                                <Link key={ex.id} href={`/dashboard/exams/${ex.id}`} className="flex justify-between items-center bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 hover:bg-[#EDE84A] border border-black rounded-full px-3 py-1.5 text-sm">
                                  <span className="flex gap-2 items-center truncate"><span className={`w-6 h-6 rounded-full border border-black flex items-center justify-center ${ex.type==="exam"?"bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700":"bg-black text-white"}`}>{ex.type==="exam"?<FileQuestion size={12}/>:<ClipboardCheck size={12}/>}</span>{ex.title}</span>
                                  <span className="text-xs bg-black text-white rounded-full px-2 py-0.5">حل</span>
                                </Link>
                              ))}
                              {!u.lessons?.length && !(examsByUnit?.[u.id]||[]).length && <p className="text-xs text-muted-foreground">لا يوجد محتوى</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All courses */}
      <div className="bento-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-6 bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 border border-black rounded-full" />
          <h2 className="font-black text-lg">{isAdmin ? `كل الكورسات` : `كل كورسات ${userYear || "المنصة"}`}</h2>
          {isAdmin ? <span className="text-xs bg-black text-white rounded-full px-2 py-0.5">{yearCourses.length} كورس</span> : userYear && <span className="text-xs text-muted-foreground">({userYear} فقط)</span>}
        </div>
        <p className="text-xs text-muted-foreground mb-4">{isAdmin ? "كأدمن ترى كل السنوات ويمكنك فتح أي محتوى" : "اشترك وارفع صورة الدفع — التفعيل بعد المراجعة"}</p>
        {!yearCourses.length ? (
          <div className="bento-card-warm p-8 text-center text-sm">لا يوجد كورسات</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {yearCourses.map((c:any)=>{
              const status = enrollMap.get(c.id);
              const cover = getPublicCoverUrl(c.cover_url);
              return (
                <div key={c.id} className="bento-card p-0 overflow-hidden">
                  <div className="h-36 bg-[#EDE8D0] border-b-[1.5px] border-black overflow-hidden">
                    {cover ? <img src={cover} alt={c.title} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Cover</div>}
                  </div>
                  <div className="p-3">
                    <div className="flex gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${yearColor(c.year)}`}>{c.year}</span>
                      <span className="text-xs bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 border border-black rounded-full px-2 py-0.5 font-black">{c.price} جنيه</span>
                    </div>
                    <p className="font-black text-sm mt-2 line-clamp-2">{c.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="mt-3">
                      {isAdmin ? <Button size="sm" className="w-full rounded-full" asChild><Link href={`/courses/${c.id}`}>عرض / تعديل</Link></Button>
                      : status==="approved" ? <div className="bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 border border-black rounded-full text-center py-1.5 text-xs font-black">مفعل ✓</div>
                      : status==="pending" ? <div className="bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 border border-black rounded-full text-center py-1.5 text-xs">قيد المراجعة ⏳</div>
                      : <Button size="sm" className="w-full rounded-full" asChild><Link href={`/courses/${c.id}`}>اشتراك</Link></Button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
