"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function SubscribeButton({ courseId, enrollment }: { courseId: string; enrollment: any }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  if (enrollment?.status === "pending") return <Button disabled variant="secondary">طلبك قيد المراجعة ⏳</Button>;
  if (enrollment?.status === "rejected") return <Button variant="destructive" onClick={()=>setOpen(true)}>تم الرفض - اعادة ارسال</Button>;

  async function submit() {
    if (!file) return setMsg("ارفع صورة التحويل اولاً");
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMsg("سجل دخول اولاً");
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${courseId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("proofs").upload(path, file);
    if (upErr) { setLoading(false); return setMsg(upErr.message); }

    const { error } = await supabase.from("enrollments").upsert({ user_id: user.id, course_id: courseId, status: "pending", screenshot_url: path });
    setLoading(false);
    if (error) setMsg(error.message);
    else { setMsg("تم ارسال طلب الاشتراك - سيتم التفعيل بعد المراجعة"); setTimeout(()=>location.reload(), 1500); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>طلب الاشتراك - ارفع صورة الدفع</Button>} />
      <DialogContent>
        <DialogHeader><DialogTitle>طلب الاشتراك</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">حول المبلغ عبر فودافون كاش / انستاباي ثم ارفع Screenshot للتحويل. سيقوم الأدمن بالمراجعة وتفعيل الكورس.</p>
          <div className="bg-zinc-50 p-3 border rounded text-sm">
            <p className="font-bold">رقم الدفع: 01206972805</p>
          </div>
          <div className="space-y-2">
            <Label>صورة اثبات الدفع</Label>
            <Input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} />
          </div>
          {msg && <p className="bg-blue-50 p-2 rounded text-sm">{msg}</p>}
          <Button onClick={submit} disabled={loading} className="w-full">{loading?"جاري الارسال...":"ارسال الطلب"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
