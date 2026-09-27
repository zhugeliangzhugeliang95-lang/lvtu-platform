import { redirect } from "next/navigation";

export default async function TrainsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const fromValue = typeof from === "string" ? from.trim().slice(0, 40) : "";
  const toValue = typeof to === "string" ? to.trim().slice(0, 40) : "";
  redirect(`/inquiry?service=train${fromValue ? `&from=${encodeURIComponent(fromValue)}` : ""}${toValue ? `&to=${encodeURIComponent(toValue)}` : ""}`);
}
