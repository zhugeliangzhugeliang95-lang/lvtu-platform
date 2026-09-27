import Link from "next/link";
import { ArrowRight, BedDouble, Compass, MapPin, Search, Sparkles, Ticket, UsersRound } from "lucide-react";

import { PlatformFrame } from "@/components/platform/Catalog";
import { guides } from "@/data/mock/platform";
import { getPublicTours } from "@/lib/catalog/tours";
import { destinations } from "@/lib/siteData";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, tours] = await Promise.all([searchParams, getPublicTours()]);
  const query = (q || "").trim().slice(0, 60);
  const destinationResults = destinations.filter((item) => !query || `${item.name}${item.highlights.join("")}${item.season}`.includes(query));
  const tourResults = tours.filter((item) => !query || `${item.name}${item.destination}${item.tags.join("")}`.includes(query));
  const guideResults = guides.filter((item) => !query || `${item.title}${item.summary}${item.tag}`.includes(query));
  const resultCount = destinationResults.length + tourResults.length + guideResults.length;

  return (
    <PlatformFrame title="全站搜索" subtitle="目的地、旅行团与攻略" active="discover">
      <form method="get" className="mx-5 mt-5 flex h-14 items-center gap-3 rounded-[18px] border border-[#dce8f4] bg-white px-4 shadow-[0_8px_24px_rgba(28,78,135,.07)]">
        <Search size={19} className="text-[var(--app-blue)]" />
        <input name="q" defaultValue={query} autoFocus placeholder="搜索三亚、亲子游或酒店" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />
        <button className="inline-flex min-h-9 items-center rounded-[12px] bg-[#1677ff] px-4 text-[11px] font-semibold text-white">搜索</button>
      </form>

      {query ? <div className="mx-5 mt-4 grid gap-2 sm:grid-cols-2"><Link href={`/ai?destination=${encodeURIComponent(query)}`} className="flex items-center gap-3 rounded-[18px] bg-[#0d315d] p-4 text-white"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white/10"><Sparkles size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">让 AI 帮我规划“{query}”</p><p className="mt-1 text-[10px] text-white/65">结合时间、预算和偏好生成路线</p></div><ArrowRight size={16} /></Link><Link href={`/inquiry?service=combo&subject=${encodeURIComponent(query)}`} className="flex items-center gap-3 rounded-[18px] bg-[#1677ff] p-4 text-white"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white/12"><Compass size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">提交“{query}”服务需求</p><p className="mt-1 text-[10px] text-white/72">酒店、交通、门票由顾问继续确认</p></div><ArrowRight size={16} /></Link></div> : null}

      <section className="space-y-7 px-5 pb-5 pt-7">
        {!query ? <><div><h2 className="text-[18px] font-semibold">热门搜索</h2><div className="mt-3 flex flex-wrap gap-2">{["三亚", "日本", "亲子旅行", "海岛度假", "周末短途", "精品小团"].map((item) => <Link key={item} href={`/search?q=${encodeURIComponent(item)}`} className="rounded-full bg-white px-4 py-2.5 text-[11px] text-[#53677e] shadow-sm ring-1 ring-[#e4edf6]">{item}</Link>)}</div></div><div><h2 className="text-[18px] font-semibold">按服务查找</h2><div className="mt-3 grid grid-cols-2 gap-3">{[{ icon: BedDouble, label: "酒店住宿", href: "/inquiry?service=hotel" }, { icon: UsersRound, label: "旅行团", href: "/tours" }, { icon: Ticket, label: "门票玩乐", href: "/inquiry?service=ticket" }, { icon: Compass, label: "旅行攻略", href: "/guides" }].map(({ icon: Icon, label, href }) => <Link key={label} href={href} className="app-card flex min-h-[70px] items-center gap-3 px-4"><span className="grid size-9 place-items-center rounded-[13px] bg-[#eef6ff] text-[#1677ff]"><Icon size={17} /></span><span className="text-[12px] font-semibold">{label}</span></Link>)}</div></div></> : <><div className="flex items-end justify-between"><div><h2 className="text-[18px] font-semibold">搜索结果</h2><p className="mt-1 text-[11px] text-[var(--app-muted)]">“{query}”相关内容</p></div><span className="text-[11px] text-[var(--app-muted)]">{resultCount} 条</span></div><ResultSection title="目的地" items={destinationResults.map((item) => ({ title: item.name, note: `${item.days} · ${item.season}`, href: `/destinations/${item.slug}`, icon: MapPin }))} /><ResultSection title="旅行团" items={tourResults.map((item) => ({ title: item.name, note: `${item.destination} · ${item.days}天 · ${item.type}`, href: `/tours/${item.slug}`, icon: UsersRound }))} /><ResultSection title="攻略" items={guideResults.map((item) => ({ title: item.title, note: item.summary, href: `/guides/${item.slug}`, icon: Compass }))} />{!resultCount ? <div className="app-card px-6 py-10 text-center"><span className="mx-auto grid size-14 place-items-center rounded-[20px] bg-[#eef6ff] text-[#1677ff]"><Search size={23} /></span><h2 className="mt-4 text-[16px] font-semibold">没有找到相关结果</h2><p className="mt-2 text-[11px] leading-5 text-[var(--app-muted)]">换个关键词，或者让旅行顾问按你的需求匹配。</p><Link href={`/inquiry?service=combo&subject=${encodeURIComponent(query)}`} className="mt-5 inline-flex min-h-11 items-center rounded-[15px] bg-[#1677ff] px-5 text-[11px] font-semibold text-white">提交需求</Link></div> : null}</>}
      </section>
    </PlatformFrame>
  );
}

function ResultSection({ title, items }: { title: string; items: Array<{ title: string; note: string; href: string; icon: typeof MapPin }> }) {
  if (!items.length) return null;
  return <div><h2 className="text-[16px] font-semibold">{title}</h2><div className="mt-3 divide-y divide-[#edf2f7] rounded-[20px] border border-[#dce8f4] bg-white px-4">{items.slice(0, 8).map(({ title: itemTitle, note, href, icon: Icon }) => <Link key={`${href}-${itemTitle}`} href={href} className="flex min-h-[68px] items-center gap-3 py-3"><span className="grid size-9 shrink-0 place-items-center rounded-[13px] bg-[#eef6ff] text-[#1677ff]"><Icon size={16} /></span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold">{itemTitle}</p><p className="mt-1 truncate text-[10px] text-[var(--app-muted)]">{note}</p></div><ArrowRight size={15} className="text-[#9ba8b6]" /></Link>)}</div></div>;
}
