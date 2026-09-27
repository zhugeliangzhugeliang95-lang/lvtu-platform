import Link from "next/link";
import { Plus, ShieldCheck, UserRound } from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/userAuth";
import { TravelerActions } from "./ui";

function maskDocument(value: string | null) {
  if (!value) return "未填写证件";
  if (value.length <= 6) return `${value.slice(0, 1)}****${value.slice(-1)}`;
  return `${value.slice(0, 3)} **** **** ${value.slice(-3)}`;
}

export default async function TravelersPage() {
  const userId = await requireUser("/travelers");
  const travelers = await prisma.traveler.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return (
    <PlatformFrame title="常用旅客" subtitle="填写后咨询与预订更省心" back="/member" active="member">
      <section className="mx-5 mt-5 flex gap-3 rounded-[20px] bg-[#eef7ff] p-4 text-[11px] leading-5 text-[#53677e]"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-[var(--app-blue)]"/><p>实名信息只在票务、住宿等必要服务中使用，列表不会展示完整证件号码。</p></section>
      <section className="px-5 py-6">
        <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">旅客列表</h2><span className="text-[10px] text-[var(--app-muted)]">{travelers.length} 位</span></div>
        {travelers.length ? <div className="mt-4 space-y-3">{travelers.map((traveler) => <div key={traveler.id} className="app-card flex items-center gap-3 p-4"><span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[var(--app-blue-soft)] text-[var(--app-blue)]"><UserRound size={20}/></span><div className="min-w-0 flex-1"><p className="text-[14px] font-semibold">{traveler.name}</p><p className="mt-1 text-[10px] text-[var(--app-muted)]">{traveler.documentType || "旅客信息"} · {maskDocument(traveler.documentNumber)}</p>{traveler.mobile ? <p className="mt-1 text-[10px] text-[var(--app-muted)]">联系方式 {traveler.mobile}</p> : null}</div><TravelerActions id={traveler.id}/></div>)}</div> : <div className="app-card mt-4 px-6 py-10 text-center"><UserRound size={26} className="mx-auto text-[var(--app-blue)]"/><h3 className="mt-3 text-[15px] font-semibold">还没有常用旅客</h3><p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">添加同行人后，后续提交需求时可以更快补齐信息。</p></div>}
        <Link href="/travelers/new" className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-[17px] bg-[var(--app-blue)] text-[13px] font-semibold text-white"><Plus size={17}/>添加常用旅客</Link>
      </section>
    </PlatformFrame>
  );
}
