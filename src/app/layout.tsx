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
      <body className="flex flex-col bg-zinc-50 dark:bg-zinc-950 min-h-full font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-white py-6 border-t text-muted-foreground text-sm text-center">
          © {new Date().getFullYear()} منصة أحمد الجزار - جميع الحقوق محفوظة
        </footer>
      </body>
    </html>
  );
}
