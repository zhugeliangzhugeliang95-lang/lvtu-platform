"use client";

import { useState } from "react";
import { ImageOff, RefreshCw } from "lucide-react";

export function SafeImage({ src, alt, className = "", priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#dcebff] to-[#eff6ff] text-[#104da6] ${className}`}>
        <ImageOff size={22} />
        <button type="button" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }} className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-semibold">
          <RefreshCw size={13} />重试
        </button>
      </div>
    );
  }

  return <img key={attempt} src={src} alt={alt} className={className} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}
