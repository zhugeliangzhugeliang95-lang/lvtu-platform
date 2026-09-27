"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";

export function FavoriteButton({
  productType,
  productId,
  initialActive,
  loggedIn,
  nextPath = "/",
  compact = false,
}: {
  productType: "HOTEL" | "FLIGHT" | "TRAIN" | "ROUTE";
  productId: string;
  initialActive: boolean;
  loggedIn: boolean;
  nextPath?: string;
  compact?: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const nextUrl = `/login?next=${encodeURIComponent(nextPath)}`;

  async function toggle() {
    if (!loggedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: active ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productType, productId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "操作失败");
      setActive(!active);
    } finally {
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return (
      <Link
        href={nextUrl}
        className={compact ? "grid size-11 place-items-center rounded-full bg-white/88 text-[#12263a] shadow-lg backdrop-blur-xl" : "inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-sm font-medium text-white/84"}
        aria-label={compact ? "登录后收藏" : undefined}
      >
        {compact ? <Heart size={19} /> : "登录后收藏"}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={compact ? `grid size-11 place-items-center rounded-full bg-white/88 shadow-lg backdrop-blur-xl transition active:scale-95 disabled:opacity-60 ${active ? "text-[#ff5f57]" : "text-[#12263a]"}` : "inline-flex h-10 items-center justify-center rounded-full border border-white/10 px-4 text-sm font-semibold text-white/86 transition hover:border-cyan-300/35 disabled:opacity-60"}
      aria-label={compact ? (active ? "取消收藏" : "收藏") : undefined}
    >
      {compact ? <Heart size={19} fill={active ? "currentColor" : "none"} /> : active ? "已收藏" : "收藏"}
    </button>
  );
}
