import type { TravelAIProvider, TravelPlan, TravelPlanRequest } from "./types";

/** Deterministic fallback keeps the UI useful when no model key is configured. */
export class MockTravelAIProvider implements TravelAIProvider {
  async plan(request: TravelPlanRequest): Promise<TravelPlan> { const destination = request.destination || "三亚"; const days = request.days || 5; return { title: `${destination}${days}天轻松旅行`, summary: "根据时间、预算与节奏生成的初步建议，价格和库存需顾问进一步确认。", destination, days, budget: request.budget ? `约 ¥${request.budget}` : "预算待确认", itinerary: Array.from({ length: days }, (_, i) => ({ day: i + 1, title: i === 0 ? "抵达与入住" : i === days - 1 ? "返程" : "当地慢游", details: ["预留交通缓冲时间", "按兴趣选择 1-2 个重点体验"] })), reminders: ["节假日价格与房态会变化", "证件、退改和预约规则以确认单为准"] }; }
  async chat(message: string): Promise<string> { return `我已记下你的需求：“${message}”。可以继续告诉我出发地、日期、人数和预算，我会把路线、酒店与交通一起安排。`; }
}

export function getTravelAIProvider(): TravelAIProvider { return new MockTravelAIProvider(); }
