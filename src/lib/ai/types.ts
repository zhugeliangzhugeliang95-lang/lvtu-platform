export type TravelPlanRequest = { prompt: string; destination?: string; days?: number; budget?: number; travelers?: number };
export type TravelPlan = { title: string; summary: string; destination: string; days: number; budget: string; itinerary: { day: number; title: string; details: string[] }[]; reminders: string[] };
export interface TravelAIProvider { plan(request: TravelPlanRequest): Promise<TravelPlan>; chat(message: string, context?: Record<string, unknown>): Promise<string>; }
