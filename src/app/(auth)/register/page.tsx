"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [year, setYear] = useState("تالتة ثانوي");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.length < 3) return setError("اسم المستخدم 3 حروف على الأقل");
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return setError("اسم المستخدم انجليزي فقط بدون مسافات");
    if (phone.length < 11) return setError("رقم الموبايل غير صحيح");
    if (password.length < 6) return setError("كلمة السر 6 حروف على الأقل");
    if (!["اولي ثانوي","تانية ثانوي","تالتة ثانوي"].includes(year)) return setError("اختر السنة الدراسية");
    setLoading(true);
    const supabase = createClient();
    const email = usernameToEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, phone, year } }
    });
    console.log("signup result", { data, error });
    setLoading(false);
    if (error) {
      if (error.message.includes("already") || error.message.includes("مستخدم من قبل") || error.message.includes("duplicate") || error.message.includes("unique")) {
        setError("اسم المستخدم أو رقم الموبايل مستخدم من قبل - جرب اسم آخر");
      } else {
        setError(error.message + " - تأكد أنك شغّلت add_year_migration.sql");
      }
      return;
    }
    else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">انشاء حساب جديد</CardTitle>
        <CardDescription>اسم مستخدم + رقم موبايل + السنة + كلمة سر</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المستخدم (انجليزي)</Label>
            <Input placeholder="ahmed123" value={username} onChange={e=>setUsername(e.target.value)} dir="ltr" />
            <p className="text-xs text-muted-foreground">ستسجل به الدخول. بدون مسافات.</p>
          </div>
          <div className="space-y-2">
            <Label>رقم الموبايل</Label>
            <Input placeholder="01012345678" value={phone} onChange={e=>setPhone(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>السنة الدراسية</Label>
            <select value={year} onChange={e=>setYear(e.target.value)} className="w-full border rounded-md h-9 px-3 text-sm bg-background">
              <option value="اولي ثانوي">اولي ثانوي</option>
              <option value="تانية ثانوي">تانية ثانوي</option>
              <option value="تالتة ثانوي">تالتة ثانوي</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>كلمة السر</Label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "جاري التسجيل..." : "تسجيل"}</Button>
          <p className="text-center text-sm">عندك حساب؟ <Link href="/login" className="underline">تسجيل الدخول</Link></p>
        </form>
      </CardContent>
    </Card>
  );
}
