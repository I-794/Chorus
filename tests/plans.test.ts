import { describe, expect, it } from "vitest";
import { canUseModel, getModel, MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";
import { resolvePlan } from "@/lib/limits/plan";
import { nextUtcMidnight, utcDay } from "@/lib/limits/time";

const now = new Date("2026-10-04T12:00:00Z");

describe("resolvePlan", () => {
  it("defaults to free with no subscription", () => {
    expect(resolvePlan(undefined, now)).toBe("free");
  });

  it("uses an active subscription", () => {
    expect(
      resolvePlan({ planId: "pro", status: "active", currentPeriodEnd: null }, now),
    ).toBe("pro");
  });

  it("falls back to free when canceled, expired, or unknown", () => {
    const past = new Date("2026-10-01T00:00:00Z");
    expect(resolvePlan({ planId: "pro", status: "canceled", currentPeriodEnd: null }, now)).toBe("free");
    expect(resolvePlan({ planId: "pro", status: "active", currentPeriodEnd: past }, now)).toBe("free");
    expect(resolvePlan({ planId: "gold", status: "active", currentPeriodEnd: null }, now)).toBe("free");
  });
});

describe("model access", () => {
  it("free users can't use Pro-only models", () => {
    expect(canUseModel(getModel("anthropic/claude-sonnet-5.5")!, "free")).toBe(false);
    expect(canUseModel(getModel("anthropic/claude-sonnet-5.5")!, "pro")).toBe(true);
  });

  it("pro can use every model", () => {
    for (const m of MODELS) expect(canUseModel(m, "pro")).toBe(true);
  });

  it("a single max-length reply always fits inside the free daily cap", () => {
    for (const m of MODELS.filter((m) => canUseModel(m, "free"))) {
      const maxReply = PLANS.free.maxOutputTokens * m.outputPricePerM;
      expect(maxReply).toBeLessThan(PLANS.free.dailyCostCapMicros);
    }
  });
});

describe("UTC day helpers", () => {
  it("uses the UTC date, not local time", () => {
    expect(utcDay(new Date("2026-10-04T23:30:00-05:00"))).toBe("2026-10-05");
  });

  it("resets at the next UTC midnight", () => {
    expect(nextUtcMidnight(now).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });
});
