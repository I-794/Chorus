"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import type { ModelId } from "@/config/models";
import type { PlanId } from "@/config/plans";
import { MAX_MESSAGE_CHARS } from "@/lib/validation";
import { ModelPicker } from "./model-picker";

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  modelId,
  onModelChange,
  plan,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  busy: boolean;
  modelId: ModelId;
  onModelChange: (id: ModelId) => void;
  plan: PlanId;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const tooLong = value.length > MAX_MESSAGE_CHARS;
  const canSend = !busy && value.trim().length > 0 && !tooLong;

  // Grow with the text, up to a limit.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  useEffect(() => ref.current?.focus(), []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit();
      }}
      className="rounded-2xl border border-border bg-card shadow-sm transition-colors focus-within:border-foreground/25"
    >
      <label htmlFor="composer" className="sr-only">
        Message
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        placeholder="Ask anything"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSubmit();
          }
        }}
        className="block max-h-60 w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-relaxed placeholder:text-muted-foreground/70 focus:outline-none focus-visible:outline-none"
      />
      <div className="flex items-center justify-between gap-2 px-2 pb-2">
        <ModelPicker value={modelId} onChange={onModelChange} plan={plan} />
        <div className="flex items-center gap-3">
          {value.length > MAX_MESSAGE_CHARS * 0.8 && (
            <span
              className={`font-mono text-[11px] tabular-nums ${tooLong ? "text-danger" : "text-muted-foreground"}`}
            >
              {value.length.toLocaleString()} / {MAX_MESSAGE_CHARS.toLocaleString()}
            </span>
          )}
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-85"
            >
              <Square className="size-3 fill-current" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              aria-label="Send message"
              className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-25"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
