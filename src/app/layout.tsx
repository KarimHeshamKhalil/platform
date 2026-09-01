import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-white">
          © {new Date().getFullYear()} منصة الأستاذ - جميع الحقوق محفوظة
        </footer>
      </body>
    </html>
  );
}
