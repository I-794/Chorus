import type { UIMessage } from "ai";

// Attached to every assistant reply; drives the cost line under each message.
export type ChatMessageMetadata = {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costMicros: number;
};

export type ChatMessage = UIMessage<ChatMessageMetadata>;

/** Response of GET /api/usage. */
export type UsageResponse = {
  plan: { id: string; name: string };
  today: { costMicros: number; capMicros: number; messageCount: number };
  messagesPerMinute: number;
  resetsAt: string;
};
