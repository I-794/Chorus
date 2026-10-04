"use client";

import { memo } from "react";
import { Markdown } from "@/components/markdown/markdown";
import type { ChatMessage } from "@/lib/chat-types";
import { CostLine } from "./cost-line";

function textOf(message: ChatMessage) {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export const Message = memo(function Message({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming: boolean;
}) {
  const text = textOf(message);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-[15px] leading-relaxed">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="text-[15px] leading-relaxed">
      {text ? (
        <Markdown text={text} streaming={streaming} />
      ) : (
        streaming && <ThinkingDots />
      )}
      {!streaming && message.metadata && <CostLine metadata={message.metadata} />}
    </div>
  );
});

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 py-2" aria-label="Thinking">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
