export type PriceState = "reference" | "estimated" | "confirmed";

export type Hotel = {
  id: string;
  name: string;
  city: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  travelTongPrice: number;
  marketReferencePrice: number;
  priceState: PriceState;
};

export type HotelRoom = {
  id: string;
  hotelId: string;
  name: string;
  image: string;
  area: string;
  bedType: string;
  breakfast: string;
  cancellation: string;
  guests: number;
  price: number;
};

export type TravelPlan = {
  id: string;
  href?: string;
  title: string;
  destination: string;
  image: string;
  days: string;
  audience: string;
  highlights: string[];
  estimatedPrice: number;
  priceUnit: string;
};

export type Destination = {
  id: string;
  name: string;
  subtitle: string;
  image: string;
};

export type HomeIconKey =
  | "hotel"
  | "transport"
  | "ticket"
  | "car"
  | "package"
  | "tour"
  | "ai"
  | "consultant"
  | "weekend"
  | "family"
  | "globe";

export type HomeLinkItem = {
  id: string;
  label: string;
  href: string;
  icon: HomeIconKey;
};

export type HomeCoreService = HomeLinkItem & {
  tone: "blue" | "sky" | "coral" | "sage" | "gold" | "aurora" | "navy";
};

export type SavingService = {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  tone: "sky" | "sage" | "warm" | "lilac";
};

export type TravelInspiration = {
  id: string;
  title: string;
  summary: string;
  image: string;
  type: "平台实测" | "用户分享" | "AI整理";
  href: string;
};

export type HomeExtraService = {
  id: string;
  label: string;
  detail: string;
  icon: "stay" | "go" | "play" | "tour";
  href: string;
};

export type TrustBenefit = {
  id: string;
  title: string;
  description: string;
  icon: "price" | "progress" | "support" | "follow";
};

export type ConsultantInfo = {
  title: string;
  description: string;
  href: string;
};

export type Traveler = {
  id: string;
  name: string;
  mobile: string;
};

export type Order = {
  id: string;
  orderNo: string;
  productName: string;
  amount: number;
  status: "pending_confirmation" | "pending_payment" | "paid" | "completed";
};

export type Trip = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  image: string;
};

export type PriceComparison = {
  platform: string;
  price: number;
  queriedAt: string;
  isReference: boolean;
};

export type AITravelMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: TravelPlan;
};

export type HomeTravelData = {
  featuredHotel: Hotel;
  featuredPlans: TravelPlan[];
  destinations: Destination[];
  quickScenes: HomeLinkItem[];
  coreServices: HomeCoreService[];
  savingServices: SavingService[];
  inspiration: TravelInspiration[];
  extraServices: HomeExtraService[];
  trustBenefits: TrustBenefit[];
  consultant: ConsultantInfo;
};
