import type { AdvisorMessage, TravelProfile } from "@/lib/ai-advisor/types";

const CITIES = [
  "北京", "上海", "广州", "深圳", "东莞", "成都", "重庆", "杭州", "苏州", "南京",
  "厦门", "泉州", "福州", "长沙", "武汉", "西安", "昆明", "大理", "丽江", "三亚",
  "海口", "青岛", "威海", "桂林", "贵阳", "香港", "澳门", "台北", "东京", "大阪",
  "京都", "新加坡", "曼谷", "普吉岛", "巴厘岛", "马尔代夫", "云南", "新疆", "西藏",
];

const CN_NUMBER: Record<string, number> = {
  一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

function unique(values: string[]) {
  return [...new Set(values)];
}

function extractCities(text: string) {
  return CITIES.filter((city) => text.includes(city));
}

function extractTravelers(text: string) {
  const adultChild = text.match(/(\d{1,2})\s*(?:大|成人).*?(\d{1,2})\s*(?:小|儿童|孩子)/);
  if (adultChild) return Number(adultChild[1]) + Number(adultChild[2]);
  const family = text.match(/(?:一家|全家)\s*([一二两三四五六七八九十]|\d{1,2})\s*口/)
    ?? text.match(/([一二两三四五六七八九十]|\d{1,2})\s*口之家/);
  if (family) return /^\d+$/.test(family[1]) ? Number(family[1]) : CN_NUMBER[family[1]];
  const numeric = text.match(/(\d{1,3})\s*(?:人|位|大|个成人)/);
  if (numeric) return Number(numeric[1]);
  const chinese = text.match(/([一二两三四五六七八九十])\s*个?\s*(?:人|位)/);
  if (chinese) return CN_NUMBER[chinese[1]];
  if (/夫妻|情侣|两口子/.test(text)) return 2;
  if (/一个人|独自|独旅/.test(text)) return 1;
  return undefined;
}

function extractBudget(text: string) {
  const range = text.match(/(?:总预算|预算|控制在)(?:是|约|大概)?\s*([0-9]+(?:\.[0-9]+)?)\s*(万|千|k|K)?\s*(?:元|块)?(?:以内|左右|上下)?/)
    ?? text.match(/([0-9]+(?:\.[0-9]+)?)\s*(万|千|k|K)?\s*(?:元|块)(?:以内|左右|上下)?/);
  if (!range) return undefined;
  const amount = Number(range[1]) * (range[2]?.toLowerCase() === "k" || range[2] === "千" ? 1000 : range[2] === "万" ? 10000 : 1);
  return `${Math.round(amount).toLocaleString("zh-CN")}元${/以内/.test(range[0]) ? "以内" : "左右"}`;
}

function extractTime(text: string) {
  const patterns = [
    /(?:今年|明年)?(?:元旦|春节|清明|五一|端午|暑假|国庆|中秋)/,
    /\d{1,2}月(?:\d{1,2}(?:日|号))?(?:[至到\-~]\d{1,2}(?:日|号))?/,
    /(?:今天|明天|后天|下周|下个月|月底|周末|寒假|暑假|近期|年底)/,
    /\d{4}[年\-/]\d{1,2}(?:[月\-/]\d{1,2})?/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return undefined;
}

function extractDuration(text: string) {
  const dayNight = text.match(/(?:玩|安排|计划|预计)?\s*([一二两三四五六七八九十\d]{1,2})\s*天(?:\s*([一二两三四五六七八九十\d]{1,2})\s*晚)?/);
  if (dayNight) {
    const toNumber = (value: string) => /^\d+$/.test(value) ? Number(value) : CN_NUMBER[value];
    const days = toNumber(dayNight[1]);
    const nights = dayNight[2] ? toNumber(dayNight[2]) : undefined;
    return `${days}天${nights ? `${nights}晚` : ""}`;
  }
  if (/一周|一星期|七天左右/.test(text)) return "约7天";
  if (/周末两天|周末游/.test(text)) return "约2天";
  return undefined;
}

export function emptyProfile(): TravelProfile {
  return { preferences: [] };
}

export function normalizeProfile(value?: Partial<TravelProfile> | null): TravelProfile {
  return {
    ...value,
    preferences: Array.isArray(value?.preferences) ? unique(value.preferences.filter(Boolean)) : [],
  };
}

export function extractProfile(messages: AdvisorMessage[], current?: Partial<TravelProfile>): TravelProfile {
  const profile = normalizeProfile(current);
  const text = messages.filter((message) => message.role === "user").map((message) => message.content).join("；");
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const cities = extractCities(text);
  const originMatch = text.match(/(?:从|由|出发地[是为：:]?\s*)([\u4e00-\u9fa5]{2,10})(?:出发|出行|启程|走)/)
    ?? text.match(/(?:^|[；，。！？]\s*)([\u4e00-\u9fa5]{2,10})(?:出发|出行|启程|走)/);
  const originCity = originMatch ? CITIES.find((city) => originMatch[1].includes(city)) : undefined;
  if (originCity) profile.origin = originCity;

  const destinationMatch = text.match(/(?:想去|去|到|目的地(?:是|选)?)([^，。；、\s]{2,10})/);
  const matchedDestination = destinationMatch
    ? CITIES.find((city) => destinationMatch[1].includes(city))
    : undefined;
  const destinationCity = matchedDestination ?? cities.find((city) => city !== profile.origin && !new RegExp(`${city}(?:出发|出行|启程)`).test(text));
  if (destinationCity) profile.destination = destinationCity;

  profile.travelTime = extractTime(text) ?? profile.travelTime;
  profile.duration = extractDuration(text) ?? profile.duration;
  profile.travelers = extractTravelers(text) ?? profile.travelers;
  profile.budget = extractBudget(text) ?? profile.budget;

  if (/情侣|夫妻|蜜月/.test(text)) profile.travelType = "情侣";
  else if (/家庭|亲子|带娃|老人|父母|一家|全家|口之家/.test(text)) profile.travelType = "家庭";
  else if (/商务|接待|出差/.test(text)) profile.travelType = "商务";
  else if (/团队|团建|公司|\d{2,}\s*人/.test(text)) profile.travelType = "团队";
  else if (/朋友|同学|闺蜜/.test(text)) profile.travelType = "朋友";
  else if (/一个人|独自|独旅/.test(text)) profile.travelType = "个人";

  const preferenceRules: Array<[RegExp, string]> = [
    [/海岛|海边|沙滩|潜水/, "海岛"], [/美食|吃|小吃/, "美食"], [/景点|打卡|古镇|人文/, "景点"],
    [/购物|买买买/, "购物"], [/休闲|度假|不想太累|慢节奏|放松/, "休闲"], [/小众|人少/, "小众"],
    [/轻松|不赶路|少折腾|慢慢玩/, "轻松"],
  ];
  profile.preferences = unique([
    ...profile.preferences,
    ...preferenceRules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label),
  ]);

  if (/高端|豪华|五星|住好一点|品质酒店/.test(text)) profile.hotelLevel = "高端";
  else if (/经济|便宜|青旅|快捷/.test(text)) profile.hotelLevel = "经济";
  else if (/舒适|四星|品质型/.test(text)) profile.hotelLevel = "舒适";

  const phone = latest.match(/1[3-9]\d{9}/)?.[0];
  const wechat = latest.match(/(?:微信|V|vx|WX)[:：\s]*([A-Za-z][\w-]{5,19})/i)?.[1];
  if (phone || wechat) profile.contact = phone ?? wechat;
  const name = latest.match(/(?:我叫|姓名[:：]?|称呼我)([\u4e00-\u9fa5]{2,4})/)?.[1];
  if (name) profile.customerName = name;

  return profile;
}

export const REQUIRED_PROFILE_FIELDS: Array<keyof TravelProfile> = ["origin", "destination", "travelTime", "travelers", "budget"];

export function missingProfileFields(profile: TravelProfile) {
  return REQUIRED_PROFILE_FIELDS.filter((field) => !profile[field]);
}

export function detectValueSignal(text: string) {
  const matches = [
    [/(我要订|想预订|帮我订|现在订)/, "用户表达了预订意向"],
    [/(多少钱|价格|费用|报价)/, "用户开始询问价格"],
    [/(优惠|折扣|便宜一点)/, "用户关注优惠方案"],
    [/(多人|团队|团建|\d{2,}\s*人)/, "多人或团队旅行"],
    [/(定制路线|定制行程|私人定制)/, "用户需要定制路线"],
    [/(商务接待|商务旅行|公司接待)/, "商务接待需求"],
  ] as const;
  const hit = matches.find(([pattern]) => pattern.test(text));
  return hit ? { highValue: true, reason: hit[1] } : { highValue: false, reason: undefined };
}

export function chooseTask(messages: AdvisorMessage[], profile: TravelProfile) {
  const latest = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const conditionCount = [profile.origin, profile.destination, profile.travelTime, profile.travelers, profile.budget, profile.hotelLevel, profile.preferences.length].filter(Boolean).length;
  const explicitlyPlanning = /(规划|安排|路线|行程|每天|怎么走|攻略)/.test(latest);
  const multiConstraintRequest = conditionCount >= 5 && latest.length >= 24;
  return (explicitlyPlanning && conditionCount >= 4) || multiConstraintRequest
    ? "COMPLEX_PLAN" as const
    : "MAIN_CHAT" as const;
}
