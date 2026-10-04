// The single source of truth for which models Chorus offers.
// Client-safe: no secrets here. Prices are USD per 1M tokens and must match
// https://vercel.com/ai-gateway/models (checked 2026-10-04).

import type { PlanId } from "./plans";

export type ModelConfig = {
  /** AI Gateway model id, passed straight to streamText. */
  id: string;
  name: string;
  provider: string;
  inputPricePerM: number;
  outputPricePerM: number;
  plans: readonly PlanId[];
};

export const MODELS = [
  {
    id: "openai/gpt-5-mini",
    name: "GPT-5 mini",
    provider: "OpenAI",
    inputPricePerM: 0.25,
    outputPricePerM: 2,
    plans: ["free", "pro"],
  },
  {
    id: "google/gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "Google",
    inputPricePerM: 0.3,
    outputPricePerM: 2.5,
    plans: ["free", "pro"],
  },
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    inputPricePerM: 1,
    outputPricePerM: 5,
    plans: ["free", "pro"],
  },
  {
    id: "anthropic/claude-sonnet-5.5",
    name: "Claude Sonnet 5.5",
    provider: "Anthropic",
    inputPricePerM: 2,
    outputPricePerM: 10,
    plans: ["pro"],
  },
] as const satisfies readonly ModelConfig[];

export type ModelId = (typeof MODELS)[number]["id"];

export const MODEL_IDS = MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];

export const DEFAULT_MODEL_ID: ModelId = "openai/gpt-5-mini";

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id);
}

export function canUseModel(model: ModelConfig, plan: PlanId): boolean {
  return model.plans.includes(plan);
}
