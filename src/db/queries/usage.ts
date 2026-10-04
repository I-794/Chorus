import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { PlanId } from "@/config/plans";
import { getDb } from "@/db";
import {
  conversations,
  dailyUsage,
  messages,
  subscriptions,
  usageEvents,
} from "@/db/schema";
import type { ChatMessageMetadata } from "@/lib/chat-types";
import { settleDailyUsage } from "@/lib/limits/daily-cap";
import { resolvePlan } from "@/lib/limits/plan";

export async function getUserPlan(userId: string): Promise<PlanId> {
  const [sub] = await getDb()
    .select({
      planId: subscriptions.planId,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  return resolvePlan(sub);
}

export async function getDailyUsage(userId: string, day: string) {
  const [row] = await getDb()
    .select()
    .from(dailyUsage)
    .where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.day, day)));
  return {
    costMicros: row?.costMicros ?? 0,
    reservedMicros: row?.reservedMicros ?? 0,
    messageCount: row?.messageCount ?? 0,
  };
}

/** Saves the user's message, creating the conversation on its first message. */
export async function saveUserTurn(params: {
  userId: string;
  conversationId: string;
  isNew: boolean;
  title: string;
  message: { id: string; parts: unknown[] };
}) {
  const { userId, conversationId, isNew, title, message } = params;
  await getDb().transaction(async (tx) => {
    if (isNew) {
      await tx.insert(conversations).values({ id: conversationId, userId, title });
    }
    await tx
      .insert(messages)
      .values({ id: message.id, conversationId, role: "user", parts: message.parts })
      .onConflictDoNothing();
  });
}

/**
 * Runs when a reply finishes: saves it, writes the ledger row, and swaps the
 * reservation for the real cost. All or nothing.
 */
export async function saveAssistantTurn(params: {
  userId: string;
  conversationId: string;
  day: string;
  estimateMicros: number;
  messageId: string;
  text: string;
  metadata: ChatMessageMetadata;
}) {
  const { userId, conversationId, day, estimateMicros, messageId, text, metadata } =
    params;
  await getDb().transaction(async (tx) => {
    // The chat may have been deleted mid-reply. Still bill it, just don't save the text.
    const [conversation] = await tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .for("update");
    if (conversation && text.length > 0) {
      await tx.insert(messages).values({
        id: messageId,
        conversationId,
        role: "assistant",
        parts: [{ type: "text", text }],
        metadata,
      });
    }
    await tx.insert(usageEvents).values({
      userId,
      conversationId: conversation ? conversationId : null,
      messageId,
      modelId: metadata.modelId,
      inputTokens: metadata.inputTokens,
      outputTokens: metadata.outputTokens,
      costMicros: metadata.costMicros,
    });
    await settleDailyUsage(tx, {
      userId,
      day,
      estimateMicros,
      costMicros: metadata.costMicros,
      inputTokens: metadata.inputTokens,
      outputTokens: metadata.outputTokens,
    });
    if (conversation) {
      await tx
        .update(conversations)
        .set({ updatedAt: sql`now()` })
        .where(eq(conversations.id, conversationId));
    }
  });
}
