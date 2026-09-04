import { z } from "zod";

export const questionTypeEnum = z.enum(["mcq", "true_false", "short_answer", "essay"]);
export const examTypeEnum = z.enum(["exam", "homework"]);

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  option_text: z.string().min(1, "نص الاختيار مطلوب"),
  is_correct: z.boolean().default(false),
  option_order: z.number().int().min(0),
});

export const questionSchema = z.object({
  id: z.string().optional(),
  exam_id: z.string().uuid().optional(),
  question_order: z.number().int().min(0),
  type: questionTypeEnum,
  prompt: z.string().min(3, "نص السؤال مطلوب"),
  points: z.number().min(0).default(1),
  options: z.array(questionOptionSchema).optional(),
}).superRefine((q, ctx) => {
  if (q.type === "mcq") {
    if (!q.options || q.options.length < 2) {
      ctx.addIssue({ code: "custom", message: "الاختيار من متعدد يحتاج خيارين على الأقل", path: ["options"] });
    } else {
      const correct = q.options.filter(o => o.is_correct).length;
      if (correct !== 1) ctx.addIssue({ code: "custom", message: "حدد إجابة صحيحة واحدة فقط", path: ["options"] });
    }
  }
  if (q.type === "true_false") {
    if (!q.options || q.options.length !== 2) {
      ctx.addIssue({ code: "custom", message: "صح/خطأ يحتاج خيارين", path: ["options"] });
    }
  }
});

export const examSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب"),
  type: examTypeEnum,
  time_limit_minutes: z.number().int().min(1).nullable().optional(),
  shuffle_questions: z.boolean().default(false),
  max_attempts: z.number().int().min(1).default(1),
  pass_grade_percent: z.number().int().min(0).max(100).nullable().optional(),
  available_from: z.string().nullable().optional(),
  available_until: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});

export type ExamForm = z.infer<typeof examSchema>;
export type QuestionForm = z.infer<typeof questionSchema>;

export function isExamValid(title: string, questions: z.infer<typeof questionSchema>[]): boolean {
  if (!title.trim() || title.trim().length < 3) return false;
  if (questions.length === 0) return false;
  for (const q of questions) {
    const r = questionSchema.safeParse(q);
    if (!r.success) return false;
  }
  return true;
}
