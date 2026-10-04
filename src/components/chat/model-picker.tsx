"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, Check, Lock } from "@phosphor-icons/react";
import { canUseModel, MODELS, type ModelId } from "@/config/models";
import type { PlanId } from "@/config/plans";

const price = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function ModelPicker({
  value,
  onChange,
  plan,
}: {
  value: ModelId;
  onChange: (id: ModelId) => void;
  plan: PlanId;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = MODELS.find((m) => m.id === value) ?? MODELS[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-foreground/80 transition-[background-color,color,transform] hover:bg-muted hover:text-foreground active:scale-[0.98]"
      >
        {current.name}
        <CaretDown
          className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Model"
          className="absolute bottom-full left-0 z-30 mb-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card p-1.5 shadow-lg"
        >
          {MODELS.map((m) => {
            const allowed = canUseModel(m, plan);
            const selected = m.id === value;
            return (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={selected}
                aria-disabled={!allowed}
                disabled={!allowed}
                onClick={() => {
                  onChange(m.id);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {m.name}
                    {!allowed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-1.5 py-px text-[10px] font-semibold text-accent">
                        <Lock className="size-2.5" weight="bold" aria-hidden />
                        Pro
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                    {m.provider} · {price(m.inputPricePerM)} in / {price(m.outputPricePerM)} out per 1M
                  </span>
                </span>
                {selected && <Check className="mt-0.5 size-4 text-accent" weight="bold" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
