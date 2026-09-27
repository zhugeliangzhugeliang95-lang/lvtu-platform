import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { sanitizeCsvCell, assertSafePublicUrl } from "@/lib/supplierSafety";
import { canMarkActive, canMarkVerified, canPublishSupplier, candidatesConflict, hasCurrentVerifiedLicense, isPublicSupplier } from "@/lib/supplierPolicy";
import { searchVerifiedSuppliers } from "@/lib/supplierService";

const future = new Date("2030-01-01T00:00:00.000Z");
const past = new Date("2020-01-01T00:00:00.000Z");
const validLicense = { status: "VALID", needsManualReview: false, validUntil: future };

describe("supplier supply-chain policy", () => {
  it("keeps imported candidates researched and non-public", async () => { const [total, unsafe] = await Promise.all([prisma.travelSupplier.count(), prisma.travelSupplier.count({ where: { OR: [{ status: { not: "RESEARCHED" } }, { isVerified: true }, { isPublic: true }] } })]); expect(total).toBeGreaterThanOrEqual(50); expect(unsafe).toBe(0); });
  it("does not merge equal brands when legal entities differ", () => { expect(candidatesConflict({ legalEntityName: "A公司" }, { legalEntityName: "B公司" })).toBe(false); });
  it("detects a duplicate legal entity", () => { expect(candidatesConflict({ legalEntityName: "A公司" }, { legalEntityName: "A公司" })).toBe(true); });
  it("detects a duplicate license", () => { expect(candidatesConflict({ legalEntityName: "A", licenseNumber: "L-100" }, { legalEntityName: "B", licenseNumber: "L-100" })).toBe(true); });
  it("requires a manually reviewed license for verification", () => { expect(canMarkVerified({ licenses: [{ ...validLicense, needsManualReview: true }] })).toBe(false); expect(canMarkVerified({ licenses: [validLicense] })).toBe(true); });
  it("prevents unverified suppliers from becoming active", () => { expect(canMarkActive({ isVerified: false, licenses: [validLicense] })).toBe(false); });
  it("rejects expired licenses", () => { expect(hasCurrentVerifiedLicense([{ ...validLicense, validUntil: past }], new Date("2026-08-15"))).toBe(false); });
  it("publishes only active verified content with a current license", () => { expect(canPublishSupplier({ status: "ACTIVE", isVerified: true, publicContentReady: true, licenses: [validLicense] })).toBe(true); expect(canPublishSupplier({ status: "RESEARCHED", isVerified: true, publicContentReady: true, licenses: [validLicense] })).toBe(false); });
  it("requires isPublic in addition to publication eligibility", () => { expect(isPublicSupplier({ status: "ACTIVE", isVerified: true, isPublic: false, publicContentReady: true, licenses: [validLicense] })).toBe(false); });
  it("keeps every imported source traceable", async () => { const suppliers = await prisma.travelSupplier.findMany({ select: { sources: { select: { url: true, fields: true } } } }); expect(suppliers.every((supplier) => supplier.sources.length > 0 && supplier.sources.every((source) => source.url.startsWith("http") && source.fields.length > 0))).toBe(true); });
  it("does not return researched candidates to AI", async () => { const result = await searchVerifiedSuppliers({ limit: 20 }); expect(result).toEqual([]); });
  it("never returns mock prices from the supplier AI service", async () => { const result = await searchVerifiedSuppliers({ limit: 20 }); expect(JSON.stringify(result)).not.toMatch(/price|quote|inventory/i); });
  it("guards spreadsheet formulas", () => { expect(sanitizeCsvCell("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")"); expect(sanitizeCsvCell("normal")).toBe("normal"); });
  it("rejects non-http source protocols", () => { expect(() => assertSafePublicUrl("javascript:alert(1)")).toThrow(); expect(assertSafePublicUrl("https://example.com/source")).toBe("https://example.com/source"); });
});

