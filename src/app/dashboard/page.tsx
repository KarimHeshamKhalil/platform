import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Video, FileText, GraduationCap } from "lucide-react";

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
      approvedDetails.push({ course: c, units });
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
      adminAllContent.push({ course: c, units });
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-wrap justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">أهلاً {profile.username} 👋</h1>
          <p className="text-muted-foreground flex gap-2 items-center flex-wrap">
            <span>{profile.phone}</span>
            {userYear ? <Badge className="gap-1"><GraduationCap size={14}/>{userYear}</Badge> : <Badge variant="destructive">لم تحدد السنة</Badge>}
            {isAdmin && <Badge variant="outline">admin</Badge>}
          </p>
        </div>
        {!userYear && !isAdmin && (
          <Card className="border-orange-200 bg-orange-50 p-3 text-sm max-w-sm">
            حدد سنتك الدراسية لإظهار كورساتك فقط. تواصل مع الإدارة أو حدثها من Supabase: <code className="bg-white px-1 rounded">update profiles set year='تالتة ثانوي' where id='{user.id}'</code>
          </Card>
        )}
      </div>

      <div>
        <h2 className="font-bold text-xl mb-3">{isAdmin ? "كل المحتوى (أدمن - ترى كل شيء بدون اشتراك)" : "كورساتي المشتراة"}</h2>
        {displayApproved.length===0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">{isAdmin ? "لا يوجد كورسات بعد - أنشئ كورس من لوحة الإدارة" : "لم يتم تفعيل أي كورس بعد. اشترك من القسم التالي وانتظر موافقة الإدارة."}</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {displayApproved.map(({course, units}:any)=>(
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle className="flex gap-2 items-center">{course.title} <Badge>{course.year}</Badge> {isAdmin && <Badge variant="outline">admin view</Badge>}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!units?.length ? <p className="text-sm text-muted-foreground">لا يوجد Units بعد</p> : units.map((u:any)=>{
                    const unitCover = getPublicCoverUrl(u.cover_url);
                    return (
                      <div key={u.id} className="border rounded-xl p-4 bg-zinc-50/50">
                        <div className="flex gap-3 items-start">
                          {unitCover && <img src={unitCover} alt={u.title} className="w-20 h-20 rounded-lg object-cover border flex-shrink-0" />}
                          <div className="flex-1">
                            <h4 className="font-bold">Unit: {u.title}</h4>
                            <div className="mt-2 grid gap-2">
                              {u.lessons?.sort((a:any,b:any)=>a.order_index-b.order_index).map((l:any)=>(
                                <Link key={l.id} href={`/dashboard/watch/${l.id}`} className="flex justify-between items-center bg-white hover:bg-zinc-100 border rounded-lg px-3 py-2">
                                  <span className="flex gap-2 items-center text-sm">{l.type==="video"?<Video size={16} className="text-blue-600"/>:<FileText size={16} className="text-red-600"/>}{l.title} <span className="text-xs text-muted-foreground">({l.type==="video"?"Video":"PDF"})</span></span>
                                  <span className="text-xs text-primary underline">فتح {isAdmin && "كأدمن"}</span>
                                </Link>
                              ))}
                              {!u.lessons?.length && <p className="text-xs text-muted-foreground">لا يوجد دروس في هذا الـ Unit</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold text-xl mb-1">{isAdmin ? "كل الكورسات (كل السنوات - أدمن)" : `كل كورسات ${userYear || "المنصة"}`} {isAdmin ? <Badge>admin: {yearCourses.length} كورس</Badge> : userYear && <span className="text-sm font-normal text-muted-foreground">(تظهر فقط كورسات سنتك)</span>}</h2>
        <p className="text-sm text-muted-foreground mb-3">{isAdmin ? "كأدمن ترى كل الكورسات من كل السنوات ويمكنك فتح أي فيديو مباشرة" : "اشترك في أي كورس وارفع صورة الدفع - سيتم التفعيل بعد المراجعة"}</p>
        {!yearCourses.length ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">لا يوجد كورسات لهذه السنة بعد</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {yearCourses.map((c:any)=>{
              const status = enrollMap.get(c.id);
              const courseCover = getPublicCoverUrl(c.cover_url);
              return (
                <Card key={c.id} className="overflow-hidden">
                  <div className="h-40 bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {courseCover ? <img src={courseCover} alt={c.title} className="w-full h-full object-cover"/> : <span className="text-muted-foreground text-sm">Cover</span>}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">{c.year}</Badge>
                      <span className="font-bold text-sm">{c.price} جنيه</span>
                    </div>
                    <CardTitle className="text-base line-clamp-2 mt-2">{c.title}</CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  </CardHeader>
                  <CardContent>
                    {isAdmin ? (
                      <Button size="sm" className="w-full" asChild><Link href={`/courses/${c.id}`}>عرض / تعديل (أدمن)</Link></Button>
                    ) : status==="approved" ? (
                      <Badge className="w-full justify-center py-1.5">مفعل ✓ - موجود في كورساتي فوق</Badge>
                    ) : status==="pending" ? (
                      <Badge variant="secondary" className="w-full justify-center py-1.5">قيد المراجعة ⏳</Badge>
                    ) : status==="rejected" ? (
                      <Button size="sm" variant="destructive" className="w-full" asChild><Link href={`/courses/${c.id}`}>مرفوض - اعادة المحاولة</Link></Button>
                    ) : (
                      <Button size="sm" className="w-full" asChild><Link href={`/courses/${c.id}`}>عرض التفاصيل والاشتراك</Link></Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
