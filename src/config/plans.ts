// Plan limits. Client-safe.
// When Stripe is added, give each paid plan a `stripePriceId` and have the
// webhook write rows to the `subscriptions` table. Nothing else changes.

export type PlanId = "free" | "pro";

export type PlanLimits = {
  name: string;
  /** Hard daily spend cap in micro-dollars (1 USD = 1_000_000). Resets 00:00 UTC. */
  dailyCostCapMicros: number;
  messagesPerMinute: number;
  /** Upper bound on reply length; also bounds the worst-case cost of one reply. */
  maxOutputTokens: number;
  /** How many earlier messages are sent to the model as context. */
  maxHistoryMessages: number;
};

export const PLANS = {
  free: {
    name: "Free",
    dailyCostCapMicros: 250_000, // $0.25
    messagesPerMinute: 10,
    maxOutputTokens: 2_048,
    maxHistoryMessages: 20,
  },
  pro: {
    name: "Pro",
    dailyCostCapMicros: 2_000_000, // $2.00
    messagesPerMinute: 30,
    maxOutputTokens: 8_192,
    maxHistoryMessages: 40,
  },
} as const satisfies Record<PlanId, PlanLimits>;

export const DEFAULT_PLAN: PlanId = "free";

export function isPlanId(value: string): value is PlanId {
  return Object.hasOwn(PLANS, value);
}
