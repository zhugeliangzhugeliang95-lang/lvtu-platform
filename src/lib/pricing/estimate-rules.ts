import type { EstimateRuleInput } from "./types";

type RuleCandidate = EstimateRuleInput & {
  destination?: string | null;
  category?: string | null;
  validFrom?: Date | null;
  validTo?: Date | null;
};

export function selectEstimateRule(
  rules: RuleCandidate[],
  input: { destination?: string | null; category?: string | null },
  now = new Date(),
) {
  const destination = input.destination?.trim().toLowerCase() || "";
  const category = input.category?.trim().toLowerCase() || "";
  return rules
    .filter((rule) => (!rule.validFrom || rule.validFrom <= now) && (!rule.validTo || rule.validTo > now))
    .map((rule) => {
      let score = 0;
      if (rule.destination) {
        if (!destination.includes(rule.destination.toLowerCase())) return null;
        score += 4;
      }
      if (rule.category) {
        if (category !== rule.category.toLowerCase()) return null;
        score += 2;
      }
      return { rule, score };
    })
    .filter((item): item is { rule: RuleCandidate; score: number } => Boolean(item))
    .sort((a, b) => b.score - a.score)[0]?.rule ?? null;
}
