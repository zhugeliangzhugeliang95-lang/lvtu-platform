import { NextResponse } from "next/server";

import { getPublicTours } from "@/lib/catalog/tours";

export async function GET() {
  const tours = await getPublicTours();
  return NextResponse.json({
    tours: tours.slice(0, 8).map((tour) => ({
      slug: tour.slug,
      name: tour.name,
      destination: tour.destination,
      days: tour.days,
      type: tour.type,
      tags: tour.tags,
      image: tour.image,
      price: tour.price,
      priceState: tour.priceState,
      summary: tour.summary,
    })),
  });
}
