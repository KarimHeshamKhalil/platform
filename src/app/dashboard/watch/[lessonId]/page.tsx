import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import SecurePlayer from "./SecurePlayer";
import YoutubePlayer from "./YoutubePlayer";

export default async function WatchPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson } = await supabase.from("lessons").select("*, units!inner(course_id, title, courses(title, year))").eq("id", lessonId).single();
  if (!lesson) return notFound();

  const courseId = (lesson.units as any).course_id;
  const courseYear = (lesson.units as any).courses.year;
  const { data: enrollment } = await supabase.from("enrollments").select("status").eq("user_id", user.id).eq("course_id", courseId).single();
  const { data: profile } = await supabase.from("profiles").select("role, year").eq("id", user.id).single();
  const isAdmin = (profile as any)?.role === "admin";
  if (!isAdmin) {
    if ((profile as any)?.year && (profile as any).year !== courseYear) redirect("/dashboard");
    if (enrollment?.status !== "approved") redirect(`/courses/${courseId}`);
  }

  const service = await createServiceClient();
  let videoSignedUrl: string | null = null;
  let pdfSignedUrl: string | null = null;

  if (lesson.type === "video" && lesson.video_url) {
    const { data } = await service.storage.from("videos").createSignedUrl(lesson.video_url, 60*60);
    videoSignedUrl = data?.signedUrl || null;
  }
  if (lesson.type === "pdf" && lesson.pdf_url) {
    const { data } = await service.storage.from("pdfs").createSignedUrl(lesson.pdf_url, 60*60);
    pdfSignedUrl = data?.signedUrl || null;
  }

  const { data: profileFull } = await supabase.from("profiles").select("username").eq("id", user.id).single();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <p className="text-sm text-muted-foreground">{(lesson.units as any).courses.title} &gt; Unit: {(lesson.units as any).title}</p>
      <h1 className="text-2xl font-bold">{lesson.title} <span className="text-sm font-normal text-muted-foreground">({lesson.type==="video"?"Video":"PDF"})</span></h1>
      {lesson.type==="video" ? (
        (lesson as any).youtube_url ? (
          <YoutubePlayer youtubeUrl={(lesson as any).youtube_url} username={profileFull?.username||""} />
        ) : videoSignedUrl ? (
          <SecurePlayer url={videoSignedUrl} username={profileFull?.username||""} />
        ) : (
          <p className="bg-red-50 p-4 rounded">الفيديو غير متاح - تواصل مع الإدارة</p>
        )
      ) : (
        pdfSignedUrl ? (
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-zinc-100 p-2 text-sm flex justify-between">
              <span>PDF - {lesson.title}</span>
              <a href={pdfSignedUrl} target="_blank" className="underline text-primary">فتح في تبويب جديد</a>
            </div>
            <iframe src={pdfSignedUrl} className="w-full h-[80vh]" />
          </div>
        ) : <p className="bg-red-50 p-4 rounded">الملف غير متاح</p>
      )}
      <p className="text-xs text-muted-foreground text-center">🔒 المحتوى محمي - ممنوع التسريب - يظهر اسمك كـ Watermark</p>
    </div>
  );
}
