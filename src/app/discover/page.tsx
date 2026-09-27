"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Compass, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { AppTopBar, SectionHeading, TravelAppShell } from "@/components/app/TravelAppShell";
import { exploreDestinations, inspirationStories } from "@/data/appPrototype";

const moods = ["海岛", "城市", "自然", "亲子", "美食"];
const moodDestinationOrder: Record<string, string[]> = {
  海岛: ["圣托里尼", "新加坡", "京都", "雷克雅未克"],
  城市: ["新加坡", "京都", "圣托里尼", "雷克雅未克"],
  自然: ["雷克雅未克", "京都", "圣托里尼", "新加坡"],
  亲子: ["新加坡", "京都", "圣托里尼", "雷克雅未克"],
  美食: ["京都", "新加坡", "圣托里尼", "雷克雅未克"],
};
const popularityOrder = ["京都", "新加坡", "圣托里尼", "雷克雅未克"];

type ExploreTour = {
  slug: string;
  name: string;
  destination: string;
  days: number;
  type: string;
  tags: string[];
  image: string;
  price: number;
  priceState: "REFERENCE" | "ESTIMATED" | "PENDING_CONFIRMATION" | "CONFIRMED";
  summary: string;
};

export default function DiscoverPage() {
  return <Suspense fallback={<TravelAppShell active="discover"><div className="px-5 py-8"><div className="h-14 animate-pulse rounded-[20px] bg-white" /><div className="mt-8 h-64 animate-pulse rounded-[22px] bg-white" /></div></TravelAppShell>}><DiscoverContent /></Suspense>;
}

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeSlug = searchParams.get("place");
  const queryParam = searchParams.get("q") || "";
  const [activeMood, setActiveMood] = useState(moods[0]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState("推荐");
  const [query, setQuery] = useState(queryParam);
  const [tours, setTours] = useState<ExploreTour[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/tours")
      .then((response) => response.ok ? response.json() : { tours: [] })
      .then((data: { tours?: ExploreTour[] }) => { if (active) setTours(data.tours || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const selectedPlace = useMemo(() => {
    if (!placeSlug) return null;
    return exploreDestinations.find((place) => place.href.includes(`place=${placeSlug}`)) || null;
  }, [placeSlug]);
  const visibleDestinations = useMemo(() => {
    const order = sort === "人气优先"
      ? popularityOrder
      : sort === "最新"
        ? [...moodDestinationOrder[activeMood]].reverse()
        : moodDestinationOrder[activeMood];
    return [...exploreDestinations].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
  }, [activeMood, sort]);
  const visibleStories = useMemo(() => {
    const moodDestination = { 海岛: "三亚", 城市: "东京", 自然: "云南", 亲子: "三亚", 美食: "东京" }[activeMood];
    const ranked = [...inspirationStories].sort((a, b) => Number(b.destination === moodDestination) - Number(a.destination === moodDestination));
    return sort === "最新" ? ranked.reverse() : ranked;
  }, [activeMood, sort]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  }

  return (
    <TravelAppShell active="discover">
      <AppTopBar title="探索" subtitle="发现下一段旅程" />

      <div className="px-5 pt-5">
        <form onSubmit={submitSearch} className="flex h-[58px] items-center gap-3 rounded-[20px] border border-white bg-white px-4 shadow-[0_12px_28px_rgba(28,78,135,.08)]">
          <Search size={20} className="shrink-0 text-[var(--app-blue)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索目的地" placeholder="搜索目的地、攻略或酒店" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#9aa9ba]" />
          <button type="button" onClick={() => setFilterOpen(true)} className="grid size-9 place-items-center rounded-[14px] bg-[var(--app-blue-soft)] text-[var(--app-blue)] transition active:scale-95" aria-label="筛选">
            <SlidersHorizontal size={17} />
          </button>
        </form>

        <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
          {moods.map((mood) => (
            <button key={mood} type="button" onClick={() => setActiveMood(mood)} aria-pressed={activeMood === mood} className={`min-h-10 shrink-0 rounded-full px-4 text-[12px] font-semibold transition active:scale-95 ${activeMood === mood ? "bg-[var(--app-blue)] text-white shadow-[0_7px_16px_rgba(22,119,255,.18)]" : "border border-[#deebf6] bg-white text-[#53677e]"}`}>
              {mood}
            </button>
          ))}
        </div>
        {(queryParam || selectedPlace) ? <div className="mt-3 flex items-center justify-between rounded-[14px] bg-[#eef7ff] px-3.5 py-2.5 text-[11px] text-[#4e6d8a]">
          <span>{selectedPlace ? `正在查看：${selectedPlace.name}` : `搜索：${queryParam}`}</span>
          <button type="button" onClick={() => { setQuery(""); router.push("/discover"); }} className="font-semibold text-[var(--app-blue)]">清除</button>
        </div> : null}
      </div>

      {selectedPlace ? <section className="mx-5 mt-5 overflow-hidden rounded-[22px] border border-[#d9e9f7] bg-white shadow-[0_10px_26px_rgba(28,78,135,.08)]">
        <div className="relative h-[150px]"><img src={selectedPlace.image} alt={selectedPlace.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#06275a]/70 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[10px] text-white/75">{selectedPlace.country} · {selectedPlace.season}</p><h2 className="mt-1 text-[22px] font-semibold">{selectedPlace.name}</h2></div></div>
        <div className="flex items-center justify-between gap-3 p-4"><p className="text-[11px] leading-5 text-[var(--app-muted)]">想了解适合你的时间、预算和玩法？让 AI 先帮你整理需求。</p><Link href={`/ai?destination=${encodeURIComponent(selectedPlace.name)}`} className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-[var(--app-blue)] px-4 text-[11px] font-semibold text-white">开始规划</Link></div>
      </section> : null}

      {tours.length ? <section className="mt-9">
        <div className="px-5"><SectionHeading title="现在可以咨询的旅行团" note="均为已上架的真实线路，详情和班期以顾问确认为准" href="/tours" /></div>
        <Link href={`/tours/${tours[0].slug}`} className="app-media app-press group relative mx-5 block h-[245px] shadow-[var(--app-shadow)]">
          <img src={tours[0].image} alt={tours[0].name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061b3a]/92 via-[#061b3a]/12 to-transparent" />
          <div className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1.5 text-[10px] font-bold text-[#0759b8] backdrop-blur">已上架 · {tours[0].type}</div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
            <div className="min-w-0"><p className="text-[10px] text-white/72">{tours[0].destination} · {tours[0].days}天</p><h2 className="mt-1 line-clamp-2 text-[23px] font-semibold leading-tight">{tours[0].name}</h2><p className="mt-2 text-[12px] font-semibold">{tours[0].price > 0 ? `¥${tours[0].price.toLocaleString("zh-CN")}/人起` : "价格待确认"} <span className="font-normal text-white/65">· 咨询后确认</span></p></div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/18 backdrop-blur-xl"><ArrowUpRight size={20} /></span>
          </div>
        </Link>
        {tours.length > 1 ? <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2">
          {tours.slice(1, 5).map((tour) => <Link key={tour.slug} href={`/tours/${tour.slug}`} className="app-card app-press w-[230px] shrink-0 snap-start overflow-hidden">
            <div className="h-[125px] overflow-hidden"><img src={tour.image} alt={tour.name} className="h-full w-full object-cover" /></div>
            <div className="p-4"><p className="text-[9px] font-bold text-[var(--app-blue)]">{tour.destination} · {tour.days}天 · {tour.type}</p><h3 className="mt-1.5 line-clamp-2 min-h-10 text-[15px] font-semibold leading-5">{tour.name}</h3><p className="mt-3 text-[11px] font-semibold text-[#e35237]">{tour.price > 0 ? `¥${tour.price.toLocaleString("zh-CN")}/人起` : "价格待确认"}<span className="ml-1 font-normal text-[var(--app-muted)]">· 待确认</span></p></div>
          </Link>)}
        </div> : null}
      </section> : null}

      <section className="mt-8 px-5">
        <SectionHeading title="此刻，去哪里" note={`按“${activeMood}”偏好，为你精选下一段旅程`} />
        <Link href={visibleDestinations[0].href} className="app-media app-press group relative block h-[270px] shadow-[var(--app-shadow)]">
          <img src={visibleDestinations[0].image} alt={visibleDestinations[0].name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061c3d]/85 via-[#061c3d]/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white">
            <div>
              <p className="text-[11px] font-semibold text-white/72">{visibleDestinations[0].country} · {visibleDestinations[0].season}</p>
              <h2 className="mt-1 text-[28px] font-semibold">{visibleDestinations[0].name}</h2>
              <p className="mt-1 text-[12px] text-white/78">按“{activeMood}”偏好优先推荐 · {sort}</p>
            </div>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/18 backdrop-blur-xl"><ArrowUpRight size={20} /></span>
          </div>
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {visibleDestinations.slice(1, 3).map((place) => (
            <Link key={place.name} href={place.href} className="app-media app-press group relative h-[205px] shadow-[var(--app-shadow)]">
              <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071b37]/82 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-[10px] text-white/70">{place.country}</p>
                <h3 className="mt-1 text-[18px] font-semibold">{place.name}</h3>
                <p className="mt-1 text-[10px] text-white/72">{place.season}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="px-5"><SectionHeading title="路线推荐" note="少赶路，也不错过真正值得的体验" href="/routes" /></div>
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-5 pb-2">
          {visibleStories.map((story, index) => (
            <Link key={story.title} href={`/ai?destination=${encodeURIComponent(story.destination)}`} className="app-card app-press w-[278px] shrink-0 snap-start overflow-hidden">
              <div className="h-[170px] overflow-hidden"><img src={story.image} alt={story.title} className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]" /></div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-[var(--app-blue)]">{story.eyebrow}</p>
                <h3 className="mt-1.5 text-[17px] font-semibold">{story.title}</h3>
                <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--app-muted)]">
                  <span>{story.note}</span><span>{index + 3}天</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 px-5">
        <SectionHeading title="住进旅行里" note="值得专程前往的酒店体验" href="/hotels" action="找酒店" />
        <Link href="/hotels" className="app-media app-press relative block h-[230px] shadow-[var(--app-shadow)]">
          <img src="/travel-home/hotel-suite.jpg" alt="海边度假酒店" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06275a]/80 via-[#06275a]/25 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex max-w-[240px] flex-col justify-end p-5 text-white">
            <span className="mb-auto grid size-10 place-items-center rounded-[15px] bg-white/16 backdrop-blur-xl"><Compass size={19} /></span>
            <h3 className="text-[22px] font-semibold leading-tight">醒来就能看见海</h3>
            <p className="mt-2 text-[11px] leading-5 text-white/76">精选景观、位置与服务都值得的酒店</p>
          </div>
        </Link>
      </section>

      <section className="mt-10 px-5 pb-5">
        <div className="rounded-[22px] bg-[#0d315d] px-5 py-6 text-white shadow-[0_16px_34px_rgba(7,45,91,.18)]">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-[18px] bg-white/12"><MapPin size={22} /></span>
            <div>
              <h2 className="text-[19px] font-semibold">还没决定去哪？</h2>
              <p className="mt-2 text-[12px] leading-5 text-white/68">告诉旅行顾问你的时间、预算和偏好，从一张空白行程开始。</p>
              <Link href="/ai" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[12px] font-semibold text-[#0759b8]">开始规划</Link>
            </div>
          </div>
        </div>
      </section>

      {filterOpen ? <div className="fixed inset-0 z-50 bg-[#071e3e]/30 backdrop-blur-[2px]" onClick={() => setFilterOpen(false)}>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[520px] rounded-t-[26px] bg-[#f9fcff] px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-[0_-18px_45px_rgba(8,43,93,.16)]" onClick={(event) => event.stopPropagation()}>
          <div className="mx-auto h-1 w-9 rounded-full bg-[#d4e0ea]" /><div className="mt-4 flex items-center justify-between"><div><h2 className="text-[18px] font-semibold text-[#163d66]">探索偏好</h2><p className="mt-1 text-[11px] text-[var(--app-muted)]">选择排序方式，结果会立即更新</p></div><button type="button" onClick={() => setFilterOpen(false)} className="text-[11px] font-semibold text-[var(--app-blue)]">完成</button></div>
          <div className="mt-5 grid grid-cols-3 gap-2">{["推荐", "人气优先", "最新"].map((item) => <button key={item} type="button" onClick={() => setSort(item)} className={`min-h-11 rounded-[14px] text-[11px] font-semibold ${sort === item ? "bg-[var(--app-blue)] text-white" : "border border-[#dce8f4] bg-white text-[#607286]"}`}>{item}</button>)}</div>
          <div className="mt-4 rounded-[15px] bg-[#eef7ff] px-3.5 py-3 text-[10px] leading-5 text-[#5f7c98]">当前主题：<span className="font-semibold text-[var(--app-blue)]">{activeMood}</span> · 排序：<span className="font-semibold text-[var(--app-blue)]">{sort}</span></div>
        </div>
      </div> : null}
    </TravelAppShell>
  );
}
