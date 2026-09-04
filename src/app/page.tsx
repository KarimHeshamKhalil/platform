import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Award, PlayCircle, Lock, Phone, ArrowUpRight, Star, GraduationCap } from "lucide-react";
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
    <div className="flex flex-col gap-6 px-3 sm:px-4 pb-6">
      {/* Hero: two big cards - swapped */}
      <section className="gap-4 grid lg:grid-cols-2 mx-auto w-full max-w-7xl">
        {/* Left: Big info */}
        <div className="flex flex-col gap-5 p-6 sm:p-8 min-h-[420px] lg:min-h-[520px] bento-card">
          <div className="inline-flex items-center gap-1 bg-[#F5F1E8] dark:bg-zinc-800 px-2 py-1 border border-black rounded-full w-fit dark:text-zinc-100 text-xs">
            <span className="inline-block bg-[#FF6B35] border border-black rounded-full w-2 h-2" /> ثانوية عامة • اولي - تانية - تالتة ثانوي
          </div>
          <h1 className="font-black lg:text-[44px] text-3xl sm:text-4xl leading-[1.05]">
            تعليم ثانوي<br/>
            <span className="inline-flex items-center gap-2">تفاعلي <span className="inline-block bg-[#FF6B35] border-[1.5px] border-black rounded-full w-7 h-7" /><span className="inline-block bg-[#F7F36A] dark:bg-[#4A4000] -ml-3 border-[1.5px] border-black dark:border-zinc-600 rounded-full w-7 h-7 text-black dark:text-[#F7F36A]" /></span><br/>
            يلهم التفوق
          </h1>
          <p className="max-w-xl text-muted-foreground text-sm leading-relaxed">
            شرح مبسط، متابعة يومية، واجبات وامتحانات لكل Unit — منصة تفاعلية حيث يلهم المدرس طلاب الثانوية لإطلاق قدراتهم.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="bg-black dark:bg-white rounded-full text-white dark:text-black" asChild><Link href="#courses">ابدأ الآن <ArrowUpRight size={16}/></Link></Button>
            <Button size="lg" variant="outline" className="bg-[#F5F1E8] dark:bg-zinc-800 rounded-full" asChild><Link href="/register">انشاء حساب <PlayCircle size={16}/></Link></Button>
          </div>
          <div className="gap-3 grid grid-cols-3 mt-auto pt-2">
            <div className="bg-[#EDE8D0] dark:bg-zinc-800 p-3 border border-black dark:border-zinc-700 rounded-2xl text-center">
              <p className="flex justify-center gap-1 font-black text-lg"><Users size={16} className="mt-1"/>5000+</p><p className="text-muted-foreground text-xs">طالب</p>
            </div>
            <div className="bg-[#F7F36A] dark:bg-[#00000] dark:bg-[#4A4000] p-3 border border-black dark:border-zinc-600 rounded-2xl text-black dark:text-[#F7F36A] text-center">
              <p className="font-black text-lg">15 سنة</p><p className="text-xs">خبرة</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-3 border border-black dark:border-zinc-700 rounded-2xl text-center">
              <p className="flex justify-center gap-1 font-black text-lg"><BookOpen size={16} className="mt-1"/>3</p><p className="text-muted-foreground text-xs">سنوات</p>
            </div>
          </div>
        </div>

        {/* Right: Teacher image - big */}
        <div className="flex flex-col p-0 min-h-[420px] lg:min-h-[520px] overflow-hidden bento-card">
          <div className="flex justify-between items-center bg-[#FF6B35] px-4 py-2 border-black border-b-[1.5px]">
            <span className="text-white text-xs">●</span>
          </div>
          <div className="relative flex flex-1 justify-center items-center bg-[#F5F1E8] dark:bg-zinc-800 p-4 overflow-hidden">
            <div className="bg-[#FFE8D6] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] border-[2px] border-black rounded-full w-[75%] max-w-[340px] aspect-square overflow-hidden">
              <Image alt="teacher" src={"/images/teacher.JPG"} width={600} height={600} className="w-full h-full object-cover" />
            </div>
            <div className="bottom-4 left-4 absolute bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] px-3 py-2 border-[1.5px] border-black dark:border-zinc-700 rounded-2xl">
              <p className="font-black text-sm">أحمد الجزار</p>
              <p className="text-muted-foreground text-xs">15 سنة خبرة • فيزياء • 4.9 <Star size={10} className="inline fill-[#FF6B35] text-[#FF6B35]"/></p>
            </div>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="teacher" className="gap-4 grid md:grid-cols-3 mx-auto w-full max-w-7xl">
        <div className="p-5 bento-card-lime">
          <div className="flex justify-center items-center bg-black border border-black rounded-full w-10 h-10 text-white"><Award size={18}/></div>
          <p className="mt-3 font-black">خبرة طويلة</p>
          <p className="mt-1 text-muted-foreground text-sm">شرح بنظام الثانوية الجديد مع واجبات وامتحانات لكل Unit.</p>
        </div>
        <div className="p-5 bento-card">
          <div className="flex justify-center items-center bg-[#FF6B35] border border-black rounded-full w-10 h-10 text-white"><PlayCircle size={18}/></div>
          <p className="mt-3 font-black">فيديو آمن</p>
          <p className="mt-1 text-muted-foreground text-sm">مشغل محمي بعلامة مائية + PDFs للمشتركين فقط.</p>
        </div>
        <div className="p-5 bento-card-warm">
          <div className="flex justify-center items-center bg-white dark:bg-zinc-800 border border-black dark:border-zinc-700 rounded-full w-10 h-10 dark:text-zinc-100"><Phone size={18}/></div>
          <p className="mt-3 font-black">متابعة واتساب</p>
          <p className="mt-1 text-muted-foreground text-sm">دعم مباشر للطلاب وأولياء الأمور.</p>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="mx-auto w-full max-w-7xl">
        <div className="p-4 sm:p-6 bento-card">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
            <div>
              <h2 className="flex items-center gap-2 font-black text-2xl">الكورسات المتاحة <span className="inline-block bg-[#FF6B35] border border-black rounded-full w-2 h-2" /></h2>
              <p className="mt-1 text-muted-foreground text-sm">اضغط السنة لتصفية الكورسات كزائر</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/#courses" className={`px-4 py-1.5 rounded-full text-sm font-bold border-[1.5px] border-black transition ${!activeYear ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>الكل</Link>
              {YEARS.map(y => (
                <Link key={y} href={`/?year=${encodeURIComponent(y)}#courses`} className={`px-4 py-1.5 rounded-full text-sm font-bold border-[1.5px] border-black transition ${activeYear===y ? 'bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>{y}</Link>
              ))}
            </div>
          </div>

          {!courses || courses.length === 0 ? (
            activeYear ? (
              <div className="p-8 text-center bento-card-warm">لا يوجد كورسات في {activeYear} بعد</div>
            ) : (
              <div className="gap-4 grid md:grid-cols-3">
                {[1,2,3].map(i=>(
                  <div key={i} className="p-0 overflow-hidden bento-card">
                    <div className="flex justify-center items-center bg-[#EDE8D0] h-44">Cover</div>
                    <div className="p-4">
                      <div className="flex justify-between items-center"><Badge className="bg-[#F7F36A] dark:bg-[#4A4000] border-black dark:border-zinc-600 text-black text-black dark:text-[#F7F36A]">اولي ثانوي</Badge><span className="font-black">600 جنيه</span></div>
                      <p className="mt-2 font-bold">مثال: فيزياء - اولي ثانوي</p>
                      <p className="text-muted-foreground text-xs">4 Units • 20 Video • 12 PDF</p>
                      <Button className="mt-3 w-full" asChild><Link href="/register"><Lock size={14}/> سجل للعرض</Link></Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="gap-4 grid md:grid-cols-3">
              {courses.map((c:any)=>{
                const cover = getPublicCoverUrl(c.cover_url);
                const yearColor = c.year==="تالتة ثانوي" ? "bg-[#FF6B35] text-white" : c.year==="تانية ثانوي" ? "bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 text-black" : "bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700";
                return (
                <div key={c.id} className="p-0 overflow-hidden transition hover:translate-y-[-2px] bento-card">
                  <div className="bg-[#EDE8D0] border-black border-b-[1.5px] h-44 overflow-hidden">
                    {cover ? <img src={cover} alt={c.title} className="w-full h-full object-cover"/> : <div className="flex justify-center items-center w-full h-full text-muted-foreground">Cover</div>}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <Badge className={`${yearColor} border-black`}>{c.year}</Badge>
                      <span className="bg-[#F7F36A] dark:bg-[#4A4000] px-2 py-0.5 border border-black dark:border-zinc-600 rounded-full font-black text-black dark:text-[#F7F36A] text-sm">{c.price} جنيه</span>
                    </div>
                    <p className="mt-2 font-black line-clamp-2">{c.title}</p>
                    <p className="text-muted-foreground text-xs line-clamp-2">{c.description}</p>
                    <Button className="bg-black mt-3 w-full" asChild><Link href={`/courses/${c.id}`}><Lock size={14}/> عرض الكورس</Link></Button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
          <p className="bg-[#F7F36A] dark:bg-[#4A4000] mx-auto mt-4 px-3 py-1 border border-black dark:border-zinc-600 rounded-full w-fit text-black dark:text-[#F7F36A] text-xs text-center">⚠️ الفيديوهات والـ PDFs للمشتركين المفعلين فقط</p>
        </div>
      </section>

      <section className="flex sm:flex-row flex-col justify-between items-center gap-4 mx-auto p-6 w-full max-w-7xl bento-card-orange">
        <div>
          <h3 className="font-black text-xl">جاهز تبدأ؟</h3>
          <p className="opacity-80 text-sm">أنشئ حساب واختر سنتك الدراسية</p>
        </div>
        <Button size="lg" className="bg-white hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-black dark:border-zinc-700 rounded-full text-black dark:text-zinc-100" asChild><Link href="/register">انشاء حساب الآن <ArrowUpRight size={16}/></Link></Button>
      </section>
    </div>
  );
}
