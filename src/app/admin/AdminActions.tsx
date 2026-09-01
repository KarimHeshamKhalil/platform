"use client";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AdminActions({ id, status }: { id: string; status: string }) {
  const [loading, setLoading] = useState(false);
  async function update(newStatus: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("enrollments").update({ status: newStatus }).eq("id", id);
    location.reload();
  }
  if (status==="approved") return <Button size="sm" variant="outline" disabled>مفعل</Button>;
  return (
    <div className="flex gap-1">
      <Button size="sm" disabled={loading} onClick={()=>update("approved")}>موافقة</Button>
      <Button size="sm" variant="destructive" disabled={loading} onClick={()=>update("rejected")}>رفض</Button>
    </div>
  );
}
