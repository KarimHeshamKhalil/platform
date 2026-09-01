"use client";
import { useEffect, useRef } from "react";

export default function SecurePlayer({ url, username }: { url: string; username: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(()=>{
    const v = ref.current;
    if (!v) return;
    const onContext = (e: MouseEvent) => e.preventDefault();
    v.addEventListener("contextmenu", onContext);
    return ()=> v.removeEventListener("contextmenu", onContext);
  },[]);

  return (
    <div className="relative bg-black rounded-xl overflow-hidden border">
      <video
        ref={ref}
        src={url}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={e=>e.preventDefault()}
        className="w-full aspect-video"
      />
      {/* Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
        <span className="text-white text-2xl font-bold rotate-[-20deg] select-none">{username}</span>
      </div>
      <div className="pointer-events-none absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {username} • محمي
      </div>
    </div>
  );
}
