import type { LucideIcon } from "lucide-react";
import {
  BedDouble,
  Bot,
  BriefcaseBusiness,
  BusFront,
  CarFront,
  Earth,
  FerrisWheel,
  Hotel,
  Luggage,
  Map,
  PlaneTakeoff,
  Sparkles,
  Tickets,
  TrainFront,
  Trees,
  UsersRound,
} from "lucide-react";
import type { HomeIconKey } from "@/lib/types/travel";

const iconMap: Record<HomeIconKey, LucideIcon> = {
  hotel: Hotel,
  transport: PlaneTakeoff,
  ticket: Tickets,
  car: CarFront,
  package: BriefcaseBusiness,
  tour: Map,
  ai: Sparkles,
  consultant: UsersRound,
  weekend: Trees,
  family: FerrisWheel,
  globe: Earth,
};

const extraIconMap = {
  stay: BedDouble,
  go: TrainFront,
  play: FerrisWheel,
  tour: BusFront,
};

export function HomeIcon({ name, size = 22, strokeWidth = 1.9 }: { name: HomeIconKey; size?: number; strokeWidth?: number }) {
  const Icon = iconMap[name] ?? Luggage;
  return <Icon aria-hidden size={size} strokeWidth={strokeWidth} />;
}

export function ExtraServiceIcon({ name, size = 20 }: { name: keyof typeof extraIconMap; size?: number }) {
  const Icon = extraIconMap[name] ?? Bot;
  return <Icon aria-hidden size={size} strokeWidth={1.9} />;
}
