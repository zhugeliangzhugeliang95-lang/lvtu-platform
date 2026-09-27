"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  CarFront,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coffee,
  Headphones,
  HeartHandshake,
  Hotel,
  Luggage,
  MapPin,
  PlaneTakeoff,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  Ticket,
  Umbrella,
  UsersRound,
  Utensils,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { TravelImage } from "@/components/travel/TravelImage";
import { MessageBell } from "@/components/app/MessageBell";
import type { HomeTravelData } from "@/lib/types/travel";

const images = {
  hero: "/travel-home/santorini.jpg",
  sanya: "/travel-home/sanya-coast.jpg",
  beach: "/travel-home/tropical-beach.jpg",
  kyoto: "/travel-home/kyoto.jpg",
  tokyo: "/travel-home/tokyo.jpg",
  singapore: "/travel-home/singapore.jpg",
  aurora: "/travel-home/aurora.jpg",
  hotel: "/travel-home/hotel-suite.jpg",
  consultantLin: "/travel-home/consultant-lin.jpg",
  consultantChen: "/travel-home/consultant-chen.jpg",
  consultantZhou: "/travel-home/consultant-zhou.jpg",
};

const tap = { scale: 0.975 };
const cardTap = { scale: 0.987 };

function SceneReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reducedMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ title, subtitle, href, action = "查看更多" }: { title: string; subtitle?: string; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[23px] font-semibold leading-[1.25] text-[var(--home-navy)]">{title}</h2>
        {subtitle ? <p className="mt-1.5 text-[12px] leading-5 text-[var(--home-blue-muted)]">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex min-h-11 shrink-0 items-center gap-1 text-[12px] font-medium text-[#536b98] active:scale-[.975]">
          {action}<ChevronRight size={15} />
        </Link>
      ) : null}
    </div>
  );
}

function HomeHeader({ solid }: { solid: boolean }) {
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? "bg-white/96 shadow-[0_8px_24px_rgba(20,74,154,.08)] backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-[calc(68px+env(safe-area-inset-top))] max-w-[520px] items-end justify-between px-5 pb-3">
        <Link href="/" aria-label="旅途首页" className={`flex min-h-11 items-center gap-2 transition-colors ${solid ? "text-[var(--home-navy)]" : "text-white"}`}>
          <Image src="/logo-mark.png" alt="" width={38} height={38} className={`size-9 object-contain transition ${solid ? "home-logo-blue" : "brightness-0 invert"}`} />
          <strong className="text-[21px] font-semibold">旅途</strong>
          <span className={`ml-1 hidden text-[11px] font-normal min-[390px]:inline ${solid ? "text-[#48638f]" : "text-white/88"}`}>让旅行更简单 · 更美好</span>
        </Link>
        <div className={`flex items-center ${solid ? "text-[var(--home-navy)]" : "text-white"}`}>
          <MessageBell className="grid size-11 place-items-center active:scale-[.975]" iconSize={22} />
          <Link href="/contact" aria-label="联系客服" className="grid size-11 place-items-center active:scale-[.975]"><Headphones size={23} strokeWidth={1.9} /></Link>
        </div>
      </div>
    </header>
  );
}

const coreServices = [
  { title: "酒店住宿", note: "填写信息看预估", href: "/inquiry?service=hotel", icon: Hotel, tone: "from-[#42a5ff] to-[#086bec]", shadow: "rgba(9,111,236,.22)" },
  { title: "机票火车", note: "填写行程看预估", href: "/inquiry?service=combo", icon: PlaneTakeoff, tone: "from-[#67c5ff] to-[#1677ff]", shadow: "rgba(22,119,255,.22)" },
  { title: "门票玩乐", note: "填写日期看预估", href: "/inquiry?service=ticket", icon: Ticket, tone: "from-[#ffbd48] to-[#ff850f]", shadow: "rgba(255,133,15,.24)" },
  { title: "接送包车", note: "填写路线看预估", href: "/inquiry?service=transfer", icon: CarFront, tone: "from-[#5ae0b7] to-[#10b981]", shadow: "rgba(16,185,129,.22)" },
  { title: "酒店套餐", note: "住+餐+玩看预估", href: "/inquiry?service=combo", icon: Luggage, tone: "from-[#64e6bd] to-[#11b981]", shadow: "rgba(17,185,129,.22)" },
  { title: "旅行团", note: "跟团 · 私家团", href: "/tours", icon: UsersRound, tone: "from-[#8a73ff] to-[#5d3ee6]", shadow: "rgba(93,62,230,.22)" },
  { title: "AI 规划", note: "智能行程", href: "/ai", icon: Sparkles, tone: "from-[#9c7bff] to-[#5b3fe6]", shadow: "rgba(91,63,230,.24)" },
  { title: "定制顾问", note: "专属服务", href: "/contact", icon: BadgeCheck, tone: "from-[#3db1ff] to-[#066de5]", shadow: "rgba(6,109,229,.22)" },
];

function HeroScene() {
  const reducedMotion = useReducedMotion();
  const hotSearches = ["三亚", "东京", "北海道", "新加坡", "普吉岛"];
  return (
    <section className="relative min-h-[790px]" aria-labelledby="home-hero-title">
      <div className="absolute inset-x-0 top-0 h-[590px] overflow-hidden bg-[#087af4]">
        <TravelImage src={images.hero} alt="圣托里尼海岸与白色建筑" priority className="absolute inset-0" imageClassName="object-[63%_center] saturate-[1.18]" sizes="(max-width: 520px) 100vw, 520px" />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(0,61,169,.84)_0%,rgba(0,112,235,.48)_48%,rgba(0,86,198,.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#eef6ff] via-[#eef6ff]/28 to-transparent" />
      </div>
      <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="relative z-10 px-5 pt-[calc(130px+env(safe-area-inset-top))] text-white">
        <h1 id="home-hero-title" className="home-blue-hero-title mx-auto text-center text-[44px] leading-[1.36] drop-shadow-[0_4px_14px_rgba(0,41,116,.28)]">去更远的地方<br />见更大的世界</h1>
        <p className="mt-4 text-center text-[15px] font-medium text-white/94">全球精选旅行 · 专业服务 · 省心省钱</p>
        <form action="/search" method="get" className="mt-8 flex h-[64px] items-center gap-2 rounded-full border border-white/70 bg-white/94 p-2 pl-5 shadow-[0_14px_38px_rgba(0,50,140,.22)] backdrop-blur-xl">
          <Search size={22} strokeWidth={1.8} className="shrink-0 text-[var(--home-navy)]" />
          <input name="q" aria-label="搜索目的地、酒店、景点或关键词" placeholder="搜索目的地 / 酒店 / 景点" className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--home-navy)] outline-none placeholder:text-[#7184aa]" />
          <motion.button whileTap={tap} type="submit" className="h-12 w-[84px] shrink-0 rounded-full bg-[#0878f9] text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(8,120,249,.28)]">搜索</motion.button>
        </form>
        <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="flex shrink-0 items-center gap-1.5 text-[12px] font-medium"><span className="text-[18px]">♨</span>热门搜索：</span>
          {hotSearches.map((item) => <Link key={item} href={`/hotels?q=${encodeURIComponent(item)}`} className="inline-flex h-9 shrink-0 items-center rounded-full bg-white/92 px-4 text-[12px] font-semibold text-[var(--home-navy)] shadow-sm active:scale-[.975]">{item}</Link>)}
        </div>
      </motion.div>
      <motion.div initial={reducedMotion ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-x-4 top-[500px] z-20 overflow-hidden rounded-[24px] border border-white bg-white/95 shadow-[0_18px_46px_rgba(21,84,170,.15)] backdrop-blur-xl">
        <div className="grid grid-cols-4">
          {coreServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <Link key={service.title} href={service.href} className={`flex min-h-[133px] flex-col items-center justify-center px-1 text-center transition active:scale-[.975] ${index % 4 !== 3 ? "border-r border-[#e7effa]" : ""} ${index < 4 ? "border-b border-[#e7effa]" : ""}`}>
                <span className={`grid size-[46px] place-items-center rounded-[14px] bg-gradient-to-br ${service.tone} text-white`} style={{ boxShadow: `0 8px 18px ${service.shadow}` }}><Icon size={24} strokeWidth={2.1} /></span>
                <strong className="mt-2.5 text-[13px] font-semibold text-[var(--home-navy)]">{service.title}</strong>
                <span className="mt-1 text-[10px] text-[var(--home-blue-muted)]">{service.note}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

const savingSteps = [
  { title: "公开参考价", note: "透明可查", icon: Tags },
  { title: "旅途预估", note: "区间参考", icon: CircleDollarSign },
  { title: "人工确认价", note: "专业顾问", icon: Headphones },
  { title: "更合适方案", note: "住得更好", icon: ShieldCheck },
];

function SavingScene() {
  return (
    <SceneReveal>
      <section className="home-block px-4" aria-labelledby="saving-title">
        <div className="rounded-[22px] border border-[#dbeaff] bg-[linear-gradient(145deg,#f8fbff_0%,#edf5ff_100%)] p-5 shadow-[var(--home-card-shadow)]">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[12px] font-semibold text-[#0878f9]">旅途帮你省更多</p><h2 id="saving-title" className="mt-1.5 text-[22px] font-semibold text-[var(--home-navy)]">住得更好 · 花得更少</h2><p className="mt-1.5 text-[11px] text-[var(--home-blue-muted)]">多渠道比价 + 合作资源 + 人工确认</p></div>
            <Link href="/inquiry" className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 text-[11px] font-semibold text-[#0878f9] shadow-[0_6px_18px_rgba(36,111,220,.10)] active:scale-[.975]">了解更多 <ChevronRight size={14} /></Link>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-1">
            {savingSteps.map((step, index) => {
              const Icon = step.icon;
              return <div key={step.title} className="relative min-w-0 text-center">{index < savingSteps.length - 1 ? <ArrowRight size={15} className="absolute -right-2 top-7 z-10 text-[#6fa7f4]" /> : null}<span className="mx-auto grid size-[54px] place-items-center rounded-[16px] bg-white text-[#2387fa] shadow-[0_7px_18px_rgba(32,116,229,.11)]"><Icon size={25} strokeWidth={1.9} /></span><h3 className="mt-2.5 break-all text-[10px] font-semibold leading-4 text-[var(--home-navy)]">{step.title}</h3><p className="mt-1 text-[9px] text-[var(--home-blue-muted)]">{step.note}</p></div>;
            })}
          </div>
        </div>
      </section>
    </SceneReveal>
  );
}

function PlanCard({ plan }: { plan: { id: string; title: string; detail: string; image: string; tags: string[]; price?: number; href: string } }) {
  const href = plan.href;
  return (
    <motion.div whileTap={cardTap} className="w-[246px] shrink-0 snap-start">
      <Link href={href} className="block overflow-hidden rounded-[18px] bg-white shadow-[var(--home-card-shadow)] ring-1 ring-[#e3edfa]">
        <div className="relative h-[154px]"><TravelImage src={plan.image} alt={plan.title} className="absolute inset-0" sizes="246px" /><div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 p-3">{plan.tags.map((tag) => <span key={tag} className="rounded-md bg-white/92 px-2 py-1 text-[9px] font-medium text-[var(--home-navy)] backdrop-blur">{tag}</span>)}</div></div>
        <div className="p-3.5"><h3 className="text-[15px] font-semibold text-[var(--home-navy)]">{plan.title}</h3><p className="mt-1.5 text-[10px] text-[var(--home-blue-muted)]">{plan.detail}</p><p className="mt-3 text-[17px] font-semibold text-[var(--home-navy)]">{plan.price ? <>¥ {plan.price.toLocaleString()} <span className="text-[10px] font-normal text-[#6077a3]">/ 人起 · 待确认</span></> : <span className="text-[13px] text-[#0878f9]">咨询最新班期</span>}</p></div>
      </Link>
    </motion.div>
  );
}

function FeaturedPlans({ home }: { home: HomeTravelData }) {
  const plans = home.featuredPlans.map((plan) => ({
    id: plan.id,
    title: plan.title,
    detail: `${plan.destination} · ${plan.days}`,
    image: plan.image,
    tags: plan.highlights.slice(0, 2),
    price: plan.estimatedPrice || undefined,
    href: plan.href || "/tours",
  }));
  return <SceneReveal><section className="home-block" aria-labelledby="plans-title"><div className="px-5"><SectionTitle title="当前可咨询旅行团" subtitle="来自已上架的真实产品资料" href="/tours" /></div>{plans.length ? <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div> : <div className="mx-5 rounded-[18px] border border-[#dceaff] bg-white p-5 text-sm text-[#6077a3]">旅行团资料正在整理，可先联系顾问说明目的地和出行时间。</div>}</section></SceneReveal>;
}

const destinations = [
  { name: "日本", subtitle: "樱花季 · 富士山", image: images.kyoto, href: "/inquiry?service=combo&subject=日本旅行" },
  { name: "三亚", subtitle: "阳光沙滩 · 海景", image: images.beach, href: "/inquiry?service=combo&subject=三亚旅行" },
  { name: "新加坡", subtitle: "城市探索 · 美食", image: images.singapore, href: "/inquiry?service=combo&subject=新加坡旅行" },
  { name: "冰岛", subtitle: "极光 · 火山 · 温泉", image: images.aurora, href: "/inquiry?service=combo&subject=冰岛旅行" },
];

function PopularDestinations() {
  return (
    <SceneReveal><section className="home-block px-5" aria-labelledby="destination-title"><SectionTitle title="当季热门目的地" href="/destinations" /><div className="grid grid-cols-2 gap-3">
      {destinations.map((destination) => <motion.div key={destination.name} whileTap={cardTap}><Link href={destination.href} className="group block overflow-hidden rounded-[17px] bg-white shadow-[var(--home-card-shadow)] ring-1 ring-[#e3edfa]"><TravelImage src={destination.image} alt={destination.name} className="h-[142px]" imageClassName="transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width:520px) 46vw, 240px" /><div className="flex min-h-[76px] items-center gap-2 p-3"><MapPin size={18} className="shrink-0 text-[#0878f9]" fill="currentColor" /><div className="min-w-0 flex-1"><h3 className="text-[16px] font-semibold text-[var(--home-navy)]">{destination.name}</h3><p className="mt-1 truncate text-[10px] text-[var(--home-blue-muted)]">{destination.subtitle}</p></div><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f1f6fd] text-[#49648e]"><ChevronRight size={16} /></span></div></Link></motion.div>)}
    </div></section></SceneReveal>
  );
}

function Inspiration({ home }: { home: HomeTravelData }) {
  const stories = [
    { ...home.inspiration[0], image: images.sanya, label: "精选攻略", title: "5000元，两个人在三亚怎么玩？", note: "5天4晚 · 高性价比海岛度假攻略" },
    { ...home.inspiration[1], image: images.hotel, label: "亲子灵感", title: "带娃去哪玩？这些亲子酒店超省心", note: "精选亲子友好酒店" },
    { ...home.inspiration[2], image: images.tokyo, label: "城市漫游", title: "东京街头漫游指南", note: "美食 · 购物 · 打卡路线" },
  ];
  return (
    <SceneReveal><section className="home-block px-5" aria-labelledby="inspiration-title"><SectionTitle title="旅行灵感" subtitle="发现世界的美好，开启下一段旅程" href="/discover?tab=routes" />
      <Link href={stories[0].href} className="group relative block h-[260px] overflow-hidden rounded-[20px] shadow-[var(--home-card-shadow)]"><TravelImage src={stories[0].image} alt={stories[0].title} className="absolute inset-0" imageClassName="transition-transform duration-700 group-hover:scale-[1.025]" sizes="(max-width:520px) calc(100vw - 40px),480px" /><div className="absolute inset-0 bg-gradient-to-t from-[#001c55]/88 via-[#003a83]/15 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><span className="rounded-lg bg-[#0878f9] px-2.5 py-1.5 text-[10px] font-semibold">{stories[0].label}</span><h3 className="mt-3 max-w-[290px] text-[24px] font-semibold leading-[1.28]">{stories[0].title}</h3><p className="mt-2 text-[11px] text-white/82">{stories[0].note}</p></div></Link>
      <div className="mt-3 grid grid-cols-2 gap-3">{stories.slice(1).map((story) => <Link key={story.id} href={story.href} className="group relative h-[225px] overflow-hidden rounded-[18px] shadow-[var(--home-card-shadow)]"><TravelImage src={story.image} alt={story.title} className="absolute inset-0" imageClassName="transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width:520px) 46vw,240px" /><div className="absolute inset-0 bg-gradient-to-t from-[#001c55]/90 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4 text-white"><span className="rounded-lg bg-[#0878f9] px-2 py-1 text-[9px] font-semibold">{story.label}</span><h3 className="mt-2.5 text-[15px] font-semibold leading-5">{story.title}</h3><p className="mt-1 text-[9px] text-white/76">{story.note}</p></div></Link>)}</div>
      <div className="mt-5 text-center"><Link href="/discover?tab=routes" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-[13px] font-semibold text-[#0878f9] shadow-[0_8px_22px_rgba(23,98,208,.12)] ring-1 ring-[#dceaff] active:scale-[.975]">探索更多旅行灵感 <ArrowRight size={15} /></Link></div>
    </section></SceneReveal>
  );
}

const otherServices = [
  { title: "酒店自助餐", note: "提交日期看预估", icon: Utensils, tone: "from-[#9b7cff] to-[#674eea]", href: "/inquiry?service=buffet" },
  { title: "贵宾厅", note: "提交机场和日期问价", icon: Umbrella, tone: "from-[#75bbff] to-[#3189ef]", href: "/inquiry?service=lounge" },
  { title: "接送机", note: "提交路线看预估", icon: PlaneTakeoff, tone: "from-[#68c8ff] to-[#1884ee]", href: "/inquiry?service=transfer" },
  { title: "包车服务", note: "提交行程看预估", icon: CarFront, tone: "from-[#62dfb4] to-[#10b981]", href: "/inquiry?service=charter" },
  { title: "门票玩乐", note: "提交日期看预估", icon: Ticket, tone: "from-[#ffbe4c] to-[#ff8611]", href: "/inquiry?service=ticket" },
  { title: "下午茶", note: "提交日期看预估", icon: Coffee, tone: "from-[#ffaaa9] to-[#ee6d7a]", href: "/inquiry?service=buffet&subject=下午茶" },
  { title: "亲子权益", note: "亲子出行", icon: HeartHandshake, tone: "from-[#a07cff] to-[#6749e7]", href: "/discover?scene=family" },
  { title: "度假套餐", note: "住玩组合看预估", icon: BedDouble, tone: "from-[#70dba9] to-[#19ae75]", href: "/inquiry?service=combo&subject=度假套餐" },
];

function OtherServices() {
  return (
    <SceneReveal><section className="home-block px-4" aria-labelledby="other-services-title"><div className="rounded-[22px] border border-[#a9d2ff] bg-[linear-gradient(145deg,#f8fbff_0%,#eef6ff_100%)] p-4 shadow-[var(--home-card-shadow)]"><div className="px-1"><SectionTitle title="旅行中的其他服务" subtitle="住之外，也能帮你安排" /></div><div className="grid grid-cols-4 gap-2">
      {otherServices.map((service) => { const Icon = service.icon; return <Link key={service.title} href={service.href} className="flex min-h-[132px] flex-col items-center justify-center rounded-[16px] bg-white px-1 text-center shadow-[0_7px_20px_rgba(24,89,180,.08)] active:scale-[.975]"><span className={`grid size-11 place-items-center rounded-[14px] bg-gradient-to-br ${service.tone} text-white shadow-sm`}><Icon size={22} strokeWidth={2} /></span><strong className="mt-2.5 text-[12px] font-semibold text-[var(--home-navy)]">{service.title}</strong><span className="mt-1 text-[9px] leading-4 text-[var(--home-blue-muted)]">{service.note}</span></Link>; })}
    </div><div className="mt-4 text-center"><Link href="/services" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-[12px] font-semibold text-[#0878f9] shadow-[0_6px_18px_rgba(23,98,208,.10)] active:scale-[.975]">查看更多服务 <ArrowRight size={14} /></Link></div></div></section></SceneReveal>
  );
}

const consultants = [
  { name: "小旅", focus: "亲子游 · 海岛度假 · 自由行", image: images.consultantLin },
  { name: "阿杰", focus: "日本旅行 · 城市漫游 · 温泉", image: images.consultantChen },
  { name: "周周", focus: "蜜月旅行 · 欧洲路线 · 定制游", image: images.consultantZhou },
];

function ConsultantScene() {
  return (
    <SceneReveal><section className="home-block px-5" aria-labelledby="consultant-title"><SectionTitle title="专属旅行顾问" subtitle="专业服务 · 省心省钱 · 旅程无忧" href="/contact" action="了解顾问服务" /><div className="overflow-hidden rounded-[20px] border border-[#d9e9ff] bg-white px-4 shadow-[var(--home-card-shadow)]">
      {consultants.map((consultant, index) => <div key={consultant.name} className={`flex min-h-[92px] items-center gap-3 ${index < consultants.length - 1 ? "border-b border-[#e4edf8]" : ""}`}><TravelImage src={consultant.image} alt={`${consultant.name}旅行顾问`} className="size-14 shrink-0 rounded-full ring-2 ring-[#dbeaff]" imageClassName="object-top" sizes="56px" /><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><h3 className="text-[15px] font-semibold text-[var(--home-navy)]">{consultant.name}</h3><span className="inline-flex items-center gap-1 rounded-full bg-[#eaf4ff] px-2 py-1 text-[9px] font-semibold text-[#0878f9]"><BadgeCheck size={11} />资深顾问</span></div><p className="mt-1.5 truncate text-[10px] text-[var(--home-blue-muted)]">擅长：{consultant.focus}</p></div><Link href="/contact" className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-[#0878f9] px-4 text-[11px] font-semibold text-white shadow-[0_7px_18px_rgba(8,120,249,.22)] active:scale-[.975]">咨询顾问</Link></div>)}
    </div></section></SceneReveal>
  );
}

const guarantees = [
  { title: "官方核验", note: "资质齐全", icon: ShieldCheck },
  { title: "价格说明", note: "透明公开", icon: Tags },
  { title: "售后无忧", note: "专属服务", icon: HeartHandshake },
  { title: "客服支持", note: "时段可查", icon: Clock3 },
];

const faqs = [
  { question: "价格是怎么确认的？", answer: "多渠道比价 + 合作资源 + 人工确认，确保价格合理透明", icon: CircleDollarSign },
  { question: "可以退改吗？", answer: "根据产品类型不同，退改政策会有所差异", icon: CalendarDays },
  { question: "怎么联系顾问？", answer: "可以通过在线客服、电话或定制顾问服务联系", icon: UsersRound },
  { question: "订单异常怎么办？", answer: "订单问题请及时联系客服，我们会第一时间处理", icon: Luggage },
];

function TrustAndFaq() {
  return (
    <SceneReveal><section className="home-block px-4 pb-6"><div className="rounded-[22px] bg-[linear-gradient(145deg,#f7fbff_0%,#edf5ff_100%)] p-5 shadow-[var(--home-card-shadow)]"><SectionTitle title="我们的保障" subtitle="多重保障 · 安心出行" href="/services" action="查看全部保障" /><div className="grid grid-cols-4 gap-2">
      {guarantees.map((item) => { const Icon = item.icon; return <div key={item.title} className="text-center"><span className="mx-auto grid size-[50px] place-items-center rounded-full bg-white text-[#2387fa] shadow-[0_7px_18px_rgba(32,116,229,.10)]"><Icon size={24} strokeWidth={1.9} /></span><h3 className="mt-2.5 text-[11px] font-semibold text-[var(--home-navy)]">{item.title}</h3><p className="mt-1 text-[9px] text-[var(--home-blue-muted)]">{item.note}</p></div>; })}
    </div></div>
      <div className="mt-4 rounded-[22px] bg-[linear-gradient(145deg,#f8fbff_0%,#f1f7ff_100%)] p-4 shadow-[var(--home-card-shadow)]"><div className="px-1"><SectionTitle title="常见问题" subtitle="快速解答 · 旅行无忧" href="/contact" action="查看全部问题" /></div><div className="space-y-2.5">
        {faqs.map((faq) => { const Icon = faq.icon; return <Link key={faq.question} href="/contact" className="flex min-h-[84px] items-center gap-3 rounded-[17px] bg-white px-3.5 shadow-[0_6px_18px_rgba(27,89,172,.07)] active:scale-[.987]"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#edf5ff] text-[#2387fa]"><Icon size={22} strokeWidth={1.9} /></span><span className="min-w-0 flex-1"><strong className="block text-[13px] font-semibold text-[var(--home-navy)]">{faq.question}</strong><span className="mt-1 block text-[9px] leading-4 text-[var(--home-blue-muted)]">{faq.answer}</span></span><ChevronRight size={18} className="shrink-0 text-[#506b99]" /></Link>; })}
      </div></div>
      <Link href="/discover" className="group relative mt-5 block h-[210px] overflow-hidden rounded-[22px] shadow-[var(--home-card-shadow)]"><TravelImage src={images.hero} alt="开启下一段旅程" className="absolute inset-0" imageClassName="object-[62%_center] transition-transform duration-700 group-hover:scale-[1.025]" sizes="(max-width:520px) calc(100vw - 32px),488px" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,72,189,.90)_0%,rgba(0,124,245,.48)_56%,rgba(0,85,194,.08)_100%)]" /><div className="relative z-10 max-w-[285px] p-5 text-white"><h2 className="text-[25px] font-semibold leading-[1.35]">旅行不只是目的地<br />更是生活的一种可能</h2><p className="mt-2 text-[12px] text-white/86">让每一次出发，都成为难忘的回忆</p><span className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 text-[12px] font-semibold text-[#0878f9] shadow-lg">开启下一段旅程 <ArrowRight size={15} /></span></div></Link>
    </section></SceneReveal>
  );
}

export function HomeExperience({ home }: { home: HomeTravelData }) {
  const [solidHeader, setSolidHeader] = useState(false);
  useEffect(() => {
    const update = () => setSolidHeader(window.scrollY > 430);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div className="home-experience"><HomeHeader solid={solidHeader} /><HeroScene /><SavingScene /><FeaturedPlans home={home} /><PopularDestinations /><Inspiration home={home} /><OtherServices /><ConsultantScene /><TrustAndFaq /></div>;
}
