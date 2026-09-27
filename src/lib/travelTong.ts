import {
  HOTEL_BUDGET_OPTIONS,
  HOTEL_GUEST_OPTIONS,
  HOTEL_PREFERENCE_OPTIONS,
  HOTEL_ROOM_OPTIONS,
  TRAVEL_TIMEFRAME_OPTIONS,
} from "@/lib/validations";

export const TRAVEL_TONG_BRAND = {
  name: "旅途",
  wechatId: "",
  logoAlt: "旅途 Logo",
} as const;

export const LANDING_TRUST_BADGES = [
  "免费询价",
  "不满意不用订",
  "专人客服对接",
  "学生党 / 情侣 / 亲子都能问",
  "觉得合适再决定",
] as const;

export const ROOM_OPTIONS = HOTEL_ROOM_OPTIONS;
export const GUEST_OPTIONS = HOTEL_GUEST_OPTIONS;
export const BUDGET_OPTIONS = HOTEL_BUDGET_OPTIONS;
export const PREFERENCE_OPTIONS = HOTEL_PREFERENCE_OPTIONS;
export const TIMEFRAME_OPTIONS = TRAVEL_TIMEFRAME_OPTIONS;

export type SiteConfig = {
  wechatId: string;
  qrUrl: string;
  heroTitle: string;
  privacyText: string;
};

export const FALLBACK_SITE_CONFIG: SiteConfig = {
  wechatId: TRAVEL_TONG_BRAND.wechatId,
  qrUrl: "",
  heroTitle: "旅行出发前，先让旅途帮你查一版更划算的方案",
  privacyText: "提交后仅用于客服询价和沟通，不会公开你的个人信息。",
};

export const ICP_NUMBER = process.env.NEXT_PUBLIC_ICP_NUMBER?.trim() || "";
export const ICP_LINK =
  process.env.NEXT_PUBLIC_ICP_LINK?.trim() || "https://beian.miit.gov.cn/";
export const PSB_NUMBER = process.env.NEXT_PUBLIC_PSB_NUMBER?.trim() || "";
export const PSB_LINK = process.env.NEXT_PUBLIC_PSB_LINK?.trim() || "";
