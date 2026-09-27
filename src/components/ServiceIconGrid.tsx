import Link from "next/link";
import { Armchair, Bus, Car, Hotel, Plane, Ticket, TrainFront, Utensils } from "lucide-react";

const items = [
  { key: "hotel", label: "酒店", icon: Hotel },
  { key: "flight", label: "机票", icon: Plane },
  { key: "train", label: "火车票", icon: TrainFront },
  { key: "ticket", label: "门票玩乐", icon: Ticket },
  { key: "buffet", label: "自助餐", icon: Utensils },
  { key: "lounge", label: "贵宾厅", icon: Armchair },
  { key: "transfer", label: "接送机", icon: Car },
  { key: "charter", label: "包车", icon: Bus },
];

export function ServiceIconGrid() {
  return (
    <div className="grid grid-cols-4 gap-y-5 sm:grid-cols-9">
      {items.map(({ key, label, icon: Icon }) => (
        <Link key={key} href={`/inquiry?service=${key}`} className="flex min-h-16 flex-col items-center justify-center gap-2 text-center text-[12px] font-medium text-[#475467] transition hover:text-[#1769e0] active:scale-95">
          <span className="grid h-11 w-11 place-items-center rounded-[14px] border border-[#dce8f8] bg-[#f7faff] text-[#1769e0]">
            <Icon size={20} strokeWidth={2} />
          </span>
          <span>{label}</span><span className="text-[9px] font-normal text-[#8d98a8]">查看预估</span>
        </Link>
      ))}
    </div>
  );
}
