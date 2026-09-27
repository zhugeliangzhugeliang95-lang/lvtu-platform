import { z } from "zod";

export const SUPPLIER_STATUSES = ["DISCOVERED","RESEARCHED","CONTACT_PENDING","CONTACTED","QUALIFICATION_PENDING","VERIFIED","NEGOTIATING","ACTIVE","PAUSED","REJECTED","EXPIRED"] as const;
export const SUPPLIER_TYPES = ["NATIONAL","GBA_LOCAL","DESTINATION_DMC","OVERSEAS_DMC"] as const;

export const supplierListSchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum([...SUPPLIER_STATUSES, "ALL"]).default("ALL"),
  city: z.string().trim().max(50).optional(),
  destination: z.string().trim().max(80).optional(),
  service: z.string().trim().max(50).optional(),
  licenseStatus: z.enum(["ALL","UNVERIFIED","VALID","EXPIRED","SUSPENDED","NOT_FOUND","CONFLICT"]).default("ALL"),
  risk: z.string().trim().max(80).optional(),
  sort: z.enum(["internalScore","updatedAt","lastReviewedAt","nextFollowUpAt"]).default("internalScore"),
  order: z.enum(["asc","desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

export const supplierCreateSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  legalEntityName: z.string().trim().min(1).max(160),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(100),
  supplierType: z.enum(SUPPLIER_TYPES),
  province: z.string().trim().max(50).optional(),
  city: z.string().trim().max(50).optional(),
  website: z.string().url().refine((value) => ["http:", "https:"].includes(new URL(value).protocol)).optional().or(z.literal("")),
  summary: z.string().trim().max(1200).optional(),
});

export const supplierUpdateSchema = z.object({
  status: z.enum(SUPPLIER_STATUSES).optional(),
  summary: z.string().trim().max(1200).nullable().optional(),
  internalScore: z.number().int().min(0).max(100).optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
  publicContentReady: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  confirm: z.literal("CONFIRM").optional(),
  reason: z.string().trim().min(2).max(500).optional(),
}).refine((value) => Object.keys(value).some((key) => !["confirm","reason"].includes(key)), "未提供更新字段");

export const supplierInteractionSchema = z.object({
  contactMethod: z.string().trim().min(1).max(80),
  contactedAt: z.string().datetime(),
  contactPerson: z.string().trim().max(80).optional(),
  channel: z.enum(["PHONE","EMAIL","WECHAT_OFFICIAL","FORM","MEETING","OTHER"]),
  outcome: z.string().trim().min(1).max(1000),
  nextStep: z.string().trim().max(500).optional(),
  followUpAt: z.string().datetime().nullable().optional(),
  internalNote: z.string().trim().max(1000).optional(),
});

export const verifiedSupplierSearchSchema = z.object({
  fromCity: z.string().trim().max(50).optional(),
  destination: z.string().trim().max(80).optional(),
  service: z.string().trim().max(50).optional(),
  studentGroup: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

