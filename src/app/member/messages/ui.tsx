"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";

export function MarkAllRead({ disabled }: { disabled: boolean }) {
  const router = useRouter(); const [loading, setLoading] = useState(false);
  async function mark() { setLoading(true); const response = await fetch("/api/notifications", { method: "PATCH" }); setLoading(false); if (response.ok) router.refresh(); }
  return <button onClick={mark} disabled={disabled || loading} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[10px] font-semibold text-[var(--app-blue)] disabled:text-[#9eabb8]">{loading ? <Loader2 size={13} className="animate-spin"/> : <CheckCheck size={13}/>}全部已读</button>;
}
