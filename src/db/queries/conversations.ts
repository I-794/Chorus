import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { conversations, messages } from "@/db/schema";
import type { ChatMessage } from "@/lib/chat-types";

// Every query here is scoped by userId, so one user can never touch another's chats.

export async function listConversations(userId: string) {
  return getDb()
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(100);
}

/** Returns the conversation only if it exists AND belongs to this user. */
export async function getConversation(userId: string, id: string) {
  const [row] = await getDb()
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
  return row;
}

/** Whether any user owns a conversation with this id. */
export async function conversationExists(id: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.id, id));
  return Boolean(row);
}

export async function renameConversation(userId: string, id: string, title: string) {
  const rows = await getDb()
    .update(conversations)
    .set({ title })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning({ id: conversations.id });
  return rows.length > 0;
}

export async function deleteConversation(userId: string, id: string) {
  const rows = await getDb()
    .delete(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .returning({ id: conversations.id });
  return rows.length > 0;
}

/** The most recent `limit` messages, oldest first, in AI SDK UIMessage shape. */
export async function loadMessages(
  conversationId: string,
  limit = 500,
): Promise<ChatMessage[]> {
  const rows = await getDb()
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse().map((row) => ({
    id: row.id,
    role: row.role,
    parts: row.parts as ChatMessage["parts"],
    metadata: row.metadata ?? undefined,
  }));
}
