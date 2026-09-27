/**
 * Backward-compatible adapter for the first platform AI API.
 *
 * New integrations should use `@/lib/ai-advisor` or `/api/ai/advisor`.
 * Keeping this adapter prevents existing `/api/ai/plan` consumers from being
 * stranded while ensuring every request goes through the same model router,
 * knowledge retrieval and business guardrails.
 */
import { advise } from "@/lib/ai-advisor";
import type { AdvisorResult, TravelProfile } from "@/lib/ai-advisor";
import type { TravelPlan, TravelPlanRequest } from "./types";

const DEFAULT_DAY_TITLES = [
  "抵达与安顿",
  "核心体验",
  "在地慢游",
  "小众探索",
  "自由活动",
  "从容返程",
];

function requestPrompt(request: TravelPlanRequest) {
  const facts = [
    request.destination ? `目的地${request.destination}` : "",
    request.days ? `${request.days}天` : "",
    request.budget ? `预算${request.budget}元` : "",
    request.travelers ? `${request.travelers}人` : "",
  ].filter(Boolean);
  return [request.prompt.trim(), facts.join("，"), "请给出节奏合理的分日旅行建议。"].filter(Boolean).join("；");
}

function profileFromRequest(request: TravelPlanRequest): Partial<TravelProfile> {
  return {
    destination: request.destination,
    travelers: request.travelers,
    budget: request.budget ? `${request.budget.toLocaleString("zh-CN")}元左右` : undefined,
    preferences: [],
  };
}

function extractSuggestedDays(message: string) {
  const lines = message.split("\n").map((line) => line.trim()).filter(Boolean);
  return lines.flatMap((line) => {
    const match = line.match(/^(?:[-*]\s*)?(?:Day\s*|第)?(\d{1,2})(?:天|日)?[：:.、\s-]*(.*)$/i);
    if (!match || !match[2]) return [];
    return [{ day: Number(match[1]), text: match[2].replace(/^[-—–]\s*/, "") }];
  });
}

function legacyPlan(request: TravelPlanRequest, result: AdvisorResult): TravelPlan {
  const days = Math.min(Math.max(request.days || 5, 1), 30);
  const suggested = extractSuggestedDays(result.message);
  const destination = result.profile.destination || request.destination || "待确认目的地";
  return {
    title: `${destination}${days}天旅行建议`,
    summary: result.message,
    destination,
    days,
    budget: result.profile.budget || (request.budget ? `约 ¥${request.budget.toLocaleString("zh-CN")}` : "预算待确认"),
    itinerary: Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const extracted = suggested.find((item) => item.day === day)?.text;
      const title = extracted?.split(/[：:；;]/)[0] || (day === days ? "从容返程" : DEFAULT_DAY_TITLES[Math.min(index, DEFAULT_DAY_TITLES.length - 2)]);
      return {
        day,
        title,
        details: extracted ? [extracted] : ["每天保留机动时间，具体交通、开放规则和可订情况由人工顾问继续核实。"],
      };
    }),
    reminders: [
      "此方案为AI旅行建议，不代表已预订。",
      "实时价格、库存、退改规则与供应商确认由人工旅行顾问处理。",
    ],
  };
}

export async function generateTravelPlanWithAdvisor(request: TravelPlanRequest) {
  const result = await advise({
    messages: [{ role: "user", content: requestPrompt(request) }],
    currentProfile: profileFromRequest(request),
  });
  return { plan: legacyPlan(request, result), advisor: result };
}

export async function generateTravelPlan(request: TravelPlanRequest) {
  return (await generateTravelPlanWithAdvisor(request)).plan;
}

export async function answerTravelQuestion(message: string, context?: Record<string, unknown>) {
  const profile = (context?.profile ?? {}) as Partial<TravelProfile>;
  const result = await advise({ messages: [{ role: "user", content: message }], currentProfile: profile });
  return result.message;
}
