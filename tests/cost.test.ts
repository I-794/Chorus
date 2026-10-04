import { describe, expect, it } from "vitest";
import { getModel } from "@/config/models";
import {
  computeCostMicros,
  estimateInputTokens,
  formatUsd,
  worstCaseCostMicros,
} from "@/lib/cost";

const haiku = { inputPricePerM: 1, outputPricePerM: 5 };

describe("computeCostMicros", () => {
  it("is tokens × price-per-million, in micro-dollars", () => {
    // 1,000 in × $1/M + 500 out × $5/M = $0.001 + $0.0025 = 3,500 µ$
    expect(computeCostMicros(haiku, 1_000, 500)).toBe(3_500);
  });

  it("rounds fractional micro-dollars up", () => {
    const cheap = { inputPricePerM: 0.25, outputPricePerM: 2 };
    expect(computeCostMicros(cheap, 1, 0)).toBe(1);
  });

  it("is zero for zero tokens", () => {
    expect(computeCostMicros(haiku, 0, 0)).toBe(0);
  });
});

describe("worstCaseCostMicros", () => {
  it("assumes the full output budget is used", () => {
    // 300 chars → 100 tokens; 100 × 1 + 2048 × 5
    expect(worstCaseCostMicros(haiku, 300, 2_048)).toBe(100 + 10_240);
  });

  it("is never below the real cost for typical English", () => {
    const text = "The quick brown fox jumps over the lazy dog. ".repeat(20);
    const realTokens = Math.ceil(text.length / 4);
    expect(estimateInputTokens(text.length)).toBeGreaterThan(realTokens);
  });
});

describe("formatUsd", () => {
  it.each([
    [0, "$0.00"],
    [50, "<$0.0001"],
    [1_234, "$0.0012"],
    [250_000, "$0.25"],
    [2_000_000, "$2.00"],
  ])("%i µ$ → %s", (micros, expected) => {
    expect(formatUsd(micros)).toBe(expected);
  });
});

describe("model config", () => {
  it("every model has positive prices and at least one plan", () => {
    const ids = ["openai/gpt-5-mini", "anthropic/claude-sonnet-5.5"];
    for (const id of ids) {
      const m = getModel(id)!;
      expect(m.inputPricePerM).toBeGreaterThan(0);
      expect(m.outputPricePerM).toBeGreaterThan(0);
      expect(m.plans.length).toBeGreaterThan(0);
    }
  });
});
