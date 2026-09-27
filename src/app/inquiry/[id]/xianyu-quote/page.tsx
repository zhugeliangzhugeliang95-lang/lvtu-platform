import { redirect } from "next/navigation";

export default async function LegacyChannelQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/inquiry/${id}/success`);
}
