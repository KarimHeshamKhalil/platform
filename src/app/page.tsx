import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Award, PlayCircle, Lock, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

const YEARS = ["اولي ثانوي", "تانية ثانوي", "تالتة ثانوي"] as const;

export default async function Home({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year: filterYear } = await searchParams;
  const activeYear = YEARS.includes(filterYear as any) ? filterYear! : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  let query = supabase.from("courses").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(12);
  if (activeYear) query = query.eq("year", activeYear);
  const { data: courses } = await query;

  function getPublicCoverUrl(path: string | null) {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;
  }

  return (
    <div className="flex flex-col">
      <section className="bg-white border-b">
        <div className="items-center gap-12 grid lg:grid-cols-2 mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 max-w-7xl">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-sm">ثانوية عامة • اولي - تانية - تالتة ثانوي</Badge>
            <h1 className="font-extrabold text-4xl lg:text-5xl leading-tight">
              مع الأستاذ <span className="text-primary"> أحمد الجزار</span> التفوق <br /> مضمون في الثانوية
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              شرح مبسط، متابعة مستمرة، وامتحانات دورية. جميع الكورسات منظمة حسب السنة الدراسية - كل كورس مقسم إلى Units وكل Unit يحتوي على فيديوهات و PDFs.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button size="lg" className="whitespace-nowrap" asChild><Link href="#courses">تصفح الكورسات</Link></Button>
              <Button size="lg" variant="outline" className="whitespace-nowrap" asChild><Link href="/register">انشاء حساب جديد</Link></Button>
            </div>
            <div className="flex gap-6 pt-4 text-sm">
              <span className="flex items-center gap-2"><Users size={18} /> +5000 طالب</span>
              <span className="flex items-center gap-2"><Award size={18} /> خبرة 15 سنة</span>
              <span className="flex items-center gap-2"><BookOpen size={18} /> 3 سنوات دراسية</span>
            </div>
          </div>
          <div className="relative">
            <div className="flex flex-col justify-center items-center bg-zinc-100 border-2 border-dashed rounded-2xl aspect-[4/3] text-center">
              <Image alt="Teacher Pic" src={"/images/teacher.JPG"} width={2000} height={2000} className="shadow-xl rounded-md" />
            </div>
          </div>
        </div>
      </section>

      <section id="teacher" className="mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full max-w-7xl">
        <div className="gap-6 grid md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle className="flex gap-2"><Award size={20}/> خبرة طويلة</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">شرح بنظام الثانوية الجديد مع متابعة واجبات وامتحانات شاملة لكل Unit.</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex gap-2"><PlayCircle size={20}/> فيديوهات عالية الجودة</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">مشغل فيديو آمن + ملفات PDF لكل درس، متاحة فقط للمشتركين.</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex gap-2"><Phone size={20}/> متابعة واتساب</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">دعم مباشر للطلاب وأولياء الأمور عبر رقم الواتساب المعلن.</CardContent>
          </Card>
        </div>
      </section>

      <section id="courses" className="bg-zinc-100/50 py-16 border-y">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <h2 className="font-bold text-3xl">الكورسات المتاحة</h2>
              <p className="mt-2 text-muted-foreground">اضغط على السنة لتصفية الكورسات - كزائر</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/#courses" className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${!activeYear ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-100'}`}>الكل</Link>
              {YEARS.map(y => (
                <Link key={y} href={`/?year=${encodeURIComponent(y)}#courses`} className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${activeYear===y ? 'bg-black text-white border-black' : 'bg-white hover:bg-zinc-100'}`}>{y}</Link>
              ))}
            </div>
          </div>

          {!courses || courses.length === 0 ? (
            activeYear ? (
              <Card><CardContent className="py-12 text-muted-foreground text-center">لا يوجد كورسات في {activeYear} بعد</CardContent></Card>
            ) : (
              <div className="gap-6 grid md:grid-cols-3">
                {[1,2,3].map(i=>(
                  <Card key={i} className="overflow-hidden">
                    <div className="flex justify-center items-center bg-zinc-200 h-48 text-muted-foreground">Cover</div>
                    <CardHeader>
                      <div className="flex justify-between">
                        <Badge>اولي ثانوي</Badge>
                        <span className="font-bold">600 جنيه</span>
                      </div>
                      <CardTitle className="mt-2">مثال: فيزياء - اولي ثانوي - الترم الأول</CardTitle>
                      <p className="text-muted-foreground text-sm">4 Units • 20 Video • 12 PDF</p>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" asChild><Link href="/register"><Lock size={16}/> سجل دخول للعرض</Link></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <div className="gap-6 grid md:grid-cols-3">
              {courses.map((c:any)=>{
                const cover = getPublicCoverUrl(c.cover_url);
                return (
                <Card key={c.id} className="hover:shadow-lg overflow-hidden transition">
                  <div className="flex justify-center items-center bg-zinc-200 h-48 overflow-hidden">
                    {cover ? <img src={cover} alt={c.title} className="w-full h-full object-cover"/> : <span className="text-muted-foreground">Cover</span>}
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <Badge>{c.year}</Badge>
                      <span className="font-bold">{c.price} جنيه</span>
                    </div>
                    <CardTitle className="mt-2 line-clamp-2">{c.title}</CardTitle>
                    <p className="text-muted-foreground text-sm line-clamp-2">{c.description}</p>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" asChild><Link href={`/courses/${c.id}`}><Lock size={16}/> عرض الكورس</Link></Button>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
          <p className="mt-8 text-muted-foreground text-sm text-center">⚠️ لا يمكنك مشاهدة الفيديوهات أو تحميل الـ PDFs بدون اشتراك مفعل</p>
        </div>
      </section>

      <section className="py-16 text-center">
        <h3 className="mb-3 font-bold text-2xl">جاهز تبدأ؟</h3>
        <p className="mb-6 text-muted-foreground">أنشئ حساب واختر سنتك الدراسية</p>
        <Button size="lg" asChild><Link href="/register">انشاء حساب الآن</Link></Button>
      </section>
    </div>
  );
}
