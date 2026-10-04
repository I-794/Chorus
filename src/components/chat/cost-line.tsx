import { getModel } from "@/config/models";
import type { ChatMessageMetadata } from "@/lib/chat-types";
import { formatUsd } from "@/lib/cost";

const n = new Intl.NumberFormat("en-US");

/** "Claude Haiku 4.5 · 1,204 in · 380 out · ≈ $0.0031" under each reply. */
export function CostLine({ metadata }: { metadata: ChatMessageMetadata }) {
  const modelName = getModel(metadata.modelId)?.name ?? metadata.modelId;
  return (
    <p
      className="mt-2 flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] text-muted-foreground tabular-nums"
      title="Estimated from token counts and list prices"
    >
      <span>{modelName}</span>
      <Dot />
      <span>{n.format(metadata.inputTokens)} in</span>
      <Dot />
      <span>{n.format(metadata.outputTokens)} out</span>
      <Dot />
      <span className="text-foreground/70">≈ {formatUsd(metadata.costMicros)}</span>
    </p>
  );
}

function Dot() {
  return <span aria-hidden className="text-border">·</span>;
}
