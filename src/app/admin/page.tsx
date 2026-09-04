import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminActions from "./AdminActions";
import CourseManager from "./CourseManager";
import DeleteManager from "./DeleteManager";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");
  const { data: enrollments } = await supabase.from("enrollments").select("*, profiles!inner(username, phone), courses(title,year,price)").order("created_at", { ascending: false }).limit(50);
  const { data: courses } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
  const { data: profiles } = await supabase.from("profiles").select("id,username,phone,role").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="space-y-6 mx-auto px-3 sm:px-4 py-6 max-w-7xl">
      <div className="flex justify-between items-center p-5 bento-card-orange">
        <div>
          <h1 className="font-black text-xl">لوحة الإدارة</h1>
          <p className="opacity-80 text-sm">أهلا {profile?.role} — إدارة الكورسات والاشتراكات</p>
        </div>
        <span className="bg-white dark:bg-zinc-800 px-3 py-1 border border-black dark:border-zinc-700 rounded-full font-black text-black dark:text-zinc-100 text-xs">{courses?.length || 0} كورس</span>
      </div>

      <div className="p-0 overflow-hidden bento-card">
        <div className="flex justify-between items-center bg-[#F7F36A] dark:bg-[#3A3300] dark:bg-[#4A4000] px-4 py-3 border-black dark:border-zinc-600 dark:border-zinc-700 border-b-[1.5px] text-black dark:text-[#F7F36A]">
          <p className="font-black dark:text-white">طلبات الاشتراك (الدفع اليدوي)</p>
          <span className="bg-black dark:bg-white px-2 py-0.5 rounded-full text-white dark:text-black text-xs">{enrollments?.length || 0} طلب</span>
        </div>
        <div className="p-4">
          {!enrollments?.length ? <p className="bg-[#F5F1E8] dark:bg-zinc-800 py-8 border border-black dark:border-zinc-700 rounded-xl text-sm text-center">لا يوجد طلبات</p> : (
            <div className="border-[1.5px] border-black dark:border-zinc-700 rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-[#F5F1E8] dark:bg-zinc-800"><TableRow><TableHead>الطالب</TableHead><TableHead>الكورس</TableHead><TableHead>الحالة</TableHead><TableHead>Screenshot</TableHead><TableHead>اجراء</TableHead></TableRow></TableHeader>
                <TableBody>
                  {enrollments.map((e:any)=>(
                    <TableRow key={e.id} className="hover:bg-[#FFE8D6]/50">
                      <TableCell><div className="font-bold">{e.profiles.username}</div><div className="text-muted-foreground text-xs">{e.profiles.phone}</div></TableCell>
                      <TableCell>{e.courses.title} <span className="bg-[#F7F36A] dark:bg-[#4A4000] px-1.5 border border-black dark:border-zinc-600 rounded-full text-black dark:text-[#F7F36A] text-xs">{e.courses.year}</span></TableCell>
                      <TableCell>{e.status==="approved" ? <Badge className="bg-black dark:text-white">مقبول</Badge> : e.status==="pending" ? <Badge className="bg-[#FF6B35] border-black">قيد المراجعة</Badge> : <Badge variant="destructive">مرفوض</Badge>}</TableCell>
                      <TableCell>{e.screenshot_url ? <ProofLink path={e.screenshot_url}/> : "-"}</TableCell>
                      <TableCell><AdminActions id={e.id} status={e.status}/></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <CourseManager courses={courses||[]} />
      <DeleteManager courses={courses||[]} />

      <div className="p-0 overflow-hidden bento-card">
        <div className="bg-[#F5F1E8] dark:bg-zinc-800 px-4 py-3 border-black dark:border-zinc-700 border-b-[1.5px]">
          <p className="font-black">الامتحانات والواجبات</p>
          <p className="text-muted-foreground text-xs">إدارة الامتحانات المنشأة</p>
        </div>
        <div className="p-4"><ExamsList /></div>
      </div>

      <div className="p-0 overflow-hidden bento-card">
        <div className="flex justify-between bg-white dark:bg-zinc-800 px-4 py-3 border-black dark:border-zinc-700 border-b">
          <p className="font-black">المستخدمين (آخر 50)</p>
          <span className="bg-black dark:bg-white px-2 py-1 rounded-full text-white dark:text-black text-xs">{profiles?.length || 0}</span>
        </div>
        <div className="p-3">
          <div className="border border-black rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F5F1E8] dark:bg-zinc-800 dark:text-zinc-100"><TableRow><TableHead>username</TableHead><TableHead>phone</TableHead><TableHead>role</TableHead></TableRow></TableHeader>
              <TableBody>
                {profiles?.map((p:any)=>(
                  <TableRow key={p.id}><TableCell className="font-medium">{p.username}</TableCell><TableCell>{p.phone}</TableCell><TableCell>{p.role==="admin" ? <Badge className="bg-black dark:text-white">admin</Badge> : <Badge variant="outline">student</Badge>}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProofLink({ path }: { path: string }) {
  const service = await createServiceClient();
  const { data } = await service.storage.from("proofs").createSignedUrl(path, 3600);
  return data?.signedUrl ? <a href={data.signedUrl} target="_blank" className="bg-[#F7F36A] dark:bg-[#4A4000] px-2 py-0.5 border border-black dark:border-zinc-600 rounded-full font-bold text-black dark:text-[#F7F36A] text-xs">عرض الصورة</a> : <span className="text-xs">—</span>;
}

async function ExamsList() {
  const supabase = await createClient();
  const { data: exams } = await supabase.from("exams").select("id,title,type,is_published, units!inner(title,courses(title,year))").order("created_at", { ascending: false }).limit(20);
  if (!exams?.length) return <p className="bg-[#F5F1E8] py-6 border border-black rounded-xl text-sm text-center">لا يوجد امتحانات بعد — أنشئ من قسم 3 أعلاه</p>;
  return (
    <div className="border-[1.5px] border-black rounded-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-[#F5F1E8] dark:bg-zinc-800 dark:text-zinc-100"><TableRow><TableHead>العنوان</TableHead><TableHead>النوع</TableHead><TableHead>Unit</TableHead><TableHead>منشور</TableHead><TableHead>فتح</TableHead></TableRow></TableHeader>
        <TableBody>
          {exams.map((e:any)=>(
            <TableRow key={e.id} className="hover:bg-[#FFE8D6]/40">
              <TableCell className="font-bold">{e.title}</TableCell>
              <TableCell>{e.type==="exam"?<span className="bg-[#FF6B35] px-2 py-0.5 border border-black rounded-full text-white text-xs">Exam</span>:<span className="bg-[#F7F36A] dark:bg-[#4A4000] px-2 py-0.5 border border-black dark:border-zinc-600 rounded-full text-black dark:text-[#F7F36A] text-xs">Homework</span>}</TableCell>
              <TableCell className="text-xs">{e.units.courses.title} / {e.units.title}</TableCell>
              <TableCell>{e.is_published ? <Badge className="bg-black dark:text-white">منشور</Badge> : <span className="bg-white dark:bg-zinc-800 px-2 py-0.5 border border-black dark:border-zinc-700 rounded-full dark:text-zinc-100 text-xs">مسودة</span>}</TableCell>
              <TableCell><div className="flex gap-1"><Link href={`/admin/exams/${e.id}/builder`} className="bg-black px-2 py-1 rounded-full text-white text-xs">باني</Link><Link href={`/admin/exams/${e.id}/submissions`} className="bg-white dark:bg-zinc-800 px-2 py-1 border border-black dark:border-zinc-700 rounded-full dark:text-zinc-100 text-xs">تصحيح</Link></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
