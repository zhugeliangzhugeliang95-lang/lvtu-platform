import type { PriceType } from "@/lib/travelData";

export function PriceTypeBadge({ type }: { type: PriceType }) {
  const pending = type === "待人工确认";
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${pending ? "border-[#f4d9aa] bg-[#fff8eb] text-[#9a6115]" : "border-[#cfe1fb] bg-[#eff6ff] text-[#104da6]"}`}>
      {type}
    </span>
  );
}
