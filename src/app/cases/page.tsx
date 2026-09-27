import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { AppBottomNav } from "@/components/AppBottomNav";
import { BrandMark } from "@/components/BrandMark";

const cases = [
  {
    title: "已选好酒店，先看平台价格",
    desc: "先看多平台参考价，再决定要不要继续报价。",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=78",
  },
  {
    title: "平台查不到，转人工继续问",
    desc: "系统没有结果时，直接加客服继续确认。",
    imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=78",
  },
  {
    title: "方案报价后，人工确认订单",
    desc: "拿到报价区间后，人工核房态和规则。",
    imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=78",
  },
];

export default function CasesPage() {
  return (
    <main className="min-h-screen bg-[#f0f4f8] pb-24 text-[#0f172a]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/20 bg-white/80 px-4 pt-[max(10px,env(safe-area-inset-top))] shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-5xl items-center justify-between">
          <BrandMark compact />
          <Link href="/contact" className="rounded-full border border-[#0b4fd8]/30 bg-[#0b4fd8]/10 px-4 py-1.5 text-xs font-semibold text-[#0b4fd8] active:scale-95">
            客服
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-[72px]">
        {/* Hero — 虚化图片背景 */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c1e3a] to-[#1a3a6e] px-6 py-8 sm:px-8 sm:py-10">
          <div className="absolute inset-0 overflow-hidden">
            <img src="/hotelin2.jpg" alt="" className="h-full w-full object-cover opacity-20" style={{ filter: "blur(24px) scale(1.15)" }} />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c1e3a]/60 to-[#1a3a6e]/60" />
          </div>
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300/80">Use Cases</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">我们怎么处理需求</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">三步走完，顾问帮你匹配最优方案。</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {cases.map((c, i) => (
            <article key={c.title} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]">
              <div className="relative h-44 bg-[#0f172a]">
                <img src={c.imageUrl} alt={c.title} className="h-full w-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-3 left-3 grid h-7 w-7 place-items-center rounded-full bg-[#0b4fd8] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h2 className="text-[16px] font-bold">{c.title}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-white/75">{c.desc}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/inquiry"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0b4fd8] px-5 text-[14px] font-bold text-white shadow-[0_8px_20px_-6px_rgba(232,99,46,0.5)] active:scale-[0.97]"
          >
            <Sparkles size={16} />查看旅途预估
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/services"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-semibold text-[#0f172a] shadow-sm ring-1 ring-black/[0.04] active:scale-[0.97]"
          >
            <MapPin size={16} className="text-[#0b4fd8]" />查看服务范围
          </Link>
        </div>
      </div>
      <AppBottomNav active="services" />
    </main>
  );
}
