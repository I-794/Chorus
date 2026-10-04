import { DEFAULT_PLAN, isPlanId, type PlanId } from "@/config/plans";

type SubscriptionRow = {
  planId: string;
  status: string;
  currentPeriodEnd: Date | null;
};

/**
 * The one place that decides a user's plan. Pure, so it's easy to test.
 * Stripe later only has to keep the `subscriptions` row up to date.
 */
export function resolvePlan(
  sub: SubscriptionRow | undefined,
  now: Date = new Date(),
): PlanId {
  if (!sub) return DEFAULT_PLAN;
  const live = sub.status === "active" || sub.status === "trialing";
  const inPeriod = sub.currentPeriodEnd === null || sub.currentPeriodEnd > now;
  if (live && inPeriod && isPlanId(sub.planId)) return sub.planId;
  return DEFAULT_PLAN;
}
