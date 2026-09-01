import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminActions from "./AdminActions";
import CourseManager from "./CourseManager";

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
      <p className="text-muted-foreground">ادارة متعددة - أي حساب role=admin يظهر هنا. لتفعيل ادمن جديد: حدث profiles.role الى admin في Supabase.</p>

      <Card>
        <CardHeader><CardTitle>طلبات الاشتراك (الدفع اليدوي)</CardTitle></CardHeader>
        <CardContent>
          {!enrollments?.length ? <p className="text-muted-foreground text-center py-8">لا يوجد طلبات</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>الطالب</TableHead><TableHead>الكورس</TableHead><TableHead>الحالة</TableHead><TableHead>Screenshot</TableHead><TableHead>اجراء</TableHead></TableRow></TableHeader>
              <TableBody>
                {enrollments.map((e:any)=>(
                  <TableRow key={e.id}>
                    <TableCell><div className="font-medium">{e.profiles.username}</div><div className="text-xs text-muted-foreground">{e.profiles.phone}</div></TableCell>
                    <TableCell>{e.courses.title} <Badge variant="outline">{e.courses.year}</Badge></TableCell>
                    <TableCell><Badge variant={e.status==="approved"?"default":e.status==="pending"?"secondary":"destructive"}>{e.status}</Badge></TableCell>
                    <TableCell>{e.screenshot_url ? <ProofLink path={e.screenshot_url}/> : "-"}</TableCell>
                    <TableCell><AdminActions id={e.id} status={e.status}/></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CourseManager courses={courses||[]} />

      <Card>
        <CardHeader><CardTitle>المستخدمين (اخر 50)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>username</TableHead><TableHead>phone</TableHead><TableHead>role</TableHead></TableRow></TableHeader>
            <TableBody>
              {profiles?.map((p:any)=>(
                <TableRow key={p.id}><TableCell>{p.username}</TableCell><TableCell>{p.phone}</TableCell><TableCell><Badge variant={p.role==="admin"?"default":"outline"}>{p.role}</Badge></TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

async function ProofLink({ path }: { path: string }) {
  const service = await createServiceClient();
  const { data } = await service.storage.from("proofs").createSignedUrl(path, 3600);
  return data?.signedUrl ? <a href={data.signedUrl} target="_blank" className="underline text-primary text-sm">عرض الصورة</a> : <span className="text-xs">—</span>;
}
