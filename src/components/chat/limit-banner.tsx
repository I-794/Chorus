"use client";

import { Clock, WarningCircle, X } from "@phosphor-icons/react";
import type { ApiErrorBody } from "@/lib/api-errors";

export type ChatError = { code: string | null; message: string };

/**
 * useChat surfaces a failed request as an Error whose message is the response
 * body, so our JSON error shape can be read back out of it.
 */
export function parseChatError(error: Error): ChatError {
  try {
    const body = JSON.parse(error.message) as ApiErrorBody;
    if (body?.error?.message) return { code: body.error.code, message: body.error.message };
  } catch {
    // Not JSON: an error from inside the stream, or a network failure.
  }
  const offline = error.message.toLowerCase().includes("fetch");
  return {
    code: null,
    message: offline
      ? "Couldn't reach the server. Check your connection and try again."
      : error.message || "Something went wrong. Please try again.",
  };
}

export function LimitBanner({ error, onDismiss }: { error: ChatError; onDismiss: () => void }) {
  const isLimit = error.code === "RATE_LIMITED" || error.code === "DAILY_CAP_REACHED";
  const Icon = isLimit ? Clock : WarningCircle;

  return (
    <div
      role="alert"
      className={`mb-2 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
        isLimit
          ? "border-accent/20 bg-accent-soft text-foreground"
          : "border-danger/20 bg-danger-soft text-danger"
      }`}
    >
      <Icon className={`mt-0.5 size-4 shrink-0 ${isLimit ? "text-accent" : ""}`} aria-hidden />
      <p className="flex-1 leading-relaxed">{error.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 rounded-lg p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
