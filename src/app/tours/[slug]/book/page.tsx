import { notFound, redirect } from "next/navigation";
import { getPublicTour } from "@/lib/catalog/tours";

export default async function TourBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await getPublicTour(slug);
  if (!tour) notFound();
  redirect(`/request?type=CUSTOM_TRIP&notes=${encodeURIComponent(`${tour.name} 咨询报名`)}`);
}
