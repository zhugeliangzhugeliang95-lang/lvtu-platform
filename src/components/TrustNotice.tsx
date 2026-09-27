import { CheckCircle2, Clock3, Headphones, ShieldCheck } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "真实需求询价" },
  { icon: CheckCircle2, label: "确认价格后再成交" },
  { icon: Headphones, label: "复杂需求人工接管" },
  { icon: Clock3, label: "售前到售后可跟进" },
];

export function TrustNotice() {
  return (
    <section className="border-y border-[#e3e9f1] bg-white px-4 py-5">
      <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {items.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs font-medium text-[#667085]">
            <Icon size={16} className="shrink-0 text-[#168f67]" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-4xl text-[11px] leading-5 text-[#8d98a8]">价格与房态以顾问最终确认为准；页面中的非实时内容会明确标注为参考信息。</p>
    </section>
  );
}
