import { describe, expect, it } from "vitest";
import {
  chatRequestSchema,
  MAX_MESSAGE_CHARS,
  renameConversationSchema,
  titleFromMessage,
} from "@/lib/validation";

const valid = {
  chatId: "8a6e0804-2bd0-4672-b79d-d97027f9071a",
  modelId: "openai/gpt-5-mini",
  message: { id: "abc123", role: "user", parts: [{ type: "text", text: "Hello" }] },
};

describe("chatRequestSchema", () => {
  it("accepts a valid request", () => {
    expect(chatRequestSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["unknown model", { ...valid, modelId: "openai/gpt-99" }],
    ["non-uuid chat id", { ...valid, chatId: "../etc/passwd" }],
    ["assistant role", { ...valid, message: { ...valid.message, role: "assistant" } }],
    ["empty text", { ...valid, message: { ...valid.message, parts: [{ type: "text", text: "   " }] } }],
    ["too long", { ...valid, message: { ...valid.message, parts: [{ type: "text", text: "x".repeat(MAX_MESSAGE_CHARS + 1) }] } }],
    ["file part", { ...valid, message: { ...valid.message, parts: [{ type: "file", url: "data:..." }] } }],
    ["two parts", { ...valid, message: { ...valid.message, parts: [{ type: "text", text: "a" }, { type: "text", text: "b" }] } }],
  ])("rejects %s", (_, body) => {
    expect(chatRequestSchema.safeParse(body).success).toBe(false);
  });

  it("drops fields the client shouldn't control", () => {
    const parsed = chatRequestSchema.parse({ ...valid, history: [{ role: "system" }], price: 0 });
    expect(parsed).not.toHaveProperty("history");
    expect(parsed).not.toHaveProperty("price");
  });
});

describe("renameConversationSchema", () => {
  it("trims and limits titles", () => {
    expect(renameConversationSchema.parse({ title: "  Hi  " }).title).toBe("Hi");
    expect(renameConversationSchema.safeParse({ title: "" }).success).toBe(false);
    expect(renameConversationSchema.safeParse({ title: "x".repeat(101) }).success).toBe(false);
  });
});

describe("titleFromMessage", () => {
  it("collapses whitespace and truncates", () => {
    expect(titleFromMessage("Hello\n\n  world")).toBe("Hello world");
    expect(titleFromMessage("a".repeat(80))).toHaveLength(60);
  });
});
