export type ChatRole = "user" | "assistant";

export type AdvisorMessage = {
  role: ChatRole;
  content: string;
};

export type TravelProfile = {
  customerName?: string;
  contact?: string;
  origin?: string;
  destination?: string;
  travelTime?: string;
  duration?: string;
  travelers?: number;
  budget?: string;
  travelType?: "情侣" | "家庭" | "朋友" | "商务" | "团队" | "个人";
  preferences: string[];
  hotelLevel?: "经济" | "舒适" | "高端";
};

export type KnowledgeSource = {
  id: string;
  title: string;
  category: "DESTINATION" | "HOTEL" | "ITINERARY" | "FAQ";
  excerpt: string;
  href?: string;
};

export type AdvisorTask = "MAIN_CHAT" | "COMPLEX_PLAN" | "LOCAL_FALLBACK";

export type AdvisorEstimateCard = {
  priceStatus: "ESTIMATED" | "PENDING_CONFIRMATION";
  publicReferencePrice: number;
  estimatedMinPrice: number | null;
  estimatedMaxPrice: number | null;
  serviceFeeMin: number | null;
  serviceFeeMax: number | null;
  memberFeeWaived: boolean;
};

export type AdvisorResult = {
  message: string;
  profile: TravelProfile;
  missingFields: string[];
  highValue: boolean;
  handoffSuggested: boolean;
  handoffReason?: string;
  task: AdvisorTask;
  model: string;
  provider: string;
  latencyMs: number;
  sourceIds: string[];
  sources: KnowledgeSource[];
  quickReplies: string[];
  estimateCard?: AdvisorEstimateCard;
  usage?: { inputTokens?: number; outputTokens?: number };
};
