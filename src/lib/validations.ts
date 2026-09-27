import { z } from "zod";

/* =============================================================================
 * 旅途酒店 CRM · 共享数据校验
 * 提供两套：
 *  - hotelLeadSubmitSchema：公开 /api/leads 提交
 *  - hotelLeadUpdateSchema：后台 PATCH /api/admin/leads/:id
 * ============================================================================*/

// ─── 字面量集合（供前端复用，单一信息源） ────────────────────────────────────
export const HOTEL_ROOM_OPTIONS = ["1间", "2间", "3间", "4间及以上"] as const;
export const HOTEL_GUEST_OPTIONS = ["1人", "2人", "3-4人", "5人及以上"] as const;
export const HOTEL_BUDGET_OPTIONS = [
  "300元以内/晚",
  "300-500元/晚",
  "500-800元/晚",
  "800-1500元/晚",
  "1500元以上/晚",
  "先看看报价",
] as const;
export const HOTEL_PREFERENCE_OPTIONS = [
  "价格优先",
  "位置方便",
  "近地铁",
  "含早餐",
  "亲子友好",
  "海景房",
  "高星酒店",
  "民宿公寓",
  "可取消",
  "不确定，客服推荐",
] as const;
// 轻量问卷：大概什么时候出发
export const TRAVEL_TIMEFRAME_OPTIONS = [
  "一周内出发",
  "一个月内",
  "1-3 个月内",
  "3 个月以上",
  "还没确定",
] as const;
export const INQUIRY_TYPES = ["INTENT", "HOTEL"] as const;
export const CONTACT_TYPES = ["WECHAT", "MOBILE"] as const;
export const HOTEL_LEAD_STATUSES = [
  "NEW",
  "ADDED",
  "CONTACTED",
  "QUOTED",
  "DEAL",
  "LOST",
  "INVALID",
] as const;
export type HotelLeadStatusValue = (typeof HOTEL_LEAD_STATUSES)[number];

// ─── 公共 ISO 日期校验（前端 input[type=date] 输出 YYYY-MM-DD） ────────────
const dateString = z
  .string()
  .min(1, "请选择日期")
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "日期格式不正确" })
  .refine((v) => {
    const d = new Date(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    return d >= today && d <= maxDate;
  }, { message: "日期超出合理范围，请重新选择" });

// ─── 通用字段 ────────────────────────────────────────────────────────────────
const commonLeadFields = {
  destination: z.string().trim().min(1, "请填写目的地").max(50, "目的地最多 50 字"),
  guestCount: z.enum(HOTEL_GUEST_OPTIONS),
  contactType: z.enum(CONTACT_TYPES),
  contactValue: z
    .string()
    .trim()
    .min(3, "联系方式至少 3 位")
    .max(50, "联系方式最多 50 位"),
  remark: z.string().trim().max(500, "备注最多 500 字").optional().default(""),
  // 来源追踪
  source: z.string().max(50).optional(),
  utmSource: z.string().max(80).optional(),
  utmMedium: z.string().max(80).optional(),
  utmCampaign: z.string().max(80).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
  // honeypot：机器人会填，路由里软屏蔽
  website: z.string().optional(),
};

const contactRefinement = (v: {
  contactType: "WECHAT" | "MOBILE";
  contactValue: string;
}) => {
  if (v.contactType === "MOBILE") return /^1[3-9]\d{9}$/.test(v.contactValue);
  return v.contactValue.length >= 3;
};

// ─── 公开提交 · 轻量出行意向（首屏 Hero） ───────────────────────────────────
export const intentLeadSubmitSchema = z
  .object({
    inquiryType: z.literal("INTENT"),
    timeframe: z.enum(TRAVEL_TIMEFRAME_OPTIONS),
    ...commonLeadFields,
  })
  .refine(contactRefinement, {
    message: "手机号格式不正确",
    path: ["contactValue"],
  });

// ─── 公开提交 · 详细酒店询价（酒店板块） ────────────────────────────────────
export const hotelLeadSubmitSchema = z
  .object({
    inquiryType: z.literal("HOTEL").default("HOTEL"),
    checkInDate: dateString,
    checkOutDate: dateString,
    roomCount: z.enum(HOTEL_ROOM_OPTIONS),
    budget: z.enum(HOTEL_BUDGET_OPTIONS),
    preferences: z
      .array(z.enum(HOTEL_PREFERENCE_OPTIONS))
      .max(10, "最多选择 10 个偏好")
      .optional()
      .default([]),
    ...commonLeadFields,
  })
  .refine(
    (v) => new Date(v.checkOutDate).getTime() > new Date(v.checkInDate).getTime(),
    { message: "离店日期必须晚于入住日期", path: ["checkOutDate"] }
  )
  .refine(contactRefinement, {
    message: "手机号格式不正确",
    path: ["contactValue"],
  });

// 判别式联合（路由里根据 inquiryType 分流）
export const anyLeadSubmitSchema = z.discriminatedUnion("inquiryType", [
  hotelLeadSubmitSchema,
  intentLeadSubmitSchema,
]);

export type IntentLeadSubmitInput = z.infer<typeof intentLeadSubmitSchema>;
export type HotelLeadSubmitInput = z.infer<typeof hotelLeadSubmitSchema>;
export type AnyLeadSubmitInput = z.infer<typeof anyLeadSubmitSchema>;

// ─── 后台更新 schema ─────────────────────────────────────────────────────────
export const hotelLeadUpdateSchema = z
  .object({
    status: z.enum(HOTEL_LEAD_STATUSES).optional(),
    assignedToId: z.string().nullable().optional(),
    dealAmount: z.number().int().nonnegative().nullable().optional(), // 单位：分
    dealRemark: z.string().max(500).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "未提供任何更新字段" });

export type HotelLeadUpdateInput = z.infer<typeof hotelLeadUpdateSchema>;

// ─── 跟进备注 ────────────────────────────────────────────────────────────────
export const hotelLeadNoteSchema = z.object({
  content: z.string().trim().min(1, "请输入备注内容").max(1000, "备注最多 1000 字"),
});

// ─── 后台登录 ────────────────────────────────────────────────────────────────
export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, "请输入账号").max(40),
  password: z.string().min(1, "请输入密码").max(100),
});

// ─── 客服账号管理 ────────────────────────────────────────────────────────────
export const staffCreateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "账号至少 3 位")
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/, "账号只能包含字母、数字、下划线和短横线"),
  password: z.string().min(8, "密码至少 8 位").max(100),
  realName: z.string().trim().min(1, "请输入姓名").max(40),
  mobile: z.string().trim().max(20).optional().default(""),
  role: z.enum(["SUPER_ADMIN", "OPS", "SUPPORT", "ORDER", "CONTENT"]).default("SUPPORT"),
});

export const staffUpdateSchema = z.object({
  realName: z.string().trim().min(1).max(40).optional(),
  mobile: z.string().trim().max(20).optional(),
  role: z.enum(["SUPER_ADMIN", "OPS", "SUPPORT", "ORDER", "CONTENT"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
  password: z.string().min(8).max(100).optional(),
});

// ─── 系统设置 ────────────────────────────────────────────────────────────────
export const settingsUpdateSchema = z.record(z.string(), z.string().max(2000));

// ─── 列表查询 ────────────────────────────────────────────────────────────────
export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([...HOTEL_LEAD_STATUSES, "ALL"]).optional(),
  destination: z.string().max(50).optional(),
  budget: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
  assignedToId: z.string().max(50).optional(),
  q: z.string().max(80).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(["createdAt", "updatedAt", "lastFollowedAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ─── 错误格式化（zod → API JSON） ────────────────────────────────────────────
export function formatZodError(error: z.ZodError) {
  const issues = error.issues.map((i) => ({
    path: i.path.join("."),
    message: i.message,
  }));
  return {
    error: "VALIDATION_ERROR",
    message: issues[0]?.message || "参数校验失败",
    issues,
  };
}
