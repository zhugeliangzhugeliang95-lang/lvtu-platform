import { SupportForm } from "./ui";

export default async function NewSupportPage({ searchParams }: { searchParams: Promise<{ type?: string; orderId?: string }> }) {
  const { type, orderId } = await searchParams;
  return <SupportForm initialType={type} initialOrderNo={orderId} />;
}
