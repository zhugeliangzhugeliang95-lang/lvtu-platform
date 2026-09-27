import { NextResponse } from "next/server";
import { z } from "zod";

import { generateTravelPlanWithAdvisor } from "@/lib/ai/router";
import { enforceRateLimit } from "@/lib/rateLimit";
import { readLimitedJson, requireTrustedOrigin, validationError } from "@/lib/security/request";

const requestSchema = z.object({
  prompt: z.string().trim().min(2).max(2_000),
  destination: z.string().trim().min(2).max(80).optional(),
  days: z.coerce.number().int().min(1).max(30).optional(),
  budget: z.coerce.number().int().positive().max(10_000_000).optional(),
  travelers: z.coerce.number().int().min(1).max(999).optional(),
});

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;
  const limited = enforceRateLimit(request, "ai:legacy-plan", { limit: 20, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const json = await readLimitedJson(request, 24 * 1024);
  if (!json.ok) return json.response;
  const parsed = requestSchema.safeParse(json.data);
  if (!parsed.success) return validationError();

  try {
    const { plan, advisor } = await generateTravelPlanWithAdvisor(parsed.data);
    return NextResponse.json(
      {
        ok: true,
        plan,
        advisor: {
          task: advisor.task,
          model: advisor.model,
          sourceIds: advisor.sourceIds,
          handoffSuggested: advisor.handoffSuggested,
        },
        deprecated: true,
        canonicalEndpoint: "/api/ai/advisor",
      },
      { headers: { Deprecation: "true", Link: '</api/ai/advisor>; rel="successor-version"' } },
    );
  } catch (error) {
    console.error("[Legacy AI plan]", error);
    return NextResponse.json(
      { ok: false, error: { code: "AI_PLAN_FAILED", message: "暂时无法生成方案，请稍后重试" } },
      { status: 500 },
    );
  }
}
