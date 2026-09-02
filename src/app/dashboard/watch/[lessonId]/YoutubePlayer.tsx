"use client";
import { extractYoutubeId } from "@/lib/youtube";

export default function YoutubePlayer({ youtubeUrl, username }: { youtubeUrl: string; username: string }) {
  const id = extractYoutubeId(youtubeUrl);
  if (!id) return <p className="bg-red-50 p-4 rounded">رابط اليوتيوب غير صحيح</p>;

  const src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&iv_load_policy=3&controls=1&playsinline=1&enablejsapi=0&cc_load_policy=0`;

  return (
    <div className="group relative bg-black border rounded-xl aspect-video overflow-hidden">
      <iframe
        src={src}
        title="lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {/* Block top bar: title + Share + YouTube link */}
      <div className="top-0 left-0 z-10 absolute bg-transparent w-[100px] h-[58px]" style={{ pointerEvents: "auto" }} aria-hidden />
      {/* Block bottom-right YouTube button (the big one before play + small after). Covers ~80x36px corner where YouTube logo lives. Leaves other controls accessible */}
      <div className="right-0 bottom-0 z-10 absolute bg-transparent w-[385px] h-[60px]" style={{ pointerEvents: "auto" }} aria-hidden />
      {/* Also block center big YouTube play overlay before start? YouTube shows large play button center - we let it pass through so user can start, but block its YouTube link: the big button is centered, we keep it clickable for play, so not blocked */}
      <div className="bottom-0 left-0 z-10 absolute bg-transparent w-[85px] h-[60px]" style={{ pointerEvents: "auto" }} aria-hidden />

      <div className="right-0 bottom-0 left-0 z-10 absolute bg-transparent w-[1005px] h-[72px]" style={{ pointerEvents: "auto" }} aria-hidden />

      {/* Watermark */}
      <div className="z-20 absolute inset-0 flex justify-center items-center opacity-20 pointer-events-none">
        <span className="drop-shadow-lg font-bold text-white text-xl md:text-2xl rotate-[-18deg] select-none">{username}</span>
      </div>
      <div className="top-2 right-2 z-20 absolute bg-black/60 px-2 py-1 rounded text-white text-xs pointer-events-none">
        {username} • محمي
      </div>
      <div className="bottom-12 left-1/2 z-20 absolute bg-black/60 px-2 py-0.5 rounded text-[10px] text-white/70 -translate-x-1/2 pointer-events-none">
        ممنوع التسريب - المحتوى مراقب
      </div>
    </div>
  );
}
