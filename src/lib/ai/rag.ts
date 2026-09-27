export type TravelKnowledge = { title: string; content: string; destination?: string; sourceType: "PLATFORM" | "OFFICIAL" | "AI_ORGANIZED" };
export function retrieveTravelKnowledge(_query: string, knowledge: TravelKnowledge[]) { return knowledge.slice(0, 5); }
