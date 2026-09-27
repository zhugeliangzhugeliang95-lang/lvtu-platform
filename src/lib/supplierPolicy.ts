export type LicenseFact = { status: string; needsManualReview: boolean; validUntil: Date | string | null };
export type PublicationFact = { status: string; isVerified: boolean; isPublic: boolean; publicContentReady: boolean; licenses: LicenseFact[] };

export function hasCurrentVerifiedLicense(licenses: LicenseFact[], now = new Date()): boolean {
  return licenses.some((license) => license.status === "VALID" && !license.needsManualReview && (!license.validUntil || new Date(license.validUntil) > now));
}

export function canMarkVerified(fact: Pick<PublicationFact, "licenses">, now = new Date()): boolean { return hasCurrentVerifiedLicense(fact.licenses, now); }
export function canMarkActive(fact: Pick<PublicationFact, "isVerified" | "licenses">, now = new Date()): boolean { return fact.isVerified && hasCurrentVerifiedLicense(fact.licenses, now); }
export function canPublishSupplier(fact: Omit<PublicationFact, "isPublic">, now = new Date()): boolean { return fact.status === "ACTIVE" && fact.isVerified && fact.publicContentReady && hasCurrentVerifiedLicense(fact.licenses, now); }
export function isPublicSupplier(fact: PublicationFact, now = new Date()): boolean { return fact.isPublic && canPublishSupplier(fact, now); }

export function supplierIdentitySignals(candidate: { legalEntityName?: string | null; creditCode?: string | null; licenseNumber?: string | null }): string[] {
  return [candidate.legalEntityName?.trim(), candidate.creditCode?.trim(), candidate.licenseNumber?.trim()].filter((value): value is string => Boolean(value));
}

export function candidatesConflict(left: { legalEntityName?: string | null; creditCode?: string | null; licenseNumber?: string | null }, right: { legalEntityName?: string | null; creditCode?: string | null; licenseNumber?: string | null }): boolean {
  const leftSignals = new Set(supplierIdentitySignals(left)); return supplierIdentitySignals(right).some((signal) => leftSignals.has(signal));
}

