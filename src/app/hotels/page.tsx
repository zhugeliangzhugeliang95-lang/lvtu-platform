import { redirect } from "next/navigation";

export default async function HotelsPage({ searchParams }: { searchParams: Promise<{ city?: string; q?: string }> }) {
  const { city, q } = await searchParams;
  const subject = [city, q].filter(Boolean).join(" · ");
  redirect(`/inquiry?service=hotel${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`);
}
