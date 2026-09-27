import { redirect } from "next/navigation";

/**
 * Compatibility route for bookmarks from the prototype phase.
 * Plans are now produced inside the real multi-turn advisor instead of a
 * hard-coded result page with unverified pricing.
 */
export default async function LegacyAIPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; prompt?: string }>;
}) {
  const { destination, prompt } = await searchParams;
  const query = new URLSearchParams();
  if (destination) query.set("destination", destination);
  if (prompt) query.set("prompt", prompt);
  redirect(`/ai${query.size ? `?${query.toString()}` : ""}`);
}
