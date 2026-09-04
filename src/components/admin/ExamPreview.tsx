"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ExamPreview({ exam, questions, onClose }: { exam: any; questions: any[]; onClose: ()=>void }) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader><DialogTitle>معاينة كطالب — {exam.title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {exam.time_limit_minutes && <Badge>الوقت: {exam.time_limit_minutes} دقيقة</Badge>}
          {questions.map((q:any, idx:number)=>(
            <Card key={idx}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex justify-between"><span className="font-medium">س{idx+1}: {q.prompt || "بدون نص"}</span><Badge variant="outline">{q.points} نقطة</Badge></div>
                {q.type==="mcq" && <div className="space-y-1">{q.options?.map((o:any,i:number)=>(<div key={i} className="border rounded px-3 py-1 text-sm">{o.option_text || `خيار ${i+1}`}</div>))}</div>}
                {q.type==="true_false" && <div className="flex gap-2"><span className="border rounded px-3 py-1">صح</span><span className="border rounded px-3 py-1">خطأ</span></div>}
                {(q.type==="short_answer"||q.type==="essay") && <div className="border rounded p-2 bg-zinc-50 text-sm text-muted-foreground">إجابة نصية</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
