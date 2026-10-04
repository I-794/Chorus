"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PlanId } from "@/config/plans";
import type { UsageResponse } from "@/lib/chat-types";

export type ConversationSummary = { id: string; title: string; updatedAt: string };

type AppState = {
  plan: PlanId;
  conversations: ConversationSummary[];
  usage: UsageResponse | null;
  refreshConversations: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  /** Show a new chat in the sidebar right away, before the server list catches up. */
  addConversation: (c: ConversationSummary) => void;
  renameConversation: (id: string, title: string) => Promise<boolean>;
  deleteConversation: (id: string) => Promise<boolean>;
};

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({
  plan,
  initialConversations,
  initialUsage,
  children,
}: {
  plan: PlanId;
  initialConversations: ConversationSummary[];
  initialUsage: UsageResponse | null;
  children: React.ReactNode;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [usage, setUsage] = useState(initialUsage);

  const refreshConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) setConversations((await res.json()).conversations);
  }, []);

  const refreshUsage = useCallback(async () => {
    const res = await fetch("/api/usage");
    if (res.ok) setUsage(await res.json());
  }, []);

  const addConversation = useCallback((c: ConversationSummary) => {
    setConversations((list) => [c, ...list.filter((x) => x.id !== c.id)]);
  }, []);

  const renameConversation = useCallback(async (id: string, title: string) => {
    const res = await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return false;
    const saved = (await res.json()).title as string;
    setConversations((list) => list.map((c) => (c.id === id ? { ...c, title: saved } : c)));
    return true;
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (!res.ok) return false;
    setConversations((list) => list.filter((c) => c.id !== id));
    return true;
  }, []);

  const value = useMemo(
    () => ({
      plan,
      conversations,
      usage,
      refreshConversations,
      refreshUsage,
      addConversation,
      renameConversation,
      deleteConversation,
    }),
    [plan, conversations, usage, refreshConversations, refreshUsage, addConversation, renameConversation, deleteConversation],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
