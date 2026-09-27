import { homeTravelData } from "@/data/mock/homeTravel";
import type { Destination, HomeTravelData, Hotel, TravelPlan } from "@/lib/types/travel";
import { getPublicTours } from "@/lib/catalog/tours";

export async function getFeaturedHotels(): Promise<Hotel[]> {
  return [homeTravelData.featuredHotel];
}

export async function getTravelPlans(): Promise<TravelPlan[]> {
  const tours = await getPublicTours();
  return tours.slice(0, 6).map((tour) => ({
    id: tour.slug,
    href: `/tours/${tour.slug}`,
    title: tour.name,
    destination: tour.destination,
    image: tour.image,
    days: `${tour.days}天`,
    audience: tour.audience,
    highlights: tour.tags,
    estimatedPrice: tour.price,
    priceUnit: "参考价 / 人起",
  }));
}

export async function getPopularDestinations(): Promise<Destination[]> {
  return homeTravelData.destinations;
}

export async function getHomeTravelData(): Promise<HomeTravelData> {
  const [hotels, featuredPlans, destinations] = await Promise.all([
    getFeaturedHotels(),
    getTravelPlans(),
    getPopularDestinations(),
  ]);

  return {
    ...homeTravelData,
    featuredHotel: hotels[0],
    featuredPlans,
    destinations,
  };
}
