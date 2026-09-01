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

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const email = usernameToEmail(username);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("اسم المستخدم أو كلمة السر غير صحيحة");
    else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
        <CardDescription>ادخل باسم المستخدم وكلمة السر</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المستخدم</Label>
            <Input placeholder="ahmed123" value={username} onChange={e=>setUsername(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>كلمة السر</Label>
            <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "جاري الدخول..." : "دخول"}</Button>
          <p className="text-center text-sm">ليس لديك حساب؟ <Link href="/register" className="underline">انشاء حساب</Link></p>
        </form>
      </CardContent>
    </Card>
  );
}
