import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { requireUser } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";
import { membershipState } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function ProfileMembershipPage() {
  const userId = await requireUser("/profile/membership");
  const membership = await prisma.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  const state = membershipState(membership);
  const active = state === "ACTIVE";
  return <main className="min-h-screen bg-[#f4f8fd] px-4 pb-20 pt-[max(20px,env(safe-area-inset-top))]"><div className="mx-auto max-w-2xl"><Link href="/member" className="text-xs font-semibold text-[#1769e0]">← 返回我的</Link><section className="mt-5 rounded-[28px] bg-gradient-to-br from-[#0d315d] to-[#1769e0] p-7 text-white shadow-lg"><p className="text-xs font-bold tracking-[.16em] text-white/60">LVTU MEMBERSHIP</p><h1 className="mt-4 text-2xl font-semibold">旅途会员</h1><div className="mt-6 grid gap-2 text-sm"><p>会员编号：{membership?.memberNo || "尚未开通"}</p><p>绑定姓名：{membership?.name || "-"}</p><p>绑定手机号：{membership?.phone || "-"}</p><p>有效期至：{membership?.expiresAt ? new Date(membership.expiresAt).toLocaleDateString("zh-CN") : "-"}</p></div><div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">{active ? <CheckCircle2 size={15}/> : <Clock3 size={15}/>} {active ? "有效会员" : state === "PENDING" ? "等待付款确认" : "会员已过期"}</div></section><section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e0eaf4]"><h2 className="font-semibold">会员权益</h2><ul className="mt-3 space-y-2 text-xs leading-5 text-[#667085]"><li>• 绑定手机号通过旅途完成符合条件的旅行服务，可享平台服务费减免。</li><li>• 保存旅行需求与咨询记录，顾问确认结果可在会员中心查看。</li></ul><Link href="/membership" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1769e0] text-sm font-semibold text-white">{active ? "续费会员" : "开通会员"}</Link></section></div></main>;
}
