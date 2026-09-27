import Link from "next/link";
import {
  BadgeDollarSign,
  ChevronRight,
  ClipboardCheck,
  Headphones,
  MessagesSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { ExtraServiceIcon } from "@/components/home/HomeIcon";
import type { ConsultantInfo, HomeExtraService, TrustBenefit } from "@/lib/types/travel";

const trustIcons = {
  price: BadgeDollarSign,
  progress: ClipboardCheck,
  support: ShieldCheck,
  follow: MessagesSquare,
};

const trustTone = {
  price: "bg-[#edf3ff] text-[#2f6bff]",
  progress: "bg-[#eef8f4] text-[#63a892]",
  support: "bg-[#fff4eb] text-[#d28c42]",
  follow: "bg-[#f2effc] text-[#7269d4]",
};

export function OtherTravelServices({ services }: { services: HomeExtraService[] }) {
  return (
    <section className="home-section px-5" aria-labelledby="other-services-title">
      <h2 id="other-services-title" className="text-[23px] font-semibold text-[var(--ink-navy)]">旅行中的其他事情</h2>
      <div className="mt-4 divide-y divide-[#e8edf3] border-y border-[#e8edf3]">
        {services.map((service) => (
          <Link key={service.id} href={service.href} className="flex min-h-[72px] items-center gap-3 active:scale-[0.99]">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-white text-[var(--aegean-navy)] shadow-[var(--shadow-small)]"><ExtraServiceIcon name={service.icon} /></span>
            <span className="w-5 shrink-0 text-[18px] font-semibold text-[var(--ink-navy)]">{service.label}</span>
            <span className="min-w-0 flex-1 text-[12px] leading-5 text-[var(--slate)]">{service.detail}</span>
            <ChevronRight size={16} className="shrink-0 text-[#a3acb9]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ConsultantCard({ consultant }: { consultant: ConsultantInfo }) {
  return (
    <section className="home-section px-4" aria-labelledby="consultant-title">
      <div className="flex min-h-[150px] items-center gap-4 rounded-[24px] border border-[#f3e3cc] bg-[#fff8ef] p-5">
        <div className="relative grid size-[72px] shrink-0 place-items-center rounded-full bg-[#f4e2c8] text-[#b7772f] ring-4 ring-white/70">
          <UserRound size={31} strokeWidth={1.6} />
          <span className="absolute bottom-0 right-0 size-4 rounded-full border-[3px] border-[#fff8ef] bg-[var(--sage-travel)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="consultant-title" className="text-[16px] font-semibold leading-[1.45] text-[var(--ink-navy)]">{consultant.title}</h2>
          <p className="mt-1.5 text-[11px] leading-5 text-[#827568]">{consultant.description}</p>
          <Link href={consultant.href} className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-[15px] border border-[#d7a662] px-4 text-[12px] font-semibold text-[#9d681f] transition hover:bg-white/60 active:scale-[0.975]">
            <Headphones size={14} />联系顾问
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TrustBenefits({ benefits }: { benefits: TrustBenefit[] }) {
  return (
    <section className="home-section px-5 pb-2" aria-labelledby="trust-title">
      <h2 id="trust-title" className="text-[20px] font-semibold text-[var(--ink-navy)]">服务保障</h2>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6">
        {benefits.map((benefit) => {
          const Icon = trustIcons[benefit.icon];
          return (
            <div key={benefit.id} className="flex items-start gap-3">
              <span className={`grid size-9 shrink-0 place-items-center rounded-[12px] ${trustTone[benefit.icon]}`}><Icon size={17} strokeWidth={1.9} /></span>
              <div><h3 className="text-[12px] font-semibold leading-5 text-[var(--ink-navy)]">{benefit.title}</h3><p className="mt-0.5 text-[10px] leading-4 text-[var(--slate)]">{benefit.description}</p></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
