"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

type TravelImageProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
};

export function TravelImage({
  src,
  alt,
  className = "",
  imageClassName = "",
  priority = false,
  sizes = "(max-width: 600px) 100vw, 600px",
}: TravelImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const positioningClass = /(^|\s)absolute(\s|$)/.test(className) ? "" : "relative";

  return (
    <div className={`${positioningClass} overflow-hidden bg-[#e9eff6] ${className}`}>
      {!loaded && !failed ? <div aria-hidden className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#e8eef5_15%,#f8fafc_45%,#e8eef5_75%)] bg-[length:200%_100%]" /> : null}
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-[#edf4fc] text-[#8a94a6]">
          <span className="flex flex-col items-center gap-2 text-xs"><ImageOff size={22} />图片暂时无法加载</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes={sizes}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`object-cover transition duration-700 ${loaded ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"} ${imageClassName}`}
        />
      )}
    </div>
  );
}
