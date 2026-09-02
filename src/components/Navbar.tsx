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
      <div className="flex justify-between items-center gap-2 mx-auto px-3 sm:px-6 lg:px-8 max-w-7xl h-14 sm:h-16">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-1.5 sm:gap-2 font-extrabold text-base sm:text-xl shrink-0">
          <div className="bg-black p-1 sm:p-1.5 rounded-lg text-white">
            <GraduationCap size={18} className="sm:size-[22px]" />
          </div>
          <span className="font-sans whitespace-nowrap">Ahmed El Gazzar</span>
        </Link>

        {/* Nav links - hidden when logged in + hidden on mobile */}
        {!isLoggedIn && (
          <nav className="hidden md:flex items-center gap-6 font-medium text-sm shrink-0">
            <Link href="/" className="hover:text-primary whitespace-nowrap">الرئيسية</Link>
            <Link href="/#courses" className="hover:text-primary whitespace-nowrap">الكورسات</Link>
            <Link href="/#teacher" className="hover:text-primary whitespace-nowrap">عن المدرس</Link>
          </nav>
        )}

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!isLoggedIn ? (
            <>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap" asChild><Link href="/login">تسجيل الدخول</Link></Button>
              <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap" asChild><Link href="/register">انشاء حساب</Link></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap" asChild><Link href="/dashboard">لوحة الطالب</Link></Button>
              {profile?.role === "admin" && <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap hidden sm:inline-flex" asChild><Link href="/admin">الإدارة</Link></Button>}
              {profile?.role === "admin" && <Button variant="outline" size="sm" className="text-xs px-2 sm:hidden" asChild><Link href="/admin">ادارة</Link></Button>}
              <span className="hidden lg:inline text-muted-foreground text-sm truncate max-w-[80px]">{profile?.username}</span>
              <form action={async () => {
                "use server";
                const s = await createClient();
                await s.auth.signOut();
                redirect("/");
              }}>
                <Button variant="ghost" size="icon" className="size-8 sm:size-9"><LogOut size={16} /></Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
