import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/theme-provider";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "منصة الأستاذ | ثانوية عامة",
  description: "منصة تعليمية للثانوية العامة - اولي وتانية وتالتة ثانوي",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex flex-col bg-[#EDE8D0] dark:bg-zinc-900 min-h-full font-sans">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="mx-auto max-w-7xl w-[calc(100%-16px)] sm:w-[calc(100%-32px)] bg-white dark:bg-zinc-800 border-[1.5px] border-black dark:border-zinc-700 rounded-2xl py-4 mb-4 mt-8 text-center text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)]">
            © {new Date().getFullYear()} منصة أحمد الجزار — تعليم تفاعلي يلهم
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
