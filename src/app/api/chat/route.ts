import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  streamText,
  toUIMessageStream,
  type LanguageModelUsage,
} from "ai";
import { canUseModel, getModel } from "@/config/models";
import { PLANS } from "@/config/plans";
import { getDb } from "@/db";
import {
  conversationExists,
  getConversation,
  loadMessages,
} from "@/db/queries/conversations";
import { getUserPlan, saveAssistantTurn, saveUserTurn } from "@/db/queries/usage";
import { ApiError, handle } from "@/lib/api-errors";
import { requireUserId } from "@/lib/auth";
import type { ChatMessage, ChatMessageMetadata } from "@/lib/chat-types";
import { computeCostMicros, estimateInputTokens, formatUsd, worstCaseCostMicros } from "@/lib/cost";
import { releaseReservation, reserveDailyBudget } from "@/lib/limits/daily-cap";
import { hitRateLimit } from "@/lib/limits/rate-limit";
import { formatDuration, nextUtcMidnight, utcDay } from "@/lib/limits/time";
import { chatRequestSchema, titleFromMessage } from "@/lib/validation";

// Long replies can take a while to stream.
export const maxDuration = 60;

export const POST = handle(async (req: Request) => {
  // 1. Who is asking?
  const userId = await requireUserId();

  // 2. Is the request well-formed? (Throws a ZodError → 400.)
  const body = chatRequestSchema.parse(await req.json());

  // 3. Can their plan use this model?
  const planId = await getUserPlan(userId);
  const plan = PLANS[planId];
  const model = getModel(body.modelId)!;
  if (!canUseModel(model, planId)) {
    throw new ApiError("MODEL_NOT_ALLOWED", `${model.name} needs a paid plan.`);
  }

  // 4. Messages per minute.
  const db = getDb();
  const rate = await hitRateLimit(db, userId, plan.messagesPerMinute);
  if (!rate.allowed) {
    throw new ApiError(
      "RATE_LIMITED",
      `You're sending messages too fast (limit: ${plan.messagesPerMinute} per minute). Try again in ${rate.retryAfterSeconds}s.`,
      { retryAfterSeconds: rate.retryAfterSeconds },
    );
  }

  // 5. Is this their chat (or a brand-new one)?
  const existing = await getConversation(userId, body.chatId);
  if (!existing && (await conversationExists(body.chatId))) {
    throw new ApiError("NOT_FOUND", "Conversation not found.");
  }

  // 6. History comes from the database, never from the client.
  const previous = existing
    ? await loadMessages(body.chatId, plan.maxHistoryMessages - 1)
    : [];
  const userMessage: ChatMessage = { ...body.message, metadata: undefined };
  const history = [...previous, userMessage];

  // 7. Reserve the worst-case cost against today's cap.
  const day = utcDay();
  const inputChars = history.reduce((n, m) => n + textOf(m).length, 0);
  const estimateMicros = worstCaseCostMicros(model, inputChars, plan.maxOutputTokens);
  const reserved = await reserveDailyBudget(db, {
    userId,
    day,
    estimateMicros,
    capMicros: plan.dailyCostCapMicros,
  });
  if (!reserved) {
    const resetAt = nextUtcMidnight();
    throw new ApiError(
      "DAILY_CAP_REACHED",
      `You've reached your ${formatUsd(plan.dailyCostCapMicros)} daily limit. It resets at 00:00 UTC (in ${formatDuration(resetAt.getTime() - Date.now())}).`,
      { resetAt },
    );
  }

  // 8. Save the user's message (creates the conversation on first send).
  try {
    await saveUserTurn({
      userId,
      conversationId: body.chatId,
      isNew: !existing,
      title: titleFromMessage(textOf(userMessage)),
      message: body.message,
    });
  } catch (err) {
    await releaseReservation(db, { userId, day, estimateMicros });
    throw err;
  }

  // 9. Stream the reply. Billing happens in onEnd, which runs even if the
  // browser disconnects because of consumeStream() below.
  const assistantId = generateId();
  const toMetadata = (usage: LanguageModelUsage, outputFallback = 0): ChatMessageMetadata => {
    const inputTokens = usage.inputTokens ?? estimateInputTokens(inputChars);
    const outputTokens = usage.outputTokens ?? outputFallback;
    return {
      modelId: model.id,
      inputTokens,
      outputTokens,
      costMicros: computeCostMicros(model, inputTokens, outputTokens),
    };
  };

  let settled = false;
  const result = streamText({
    model: model.id,
    messages: await convertToModelMessages(history),
    maxOutputTokens: plan.maxOutputTokens,
    onEnd: async (event) => {
      if (settled) return;
      settled = true;
      await saveAssistantTurn({
        userId,
        conversationId: body.chatId,
        day,
        estimateMicros,
        messageId: assistantId,
        text: event.text,
        metadata: toMetadata(event.totalUsage, estimateInputTokens(event.text.length)),
      });
    },
    onError: async ({ error }) => {
      console.error("Model stream error", error);
      if (settled) return;
      settled = true;
      await releaseReservation(db, { userId, day, estimateMicros });
    },
  });
  result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: history,
      generateMessageId: () => assistantId,
      messageMetadata: ({ part }) =>
        part.type === "finish" ? toMetadata(part.totalUsage) : undefined,
      onError: () => "The model ran into a problem. Please try again.",
    }),
  });
});

function textOf(message: ChatMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}
