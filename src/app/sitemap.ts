import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/siteUrl";

const publicRoutes = ["", "/explore", "/discover", "/hotels", "/flights", "/trains", "/activities", "/packages", "/services", "/tours", "/destinations", "/guides", "/membership", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const now = new Date();
  let tours: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    tours = await prisma.tourProduct.findMany({ where: { status: "ONLINE", NOT: { summary: { contains: "开发测试" } } }, select: { slug: true, updatedAt: true } });
  } catch (error) {
    console.error("Failed to load tours for sitemap", error);
  }
  return [
    ...publicRoutes.map((route, index) => ({ url: `${site}${route}`, lastModified: now, changeFrequency: (index === 0 ? "daily" : "weekly") as "daily" | "weekly", priority: index === 0 ? 1 : route === "/tours" ? 0.9 : 0.7 })),
    ...tours.map((tour) => ({ url: `${site}/tours/${tour.slug}`, lastModified: tour.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
