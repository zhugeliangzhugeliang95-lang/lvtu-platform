"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

export function TravelerActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function remove() {
    if (!window.confirm("确定移除这位常用旅客吗？")) return;
    setLoading(true);
    const response = await fetch("/api/travelers", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    setLoading(false);
    if (response.ok) router.refresh();
  }
  return <button type="button" onClick={remove} disabled={loading} aria-label="移除旅客" className="grid size-9 place-items-center rounded-[12px] text-[#a0adba] hover:bg-red-50 hover:text-red-600">{loading ? <Loader2 size={15} className="animate-spin"/> : <Trash2 size={15}/>}</button>;
}
