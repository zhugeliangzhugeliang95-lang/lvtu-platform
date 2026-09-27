import { redirect } from "next/navigation";

export default async function AgencyListPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  const subject = typeof destination === "string" ? `${destination.trim().slice(0, 40)}旅行服务` : "旅行服务机构咨询";
  redirect(`/inquiry?service=combo&subject=${encodeURIComponent(subject)}`);
}
