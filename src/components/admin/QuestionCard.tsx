"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Copy, ChevronDown, ChevronUp, HelpCircle, CheckCircle, FileText, AlignLeft } from "lucide-react";
import { useState } from "react";

const typeIcon: any = { mcq: HelpCircle, true_false: CheckCircle, short_answer: FileText, essay: AlignLeft };
const typeLabel: any = { mcq: "اختيار من متعدد", true_false: "صح/خطأ", short_answer: "إجابة قصيرة", essay: "مقالي" };

export default function QuestionCard({ q, index, onChange, onDelete, onDuplicate }: { q: any; index: number; onChange: (n:any)=>void; onDelete: ()=>void; onDuplicate: ()=>void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: q.id || q.tempId });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [open, setOpen] = useState(q._open ?? true);
  const Icon = typeIcon[q.type] || HelpCircle;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border">
        <CardHeader className="py-3 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="p-1 hover:bg-zinc-100 rounded"><GripVertical size={16}/></button>
            <Badge variant="secondary" className="gap-1"><Icon size={14}/>{typeLabel[q.type]}</Badge>
            <span className="text-sm font-medium">سؤال {index+1}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{q.prompt || "بدون نص"}</span>
            <Badge variant="outline">{q.points} نقطة</Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={()=>setOpen(!open)}>{open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</Button>
            <Button variant="ghost" size="icon" onClick={onDuplicate}><Copy size={16}/></Button>
            <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 size={16}/></Button>
          </div>
        </CardHeader>
        {open && (
          <CardContent className="space-y-3 border-t pt-4">
            <div><Label>نص السؤال</Label><Input value={q.prompt} onChange={e=>onChange({...q, prompt:e.target.value})} placeholder="اكتب نص السؤال" /></div>
            <div className="flex gap-4">
              <div><Label>النوع</Label>
                <select value={q.type} onChange={e=>{
                  const t=e.target.value as any;
                  if (t==="mcq") onChange({...q, type:t, options: q.options?.length ? q.options : [{option_text:"",is_correct:true,option_order:0},{option_text:"",is_correct:false,option_order:1}]});
                  else if (t==="true_false") onChange({...q, type:t, options:[{option_text:"صح",is_correct:true,option_order:0},{option_text:"خطأ",is_correct:false,option_order:1}]});
                  else onChange({...q, type:t, options:[]});
                }} className="border rounded-md h-8 px-2 text-sm">
                  <option value="mcq">اختيار من متعدد</option>
                  <option value="true_false">صح/خطأ</option>
                  <option value="short_answer">إجابة قصيرة</option>
                  <option value="essay">مقالي</option>
                </select>
              </div>
              <div><Label>الدرجة</Label><Input type="number" value={q.points} onChange={e=>onChange({...q, points:Number(e.target.value)})} className="w-20" /></div>
            </div>
            {(q.type==="mcq" || q.type==="true_false") && (
              <div className="space-y-2">
                <Label>الاختيارات (حدد الصحيح بـ radio)</Label>
                {(q.options||[]).map((opt:any, oi:number)=>(
                  <div key={oi} className="flex gap-2 items-center">
                    <input type="radio" name={`correct-${q.id||q.tempId}`} checked={!!opt.is_correct} onChange={()=>{
                      const nopts = q.options.map((o:any,i:number)=>({...o, is_correct: i===oi}));
                      onChange({...q, options:nopts});
                    }} />
                    <Input value={opt.option_text} onChange={e=>{
                      const nopts=[...q.options]; nopts[oi]={...nopts[oi], option_text:e.target.value}; onChange({...q, options:nopts});
                    }} placeholder={`خيار ${oi+1}`} className="flex-1" />
                    {q.type==="mcq" && <Button variant="ghost" size="sm" onClick={()=>{
                      const nopts=q.options.filter((_:any,i:number)=>i!==oi).map((o:any,i:number)=>({...o, option_order:i}));
                      if (nopts.length) nopts[0].is_correct=true;
                      onChange({...q, options:nopts});
                    }}>حذف</Button>}
                  </div>
                ))}
                {q.type==="mcq" && <Button variant="outline" size="sm" onClick={()=>{
                  const nopts=[...q.options, {option_text:"", is_correct:false, option_order: q.options.length}];
                  onChange({...q, options:nopts});
                }}>+ إضافة خيار</Button>}
              </div>
            )}
            {(q.type==="short_answer" || q.type==="essay") && (
              <p className="text-xs text-muted-foreground">سيقوم الطالب بكتابة إجابة نصية — التصحيح يدوي للأدمن</p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
