import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export function AuthShell({
  mode,
  nextPath,
  reason,
  title,
  body,
  children,
}: {
  mode: "login" | "signup";
  nextPath: string;
  reason?: string;
  title?: string;
  body?: string;
  children: React.ReactNode;
}) {
  const login = mode === "login";
  const heading = title || (login ? "登录旅途" : "创建旅途账号");
  const description = body || (login ? "查看报价、订单与行程，继续上次的旅行安排。" : "保存旅行需求，接收顾问报价并管理订单与行程。");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf4fb] text-[#10213a]">
      <div className="absolute inset-0 hidden lg:block">
        <Image src="/travel-home/hero-coast.jpg" alt="蔚蓝海岸旅行目的地" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,25,54,.90)_0%,rgba(4,35,75,.72)_43%,rgba(4,35,75,.25)_68%,rgba(4,35,75,.42)_100%)]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-white/95 backdrop-blur-xl lg:bg-white/92">
        <div className="mx-auto flex min-h-[72px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="返回旅途首页"><BrandMark /></Link>
          <nav className="flex items-center gap-1 text-[13px] text-[#52637a]">
            <Link href={nextPath === "/member" ? "/" : nextPath} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 transition hover:bg-[#eff6ff] hover:text-[#0759b8]"><ArrowLeft size={16} />返回</Link>
            <span className="hidden h-4 w-px bg-[#dbe4ef] sm:block" />
            <Link href="/contact" className="hidden min-h-10 items-center gap-1.5 rounded-full px-3 transition hover:bg-[#eff6ff] hover:text-[#0759b8] sm:inline-flex"><Headphones size={16} />帮助中心</Link>
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-72px)] max-w-[1180px] items-center gap-12 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:py-14">
        <section className="hidden max-w-[590px] text-white lg:block">
          <p className="text-xs font-semibold tracking-[.22em] text-[#a9d6ff]">LVTU MEMBER</p>
          <h2 className="mt-5 text-[clamp(42px,5vw,64px)] font-semibold leading-[1.06] tracking-[-.055em]">旅行服务，<br />从这里继续。</h2>
          <p className="mt-6 max-w-[500px] text-[16px] leading-8 text-white/76">一个账号统一管理需求、报价、付款与行程。复杂资源由旅行顾问人工确认，进度随时可查。</p>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-white/82">
            {["报价记录可追踪", "订单状态清楚", "真人顾问持续跟进"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#9bd2ff]" />{item}</span>)}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[440px] rounded-[24px] border border-white/80 bg-white p-6 shadow-[0_28px_80px_rgba(9,45,90,.22)] sm:p-8 lg:rounded-[28px]">
          <div className="lg:hidden"><BrandMark /></div>
          <div className="mt-8 flex rounded-[14px] bg-[#f1f5f9] p-1 lg:mt-0">
            <Link href={`/login?next=${encodeURIComponent(nextPath)}&reason=${encodeURIComponent(reason || "")}`} className={`flex min-h-10 flex-1 items-center justify-center rounded-[11px] text-[13px] font-semibold transition ${login ? "bg-white text-[#0d315d] shadow-sm" : "text-[#718096]"}`}>登录</Link>
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}&reason=${encodeURIComponent(reason || "")}`} className={`flex min-h-10 flex-1 items-center justify-center rounded-[11px] text-[13px] font-semibold transition ${!login ? "bg-white text-[#0d315d] shadow-sm" : "text-[#718096]"}`}>注册</Link>
          </div>

          <h1 className="mt-7 text-[28px] font-semibold tracking-[-.035em] text-[#10213a]">{heading}</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#6c7b90]">{description}</p>
          <div className="mt-7">{children}</div>

          <div className="mt-6 flex items-start gap-2 border-t border-[#e6edf5] pt-5 text-[11px] leading-5 text-[#77869a]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#1677ff]" /><span>账号信息只用于登录、服务通知及必要的旅行联系。</span></div>
          <p className="mt-5 text-center text-[11px] leading-5 text-[#94a0b0]">继续即表示你同意 <Link href="/settings/terms" className="text-[#607086] underline underline-offset-2">用户协议</Link> 和 <Link href="/settings/privacy" className="text-[#607086] underline underline-offset-2">隐私政策</Link></p>
        </section>
      </div>
    </main>
  );
}
