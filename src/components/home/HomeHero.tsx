import Link from "next/link";
import { Search } from "lucide-react";
import { TravelImage } from "@/components/travel/TravelImage";
import type { HomeLinkItem } from "@/lib/types/travel";
import { HomeIcon } from "@/components/home/HomeIcon";

export function HomeHero({ quickScenes }: { quickScenes: HomeLinkItem[] }) {
  return (
    <section aria-labelledby="home-hero-title" className="pb-7">
      <div className="home-hero relative mx-4 h-[382px] overflow-visible rounded-[28px]">
        <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#b7cbd7] shadow-[var(--shadow-feature)]">
          <TravelImage
            src="/swimmingpool.jpg"
            alt="日落时分的海岸度假酒店与泳池"
            priority
            className="home-hero-media absolute inset-0"
            imageClassName="object-[43%_center]"
            sizes="(max-width: 520px) calc(100vw - 32px), 488px"
          />
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(16,33,58,.58)_0%,rgba(18,52,91,.22)_52%,rgba(18,52,91,.05)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#10213a]/30 to-transparent" />
          <div className="home-hero-copy relative px-6 pt-8 text-white">
            <p className="text-[13px] font-medium text-white/82">AI旅行管家 · 优质资源 · 专属服务</p>
            <h1 id="home-hero-title" className="mt-4 max-w-[230px] text-[32px] font-semibold leading-[1.24]">
              住得更好，<br />花得更少，<br />旅行更省心
            </h1>
          </div>
        </div>

        <form action="/search" method="get" className="home-search absolute inset-x-3 -bottom-7 z-10 flex h-[72px] items-center gap-2 rounded-[26px] border border-white/70 bg-white/80 p-2 pl-4 shadow-[var(--shadow-float)] backdrop-blur-[22px]">
          <Search size={20} className="shrink-0 text-[var(--slate)]" strokeWidth={1.9} />
          <input
            name="q"
            aria-label="搜索目的地、酒店或服务"
            placeholder="搜索目的地 / 酒店 / 服务"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--ink-navy)] outline-none placeholder:text-[#7d8898]"
          />
          <button type="submit" className="h-14 w-[92px] shrink-0 rounded-[21px] bg-[var(--voyage-blue)] text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(47,107,255,.23)] transition hover:bg-[#255fe9] active:scale-[0.975]">
            搜索
          </button>
        </form>
      </div>

      <div className="no-scrollbar home-scenes mt-[52px] flex snap-x gap-2.5 overflow-x-auto px-5 pb-1">
        {quickScenes.map((scene, index) => (
          <Link
            key={scene.id}
            href={scene.href}
            style={{ animationDelay: `${240 + index * 30}ms` }}
            className="home-scene-chip flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-white/80 bg-white/82 px-4 text-[13px] font-medium text-[var(--ink-navy)] shadow-[var(--shadow-small)] backdrop-blur-[22px] transition active:scale-[0.975]"
          >
            <span className="text-[var(--voyage-blue)]"><HomeIcon name={scene.icon} size={17} /></span>
            {scene.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
