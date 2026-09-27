import { redirect } from "next/navigation";

const serviceMap: Record<string, string> = {
  hotel: "hotel",
  flight: "flight",
  rail: "train",
  package: "ticket",
  pickup: "transfer",
  concierge: "combo",
};

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/inquiry?service=${serviceMap[slug] || "combo"}`);
}
