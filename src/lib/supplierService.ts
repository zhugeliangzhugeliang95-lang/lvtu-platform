import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { maskLicenseNumber } from "@/lib/supplierSafety";

export function publicSupplierWhere(now = new Date()): Prisma.TravelSupplierWhereInput {
  return {
    status: "ACTIVE",
    isVerified: true,
    isPublic: true,
    publicContentReady: true,
    licenses: { some: { status: "VALID", needsManualReview: false, OR: [{ validUntil: null }, { validUntil: { gt: now } }] } },
  };
}

export type VerifiedSupplierFilters = { fromCity?: string; destination?: string; service?: string; studentGroup?: boolean; limit?: number };

export async function searchVerifiedSuppliers(filters: VerifiedSupplierFilters = {}) {
  const serviceCodes = [filters.service, filters.studentGroup ? "STUDENT" : undefined].filter(Boolean) as string[];
  const where: Prisma.TravelSupplierWhereInput = {
    ...publicSupplierWhere(),
    ...(filters.fromCity ? { OR: [{ city: filters.fromCity }, { services: { some: { code: "NATIONAL", verified: true } } }] } : {}),
    ...(filters.destination ? { destinations: { some: { name: { contains: filters.destination }, verified: true } } } : {}),
    ...(serviceCodes.length ? { services: { some: { code: { in: serviceCodes }, verified: true } } } : {}),
  };
  const rows = await prisma.travelSupplier.findMany({
    where,
    take: Math.min(filters.limit || 10, 20),
    orderBy: [{ lastReviewedAt: "desc" }, { brandName: "asc" }],
    include: {
      services: { where: { verified: true }, orderBy: { name: "asc" } },
      destinations: { where: { verified: true }, orderBy: { name: "asc" } },
      licenses: { where: { status: "VALID", needsManualReview: false }, orderBy: { verifiedAt: "desc" } },
      sources: { where: { manualReviewed: true, isAccessible: true }, orderBy: { queriedAt: "desc" }, take: 5 },
      contacts: { where: { isPublic: true } },
    },
  });
  return rows.map((supplier) => ({
    id: supplier.id,
    slug: supplier.slug,
    brandName: supplier.brandName,
    legalEntityName: supplier.legalEntityName,
    summary: supplier.summary,
    city: supplier.city,
    services: supplier.services.map((item) => ({ code: item.code, name: item.name })),
    destinations: supplier.destinations.map((item) => item.name),
    qualification: supplier.licenses.map((license) => ({ type: license.licenseType, number: maskLicenseNumber(license.licenseNumber), scope: license.businessScope, verifiedAt: license.verifiedAt, validUntil: license.validUntil })),
    sources: supplier.sources.map((source) => ({ title: source.title, url: source.url, confidence: source.confidence, queriedAt: source.queriedAt })),
    lastReviewedAt: supplier.lastReviewedAt,
    informationComplete: supplier.services.length > 0 && supplier.destinations.length > 0 && supplier.sources.length > 0,
    needsManualConfirmation: !supplier.lastReviewedAt || Date.now() - supplier.lastReviewedAt.getTime() > 90 * 86400000,
    contacts: supplier.contacts.map((contact) => ({ type: contact.contactType, label: contact.label, value: contact.value })),
  }));
}

export async function getSupplierServices(id: string) { return prisma.supplierService.findMany({ where: { supplierId: id, verified: true } }); }
export async function getSupplierDestinations(id: string) { return prisma.supplierDestination.findMany({ where: { supplierId: id, verified: true } }); }
export async function getSupplierQualificationSummary(id: string) {
  const supplier = await prisma.travelSupplier.findFirst({ where: { id, ...publicSupplierWhere() }, include: { licenses: { where: { status: "VALID", needsManualReview: false } }, sources: { where: { manualReviewed: true } } } });
  if (!supplier) return null;
  return { supplierId: id, licenses: supplier.licenses.map((license) => ({ type: license.licenseType, number: maskLicenseNumber(license.licenseNumber), scope: license.businessScope, verifiedAt: license.verifiedAt })), sources: supplier.sources, lastReviewedAt: supplier.lastReviewedAt };
}
export const findSuppliersByRequirement = searchVerifiedSuppliers;

