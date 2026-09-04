"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(()=> setMounted(true), []);
  if (!mounted) return <Button variant="ghost" size="icon" className="rounded-full border border-black size-8"><span className="sr-only">Toggle</span></Button>;
  return (
    <Button variant="ghost" size="icon" className="rounded-full border border-black dark:border-zinc-700 size-8 bg-white dark:bg-zinc-800" onClick={()=>setTheme(theme==="dark" ? "light" : "dark")}>
      {theme==="dark" ? <Sun size={14}/> : <Moon size={14}/>}
    </Button>
  );
}
