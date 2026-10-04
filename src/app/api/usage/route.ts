import { PLANS } from "@/config/plans";
import { getDailyUsage, getUserPlan } from "@/db/queries/usage";
import { handle } from "@/lib/api-errors";
import type { UsageResponse } from "@/lib/chat-types";
import { requireUserId } from "@/lib/auth";
import { nextUtcMidnight, utcDay } from "@/lib/limits/time";

export const GET = handle(async () => {
  const userId = await requireUserId();
  const planId = await getUserPlan(userId);
  const plan = PLANS[planId];
  const usage = await getDailyUsage(userId, utcDay());
  return Response.json({
    plan: { id: planId, name: plan.name },
    today: {
      costMicros: usage.costMicros,
      capMicros: plan.dailyCostCapMicros,
      messageCount: usage.messageCount,
    },
    messagesPerMinute: plan.messagesPerMinute,
    resetsAt: nextUtcMidnight().toISOString(),
  } satisfies UsageResponse);
});
