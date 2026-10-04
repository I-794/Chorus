import { getModel } from "@/config/models";
import type { ChatMessageMetadata } from "@/lib/chat-types";
import { formatUsd } from "@/lib/cost";

const n = new Intl.NumberFormat("en-US");

/** Under each reply: which model answered, how many tokens, and what it cost. */
export function CostLine({ metadata }: { metadata: ChatMessageMetadata }) {
  const modelName = getModel(metadata.modelId)?.name ?? metadata.modelId;
  return (
    <p
      className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground"
      title="Estimated from token counts and list prices"
    >
      <span className="font-medium text-foreground/75">{modelName}</span>
      <span className="font-mono tabular-nums">
        {n.format(metadata.inputTokens)} in / {n.format(metadata.outputTokens)} out
      </span>
      <span className="font-mono tabular-nums text-foreground/75">
        ≈ {formatUsd(metadata.costMicros)}
      </span>
    </p>
  );
}
