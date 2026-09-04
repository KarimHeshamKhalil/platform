import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { GraduationCap, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-2 bg-[#EDE8D0] dark:bg-zinc-900">
      <header className="mx-auto max-w-7xl bg-[#F5F1E8] dark:bg-zinc-800 border-[1.5px] border-black dark:border-zinc-700 rounded-full px-2 sm:px-3 py-2 flex items-center justify-between shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.08)]">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
          <div className="bg-black p-1.5 rounded-full text-white">
            <GraduationCap size={18} />
          </div>
          <span className="font-extrabold text-sm sm:text-base whitespace-nowrap">Ahmed El Gazzar</span>
          <span className="hidden lg:block h-px w-12 bg-black/20 ml-1" />
        </Link>

        {!isLoggedIn && (
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link href="/" className="hover:underline whitespace-nowrap">الرئيسية</Link>
            <Link href="/#courses" className="hover:underline whitespace-nowrap">الكورسات</Link>
            <Link href="/#teacher" className="hover:underline whitespace-nowrap">عن المدرس</Link>
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          {!isLoggedIn ? (
            <>
              <span className="hidden lg:block h-px w-12 bg-black/20 dark:bg-white/10" />
              <Button variant="ghost" size="sm" className="rounded-full border-transparent shadow-none text-xs sm:text-sm px-3 whitespace-nowrap" asChild><Link href="/login">تسجيل الدخول</Link></Button>
              <Button size="sm" className="rounded-full bg-[#F7F36A] dark:bg-[#4A4000] dark:text-[#F7F36A] text-black dark:border-zinc-600 text-black border-black hover:bg-[#EDE84A] text-xs sm:text-sm px-4 whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" asChild><Link href="/register">انشاء حساب</Link></Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="rounded-full text-xs whitespace-nowrap hidden sm:inline-flex" asChild><Link href="/dashboard">لوحة الطالب</Link></Button>
              {profile?.role === "admin" && <Button size="sm" className="rounded-full bg-black text-white dark:bg-white dark:text-black text-xs hidden sm:inline-flex" asChild><Link href="/admin">الإدارة</Link></Button>}
              <span className="hidden lg:inline text-xs text-muted-foreground truncate max-w-[90px]">{profile?.username}</span>
              <form action={async () => { "use server"; const s = await createClient(); await s.auth.signOut(); redirect("/"); }}>
                <Button variant="ghost" size="icon" className="rounded-full size-8 border border-black dark:border-zinc-700"><LogOut size={14} /></Button>
              </form>
            </>
          )}
        </div>
      </header>
    </div>
  );
}
