import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { getMembershipConfig } from "@/lib/membership";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { prisma } from "@/lib/prisma";
import { MembershipClient } from "./ui";

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const userId = await getUserIdFromCookie();
  const [config, membership, latestPayment] = await Promise.all([
    getMembershipConfig(),
    userId ? prisma.membership.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }) : Promise.resolve(null),
    userId ? prisma.membershipPayment.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }) : Promise.resolve(null),
  ]);
  return (
    <main className="min-h-screen bg-[#f4f8fd] px-4 pb-20 pt-[max(20px,env(safe-area-inset-top))] text-[#172033]">
      <div className="mx-auto max-w-2xl">
        <Link href={userId ? "/member" : "/"} className="text-xs font-semibold text-[#1769e0]">← 返回</Link>
        <section className="mt-5 overflow-hidden rounded-[30px] bg-[#0d315d] p-7 text-white shadow-[0_22px_60px_rgba(7,45,91,.2)] sm:p-10">
          <div className="flex items-center gap-2 text-[#9ed0ff]"><Sparkles size={17}/><span className="text-xs font-bold tracking-[.18em]">LVTU MEMBERSHIP</span></div>
          <h1 className="mt-5 text-3xl font-semibold">{config.title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/70">{config.benefits}</p>
          <div className="mt-7 flex items-end gap-2"><span className="text-5xl font-semibold">¥{config.price}</span><span className="pb-2 text-sm text-white/65">/{config.days}天</span></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {["会员期内平台服务费减免", "绑定手机号识别会员身份", "保存旅行需求与咨询记录", "会员身份与到期日清晰可见"].map((item) => <div key={item} className="flex items-center gap-2 text-xs text-white/85"><Check size={15} className="text-[#8bd4ff]"/>{item}</div>)}
          </div>
        </section>
        <section className="mt-5 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-[#e0eaf4] sm:p-7">
          <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-[#1769e0]"/><h2 className="text-base font-semibold">人工确认付款</h2></div>
          <p className="mt-2 text-xs leading-5 text-[#667085]">会员付款由客服人工核对到账，确认后才会开通或续期，不会自动扣款。</p>
          <MembershipClient userId={userId} config={config} membership={membership} latestPayment={latestPayment} />
        </section>
        <p className="mt-5 text-center text-[11px] leading-5 text-[#8b98a8]">开通即表示你已阅读并同意 <Link href="/settings/membership-terms" className="text-[#1769e0]">《会员服务协议》</Link>。会员权益以后台配置和顾问确认结果为准。</p>
      </div>
    </main>
  );
}
