"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

export function MessageBell({ className = "", iconSize = 19 }: { className?: string; iconSize?: number }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { unread: 0 })
      .then((data: { unread?: number }) => {
        if (active) setUnread(Math.max(0, Number(data.unread) || 0));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <Link href="/member/messages" aria-label={unread ? `${unread} 条未读消息` : "消息"} className={`relative ${className}`}>
      <Bell size={iconSize} strokeWidth={1.9} />
      {unread > 0 ? (
        <span className="absolute right-1 top-1 grid min-h-[17px] min-w-[17px] place-items-center rounded-full bg-[#ff3b30] px-1 text-[9px] font-semibold leading-none text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
