// Pure money math. All amounts are integer micro-dollars (1 USD = 1_000_000).
// Useful identity: tokens × (USD per 1M tokens) = micro-dollars.

type Prices = { inputPricePerM: number; outputPricePerM: number };

export function computeCostMicros(
  model: Prices,
  inputTokens: number,
  outputTokens: number,
): number {
  return Math.ceil(
    inputTokens * model.inputPricePerM + outputTokens * model.outputPricePerM,
  );
}

/**
 * Deliberately high token estimate for text we haven't sent yet.
 * Real tokenizers average ~4 chars/token for English; 3 leaves headroom.
 */
export function estimateInputTokens(totalChars: number): number {
  return Math.ceil(totalChars / 3);
}

/** The most a single reply could cost: used to reserve budget up front. */
export function worstCaseCostMicros(
  model: Prices,
  totalInputChars: number,
  maxOutputTokens: number,
): number {
  return computeCostMicros(
    model,
    estimateInputTokens(totalInputChars),
    maxOutputTokens,
  );
}

export function formatUsd(micros: number): string {
  const usd = micros / 1_000_000;
  if (usd === 0) return "$0.00";
  if (usd < 0.0001) return "<$0.0001";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}
