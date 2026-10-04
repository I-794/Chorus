"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, List } from "@phosphor-icons/react";
import { useAppState } from "@/components/app-state";
import { useOpenMobileNav } from "@/components/sidebar/app-shell";
import { canUseModel, DEFAULT_MODEL_ID, getModel, type ModelId } from "@/config/models";
import type { ChatMessage } from "@/lib/chat-types";
import { titleFromMessage } from "@/lib/validation";
import { Composer } from "./composer";
import { LimitBanner, parseChatError, type ChatError } from "./limit-banner";
import { Message } from "./message";

const MODEL_KEY = "chorus:model";

// Only the new message goes up; the server loads the history itself.
const transport = new DefaultChatTransport<ChatMessage>({
  api: "/api/chat",
  prepareSendMessagesRequest: ({ id, messages, body }) => ({
    body: { chatId: id, modelId: body?.modelId, message: messages.at(-1) },
  }),
});

// The last model picked is remembered per browser (a convenience only).
function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readSavedModel(): string | null {
  try {
    return localStorage.getItem(MODEL_KEY);
  } catch {
    return null;
  }
}

export function Chat({
  id,
  initialMessages,
  isNew,
  title,
}: {
  id: string;
  initialMessages: ChatMessage[];
  isNew: boolean;
  title?: string;
}) {
  const { plan, addConversation, refreshConversations, refreshUsage, conversations } =
    useAppState();
  const openNav = useOpenMobileNav();
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState<ChatError | null>(null);

  const savedModelId = useSyncExternalStore(subscribeStorage, readSavedModel, () => null);
  const [pickedModelId, setPickedModelId] = useState<ModelId | null>(null);
  const savedModel = savedModelId ? getModel(savedModelId) : undefined;
  const modelId: ModelId =
    pickedModelId ??
    (savedModel && canUseModel(savedModel, plan) ? (savedModel.id as ModelId) : DEFAULT_MODEL_ID);

  const changeModel = (next: ModelId) => {
    setPickedModelId(next);
    try {
      localStorage.setItem(MODEL_KEY, next);
    } catch {}
  };

  // Text of the message in flight, so a refused request can be put back in the box.
  const lastSentText = useRef("");

  const { messages, sendMessage, setMessages, status, stop } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void refreshConversations();
      void refreshUsage();
    },
    onError: (error) => {
      const parsed = parseChatError(error);
      setChatError(parsed);
      // A coded error means the server refused before saving anything, so
      // take the message back out of the list and restore the text.
      if (parsed.code) {
        setInput(lastSentText.current);
        setMessages((list) => (list.at(-1)?.role === "user" ? list.slice(0, -1) : list));
      }
      void refreshUsage();
    },
  });

  // Once the server accepts the first message of a new chat, give it a real
  // URL and show it in the sidebar without a full navigation.
  const announced = useRef(!isNew);
  useEffect(() => {
    if (announced.current || status !== "streaming") return;
    announced.current = true;
    window.history.replaceState(null, "", `/chat/${id}`);
    const first = messages.find((m) => m.role === "user");
    addConversation({ id, title: titleFromMessage(first ? textOf(first) : ""), updatedAt: new Date().toISOString() });
  }, [status, id, messages, addConversation]);

  // Keep the newest message in view while streaming, unless the user scrolled up.
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";
  const send = () => {
    const text = input.trim();
    if (!text) return;
    setChatError(null);
    setInput("");
    pinned.current = true;
    lastSentText.current = text;
    void sendMessage({ text }, { body: { modelId } });
  };

  const heading = conversations.find((c) => c.id === id)?.title ?? title ?? "New chat";
  const empty = messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-3 md:px-6">
        <button
          type="button"
          onClick={openNav}
          aria-label="Open menu"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <List className="size-5" aria-hidden />
        </button>
        <h1 className="truncate text-sm font-medium text-foreground/80">{heading}</h1>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {empty ? (
          <EmptyState
            onPick={(text) => {
              setInput(text);
              requestAnimationFrame(() => document.getElementById("composer")?.focus());
            }}
          />
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pt-4 pb-10 md:px-6">
            {messages.map((m, i) => (
              <Message
                key={m.id}
                message={m}
                streaming={busy && i === messages.length - 1 && m.role === "assistant"}
              />
            ))}
            {status === "submitted" && messages.at(-1)?.role === "user" && (
              <Message
                message={{ id: "pending", role: "assistant", parts: [] }}
                streaming
              />
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 px-3 pb-3 md:px-6 md:pb-5">
        <div className="mx-auto w-full max-w-3xl">
          {chatError && (
            <LimitBanner error={chatError} onDismiss={() => setChatError(null)} />
          )}
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={send}
            onStop={() => void stop()}
            busy={busy}
            modelId={modelId}
            onModelChange={changeModel}
            plan={plan}
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI can be wrong. Costs shown are estimates.
          </p>
        </div>
      </div>
    </div>
  );
}

function textOf(message: ChatMessage) {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

const STARTERS = [
  "Explain recursion with a simple example",
  "Help me outline an essay on renewable energy",
  "Quiz me on the causes of World War I",
  "Why does my Python loop never stop?",
];

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col justify-end px-4 pb-8 md:px-6 md:pb-12">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
        What are you working on?
      </h2>
      <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
        Pick a model below and start typing, or try one of these. Each reply shows what it
        cost.
      </p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {STARTERS.map((text) => (
          <li key={text} className="flex">
            <button
              type="button"
              onClick={() => onPick(text)}
              className="group flex h-full w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-left text-sm transition-[background-color,border-color,transform] hover:border-foreground/20 hover:bg-muted active:scale-[0.99]"
            >
              <span>{text}</span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
