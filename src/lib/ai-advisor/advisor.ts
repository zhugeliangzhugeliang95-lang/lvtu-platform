import { chooseTask, detectValueSignal, extractProfile, missingProfileFields } from "@/lib/ai-advisor/profile";
import { retrieveKnowledge } from "@/lib/ai-advisor/knowledge";
import { generateModelReply } from "@/lib/ai-advisor/models";
import type { AdvisorMessage, AdvisorResult, TravelProfile } from "@/lib/ai-advisor/types";
import { calculatePublicPriceEstimate, extractPublicReferencePrice } from "@/lib/pricing/public-price-estimate";

type MembershipContext = {
  state: "NONE" | "ACTIVE" | "PENDING" | "EXPIRED" | "SUSPENDED";
  expiresAt?: string | null;
  phoneSuffix?: string | null;
  price: number;
};

const FIELD_LABELS: Record<string, string> = {
  origin: "出发地", destination: "目的地", travelTime: "出行时间", travelers: "人数", budget: "预算",
};

function quickReplies(missing: string[], profile: TravelProfile) {
  const next = missing[0];
  if (next === "origin") return ["广州出发", "上海出发", "北京出发"];
  if (next === "destination") return ["想去海边", "想看自然风景", "想逛吃逛吃"];
  if (next === "travelTime") return ["国庆出发", "下个月", "时间还没定"];
  if (next === "travelers") return ["2个人", "一家三口", "6位朋友"];
  if (next === "budget") return ["预算5000元", "预算1万元", "先按舒适型规划"];
  if (profile.hotelLevel === undefined) return ["舒适型酒店", "住好一点", "酒店经济实用即可"];
  return ["行程轻松一点", "多安排当地美食", "帮我整理给人工顾问"];
}

function dailyPlan(destination: string, duration?: string) {
  const days = Math.min(Math.max(Number(duration?.match(/\d+/)?.[0] || 5), 3), 7);
  const plans: Record<string, string[]> = {
    三亚: [
      "Day 1｜抵达后入住，先在酒店或附近海边休整",
      "Day 2｜安排一处核心海湾，留出午后休息和日落时间",
      "Day 3｜选择一个自然或人文体验，不再叠加远距离景点",
      "Day 4｜自由活动、轻量水上项目或当地餐饮体验",
      "Day 5｜早餐后从容返程，预留交通机动时间",
    ],
    成都: [
      "Day 1｜抵达后在住处周边散步，先适应城市节奏",
      "Day 2｜市区人文与美食安排在同一片区，减少折返",
      "Day 3｜选择一个亲子或自然体验，午后回城休息",
      "Day 4｜留半天自由活动，再根据体力补充周边体验",
      "Day 5｜早餐、伴手礼与返程，避免排太早的远途项目",
    ],
    重庆: [
      "Day 1｜抵达后安排住处周边夜景和晚餐",
      "Day 2｜把核心城市体验集中在一条动线上，减少爬坡折返",
      "Day 3｜选择一处人文或江景体验，午后休息",
      "Day 4｜留给美食、咖啡和自由探索，不追赶景点",
      "Day 5｜按返程时间安排轻量活动，再前往车站或机场",
    ],
  };
  const selected = plans[destination] || [
    "Day 1｜抵达、入住和周边熟悉，先不安排高强度活动",
    "Day 2｜一个核心目的地，配合附近餐饮或散步",
    "Day 3｜自然或人文体验，午后保留休息时间",
    "Day 4｜自由活动或第二个核心区域，避免频繁换住处",
    "Day 5｜收尾体验与返程，预留交通机动时间",
  ];
  return selected.slice(0, days).join("\n");
}

function localReply(profile: TravelProfile, missing: string[], highValue: boolean, sources: Awaited<ReturnType<typeof retrieveKnowledge>>, latest: string) {
  if (/^(你好|您好|嗨|哈喽|hello|hi)[!！。\s]*$/i.test(latest.trim())) {
    return "你好，我是旅途的旅行顾问。你可以直接告诉我想去哪里、从哪里出发，或者说‘还没想好，帮我推荐’。我会先给你方向，再按需要补充时间和人数。";
  }
  const matchedTour = sources.find((source) => source.id.startsWith("tour:"));
  if (matchedTour && /旅行团|跟团|小团|团期|班期|产品|价格|多少钱|有.*团/.test(latest)) {
    return `有，当前产品库里匹配到「${matchedTour.title}」。\n\n${matchedTour.excerpt}\n\n你可以点开下方知识来源查看完整行程；如果准备咨询报名，再告诉我出发地、计划日期和人数，我会把需求整理给顾问确认最终名额与价格。`;
  }
  if (!profile.destination && /海边|海岛|沙滩|潜水/.test(latest)) {
    return `如果你想把重点放在海边，我会先这样筛选：\n\n• 三亚：交通和中文服务更省心，适合${profile.travelType === "家庭" ? "带孩子的轻松度假" : "4—6天短假"}；亚龙湾偏安静，市区和大东海更方便。\n• 厦门：海边之外还有城市散步、美食和人文，适合不想整天躺酒店的行程。\n• 普吉岛：度假感和水上体验更强，但要把航班、证件和跨境准备算进计划。\n\n你现在只需要补充出发地和${profile.duration || "大概玩几天"}，我就能进一步排路线；价格、房态和航班会由顾问在收集需求后核实。`;
  }
  if (!profile.destination && (/推荐|去哪|目的地|自然|美食|亲子/.test(latest) || profile.travelType)) {
    const direction = profile.preferences.includes("美食") || /美食|吃/.test(latest)
      ? "成都或重庆：一个更适合慢慢逛和吃，一个更适合夜景与城市体验"
      : profile.preferences.includes("景点") || /自然|风景/.test(latest)
        ? "云南：昆明—大理—丽江适合把自然、人文和慢节奏放在一条线上"
        : profile.travelType === "家庭"
          ? "三亚、成都或厦门：交通与活动密度相对好控制，适合留出休息时间"
          : "海边、城市美食或自然风景三条方向都可以，我会按出发地和时间帮你收窄范围";
    return `可以，先给你一个不带销售倾向的方向：${direction}。\n\n为了避免推荐和实际出行不匹配，告诉我${profile.origin ? "目的地偏好" : "出发地"}和${profile.duration || "大概玩几天"}就好，我会继续给出路线节奏和住宿区域建议。`;
  }
  if (missing.length) {
    const known = [
      profile.origin ? `从${profile.origin}出发` : undefined,
      profile.destination ? `去${profile.destination}` : undefined,
      profile.travelTime,
      profile.travelers ? `${profile.travelers}人` : undefined,
    ].filter(Boolean).join("、");
    const nextField = missing[0];
    const questions: Record<string, string> = {
      origin: "从哪里出发",
      destination: "想去哪里",
      travelTime: "准备什么时候出发",
      travelers: "一共几个人",
      budget: "大概预算多少",
    };
    const next = questions[nextField] || FIELD_LABELS[nextField] || "最在意什么";
    const later = missing.length > 1 ? "，其他信息后面再补充" : "";
    return `${known ? `好的，我先记下：${known}。` : "好，我来帮你一起梳理。"}先告诉我${next}就可以${later}。`;
  }
  const knowledge = sources.find((source) => ["DESTINATION", "HOTEL", "ITINERARY"].includes(source.category))?.excerpt;
  const destination = profile.destination || "这次旅行";
  const opening = `我先按${profile.travelType ? `${profile.travelType}出行` : "你的出行方式"}整理：${profile.origin}出发，${profile.travelTime || "时间待定"}${profile.duration ? `，约${profile.duration}` : ""}去${destination}，${profile.travelers}人，预算${profile.budget}。`;
  const pace = profile.preferences.includes("轻松") || profile.preferences.includes("休闲") || profile.travelType === "家庭"
    ? "节奏：每天安排1个核心体验，抵达日和返程日留出缓冲，午后或晚餐前不再塞新的远距离景点。"
    : "节奏：用1个核心区域串起每天的行程，跨城移动尽量集中安排，避免在交通上消耗太多时间。";
  const itinerary = `行程草案：\n${dailyPlan(destination, profile.duration)}`;
  const stay = profile.hotelLevel === "高端"
    ? "住宿：优先连续住同一区域的高品质酒店，把景观、公共设施和到核心活动的动线放在一起比较。"
    : profile.hotelLevel === "经济"
      ? "住宿：先看交通和安全，再比较房间、早餐与取消规则，避免只按低价选到动线不合适的位置。"
      : "住宿：先按行程动线选区域，再比较舒适度、早餐、房间空间和到活动点的交通时间。";
  const budget = "预算：先拆成交通、住宿、餐饮、活动和机动金五部分；具体供应商报价、库存和最终可订性需要顾问按日期核实。";
  const value = highValue || missing.length === 0
    ? "下一步：我可以把这份需求整理给人工旅行顾问，由顾问继续确认具体酒店、交通、门票或旅行团方案。"
    : "如果这个方向合适，我下一步可以为你展开分日路线。";
  return `${opening}\n\n${pace}\n\n${itinerary}\n\n${stay}\n${budget}${knowledge ? `\n\n知识库参考：${knowledge}` : ""}\n\n${value}`;
}

export async function advise(params: { messages: AdvisorMessage[]; currentProfile?: Partial<TravelProfile>; membership?: MembershipContext }): Promise<AdvisorResult> {
  const started = Date.now();
  const profile = extractProfile(params.messages, params.currentProfile);
  const missingFields = missingProfileFields(profile);
  const latest = [...params.messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const signal = detectValueSignal(params.messages.filter((message) => message.role === "user").map((message) => message.content).join("；"));
  const task = chooseTask(params.messages, profile);
  const sources = await retrieveKnowledge(`${latest} ${profile.destination || ""} ${profile.preferences.join(" ")}`);
  const conversationText = params.messages.filter((message) => message.role === "user").slice(-4).map((message) => message.content).join("；");
  const publicReferencePrice = extractPublicReferencePrice(latest);
  const asksAboutTours = /旅行团|跟团|小团|团期|班期|参团|报团|有哪些团|现在.*团/.test(latest);
  if (asksAboutTours) {
    const tourSources = sources.filter((source) => source.id.startsWith("tour:")).slice(0, 5);
    const wantsConsultation = /报名|名额|班期|价格|多少钱|咨询|预订/.test(latest);
    const message = tourSources.length
      ? `目前“旅途”已上架这些旅行团：\n\n${tourSources.map((source, index) => `${index + 1}. ${source.title}\n${source.excerpt.split("。").slice(0, 2).join("。")}。`).join("\n\n")}\n\n这些是当前真实产品资料，不是演示内容。页面价格与班期属于参考或待确认状态；感兴趣可以打开下方产品详情，再让客服确认最终名额、价格和履约安排。`
      : "当前没有匹配到已上架的旅行团。我不会用演示线路代替真实产品；你可以告诉我目的地、日期和人数，我会把需求整理给客服继续匹配。";
    return {
      message, profile, missingFields, highValue: wantsConsultation,
      handoffSuggested: wantsConsultation, handoffReason: wantsConsultation ? "客户正在咨询旅行团班期、价格或报名" : undefined,
      task: "LOCAL_FALLBACK", model: "lvtu-tour-catalog", provider: "local", latencyMs: Date.now() - started,
      sourceIds: tourSources.map((source) => source.id), sources: tourSources,
      quickReplies: tourSources.length ? ["按目的地帮我筛选", "帮我比较这些线路", "整理需求给客服"] : ["整理需求给客服", "看看热门目的地"],
    };
  }
  if (publicReferencePrice) {
    const priceSources = sources.filter((source) => !source.id.startsWith("tour:")).slice(0, 3);
    const standardizedTransport = /机票|火车票|高铁|动车|航班/.test(conversationText);
    if (standardizedTransport) {
      return {
        message: `我记下你看到的公开价是 ¥${publicReferencePrice.toLocaleString("zh-CN")}。机票和火车票属于标准票务，价格与退改规则波动较大，旅途不会直接套用 70%～80% 预估；当前状态为“待确认”，由客服核实最终价格。`,
        profile, missingFields, highValue: true, handoffSuggested: true, handoffReason: "已提供公开票价，建议客服核实同班次与退改规则",
        task: "LOCAL_FALLBACK", model: "travel-tong-price-engine", provider: "local", latencyMs: Date.now() - started,
        sourceIds: priceSources.map((source) => source.id), sources: priceSources, quickReplies: ["整理完整需求给客服", "继续补充日期和人数"],
        estimateCard: { priceStatus: "PENDING_CONFIRMATION", publicReferencePrice, estimatedMinPrice: null, estimatedMaxPrice: null, serviceFeeMin: null, serviceFeeMax: null, memberFeeWaived: params.membership?.state === "ACTIVE" },
      };
    }
    const estimate = calculatePublicPriceEstimate(publicReferencePrice)!;
    const memberFeeWaived = params.membership?.state === "ACTIVE";
    const feeLine = memberFeeWaived
      ? "你当前是有效会员，使用绑定手机号预订可免平台服务费。"
      : `普通用户成交后按实际节省金额的 35% 收取服务费；按当前区间仅作估算约为 ¥${estimate.estimatedServiceFeeMin.toLocaleString("zh-CN")}～¥${estimate.estimatedServiceFeeMax.toLocaleString("zh-CN")}，最终按实际节省计算。`;
    return {
      message: `已按你提供的公开原价 ¥${publicReferencePrice.toLocaleString("zh-CN")}，使用旅途稳定规则计算：\n\n预估价：¥${estimate.estimatedMinPrice.toLocaleString("zh-CN")}～¥${estimate.estimatedMaxPrice.toLocaleString("zh-CN")}（公开原价的 70%～80%）\n预计节省：¥${estimate.savingsMin.toLocaleString("zh-CN")}～¥${estimate.savingsMax.toLocaleString("zh-CN")}\n\n${feeLine}\n\n当前状态是“预估价”，不是可直接下单的售价；客服确认库存、规格与退改规则后，才会形成“最终确认价”。`,
      profile, missingFields, highValue: true, handoffSuggested: true, handoffReason: "已生成预估价，可以把完整需求交给客服确认",
      task: "LOCAL_FALLBACK", model: "travel-tong-price-engine", provider: "local", latencyMs: Date.now() - started,
      sourceIds: priceSources.map((source) => source.id), sources: priceSources, quickReplies: ["认可，整理给客服", "我是旅途会员", "继续补充需求"],
      estimateCard: { priceStatus: "ESTIMATED", publicReferencePrice, estimatedMinPrice: estimate.estimatedMinPrice, estimatedMaxPrice: estimate.estimatedMaxPrice, serviceFeeMin: memberFeeWaived ? 0 : estimate.estimatedServiceFeeMin, serviceFeeMax: memberFeeWaived ? 0 : estimate.estimatedServiceFeeMax, memberFeeWaived },
    };
  }
  if (/会员|服务费|免服务费/.test(latest)) {
    const membership = params.membership;
    const message = membership?.state === "ACTIVE"
      ? `你的旅途会员当前有效${membership.expiresAt ? `，有效期至 ${new Date(membership.expiresAt).toLocaleDateString("zh-CN")}` : ""}${membership.phoneSuffix ? `。使用尾号 ${membership.phoneSuffix} 的绑定手机号预订，可免平台服务费` : "，使用绑定手机号预订可免平台服务费"}。`
      : membership?.state === "PENDING"
        ? "你的会员申请正在等待付款核对，确认到账后会进入会员模式。生效后使用绑定手机号预订，可免平台服务费。"
        : `你当前没有有效的旅途会员。会员费为 ¥${membership?.price ?? 30}/月，开通并使用绑定手机号预订后，可免平台服务费；普通用户按最终实际节省金额的 35% 收取服务费。`;
    return {
      message, profile, missingFields, highValue: false, handoffSuggested: false, task: "LOCAL_FALLBACK",
      model: "travel-tong-membership-lookup", provider: "local", latencyMs: Date.now() - started,
      sourceIds: [], sources: [], quickReplies: membership?.state === "ACTIVE" ? ["帮我做低价预估", "查看会员中心"] : ["去开通会员", "帮我做低价预估"],
    };
  }
  try {
    const generated = await generateModelReply({ task, messages: params.messages, profile, sources, missingFields, highValue: signal.highValue });
    if (generated) return {
      message: generated.text, profile, missingFields, highValue: signal.highValue,
      handoffSuggested: signal.highValue, handoffReason: signal.reason, task,
      model: generated.model, provider: generated.provider, latencyMs: generated.latencyMs,
      sourceIds: sources.map((source) => source.id), sources, quickReplies: quickReplies(missingFields, profile), usage: generated.usage,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn("[AI advisor model fallback]", reason.slice(0, 240));
  }
  return {
    message: localReply(profile, missingFields, signal.highValue, sources, latest), profile, missingFields,
    highValue: signal.highValue, handoffSuggested: signal.highValue, handoffReason: signal.reason,
    task: "LOCAL_FALLBACK", model: "travel-tong-local-advisor", provider: "local", latencyMs: Date.now() - started,
    sourceIds: sources.map((source) => source.id), sources, quickReplies: quickReplies(missingFields, profile),
  };
}

export function createHandoffSummary(profile: TravelProfile, notes?: string) {
  return [
    "【旅途咨询重点】",
    `行程：${profile.origin ? `从${profile.origin}出发，` : ""}${profile.destination || "目的地待确认"}`,
    `时间：${profile.travelTime || "待补充"}${profile.duration ? ` · ${profile.duration}` : ""}`,
    `人数：${profile.travelers ? `${profile.travelers}人` : "待补充"} · 预算：${profile.budget || "待补充"}`,
    `偏好：${[...profile.preferences, profile.hotelLevel ? `${profile.hotelLevel}酒店` : ""].filter(Boolean).join("、") || "待进一步沟通"}`,
    notes ? `补充：${notes}` : "",
    "请客服确认可订性、最终价格、服务内容和退改规则。",
  ].filter(Boolean).join("\n");
}
