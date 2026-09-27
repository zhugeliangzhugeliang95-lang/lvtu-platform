import { z } from "zod";

const cleanText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));

const inquiryBaseSchema = z.object({
  destination: cleanText(120),
  checkInDate: date.optional(),
  checkOutDate: date.optional(),
  nights: z.number().int().min(1).max(90).optional(),
  roomCount: z.number().int().min(1).max(20).default(1),
  guestCount: z.number().int().min(1).max(100).default(2),
  budget: optionalText(80),
  hotelPreference: optionalText(300),
  breakfastIncluded: z.boolean().nullable().optional(),
  cancellable: z.boolean().nullable().optional(),
  needInvoice: z.boolean().optional().default(false),
  notes: optionalText(2000),
  rawInput: optionalText(2000),
}).strict();

function validateDateOrder(data: { checkInDate?: string; checkOutDate?: string }, context: z.RefinementCtx) {
  if (data.checkInDate && data.checkOutDate && data.checkOutDate <= data.checkInDate) {
    context.addIssue({ code: "custom", path: ["checkOutDate"], message: "退房日期必须晚于入住日期" });
  }
}

export const inquiryCreateSchema = inquiryBaseSchema.superRefine(validateDateOrder);

export const inquiryUpdateSchema = inquiryBaseSchema.partial().extend({
  rawInput: optionalText(2000),
}).strict().superRefine(validateDateOrder);

export const inquiryContactSchema = z.object({
  contactName: cleanText(40),
  contactPhone: z.string().trim().regex(/^1[3-9]\d{9}$/),
}).strict();
