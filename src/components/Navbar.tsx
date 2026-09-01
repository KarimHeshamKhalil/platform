import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { GraduationCap, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("username, role").eq("id", user.id).single();
    profile = data;
  }

  const isLoggedIn = !!user;

  return (
    <header className="top-0 z-50 sticky bg-white/80 backdrop-blur border-b">
      <div className="flex justify-between items-center mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-16">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 font-extrabold text-xl">
          <div className="bg-black p-1.5 rounded-lg text-white">
            <GraduationCap size={22} />
          </div>
          <span className="font-sans">Ahmed El Gazzar</span>
        </Link>

        {/* Nav links - hidden when logged in */}
        {!isLoggedIn && (
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm">
            <Link href="/" className="hover:text-primary">الرئيسية</Link>
            <Link href="/#courses" className="hover:text-primary">الكورسات</Link>
            <Link href="/#teacher" className="hover:text-primary">عن المدرس</Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {!isLoggedIn ? (
            <>
              <Button variant="ghost" asChild><Link href="/login">تسجيل الدخول</Link></Button>
              <Button asChild><Link href="/register">انشاء حساب</Link></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild><Link href="/dashboard">لوحة الطالب</Link></Button>
              {profile?.role === "admin" && <Button variant="outline" asChild><Link href="/admin">لوحة الإدارة</Link></Button>}
              <span className="hidden sm:inline text-muted-foreground text-sm">{profile?.username}</span>
              <form action={async () => {
                "use server";
                const s = await createClient();
                await s.auth.signOut();
                redirect("/");
              }}>
                <Button variant="ghost" size="icon"><LogOut size={18} /></Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
