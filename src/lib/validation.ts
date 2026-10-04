import { z } from "zod";
import { MODEL_IDS } from "@/config/models";

export const MAX_MESSAGE_CHARS = 8_000;
export const MAX_TITLE_CHARS = 100;

export const conversationIdSchema = z.uuid();

/** Body of POST /api/chat. The client sends only the new message. */
export const chatRequestSchema = z.object({
  chatId: conversationIdSchema,
  modelId: z.enum(MODEL_IDS),
  message: z.object({
    id: z.string().min(1).max(100),
    role: z.literal("user"),
    // Text only in Phase 1: no file or image parts.
    parts: z
      .array(
        z.object({
          type: z.literal("text"),
          text: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
        }),
      )
      .length(1),
  }),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const renameConversationSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TITLE_CHARS),
});

/** Default title: the start of the first message, on one line. */
export function titleFromMessage(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 57)}...` : oneLine;
}
