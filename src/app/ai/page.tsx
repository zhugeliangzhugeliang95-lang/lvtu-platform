import { AIPlannerExperience } from "@/components/app/AIPlannerExperience";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI旅行顾问",
  description: "像咨询真人旅行顾问一样，获得目的地推荐、路线规划和酒店区域建议。",
};

export default async function AIPage({ searchParams }: { searchParams: Promise<{ destination?: string; prompt?: string }> }) {
  const { destination, prompt } = await searchParams;
  return <AIPlannerExperience initialDestination={destination} initialPrompt={prompt} />;
}
