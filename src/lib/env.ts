import "server-only";
import { z } from "zod";

// Only server code may import this file. Validated lazily on first use so
// `next build` works without secrets present.
const schema = z.object({
  DATABASE_URL: z.url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  AUTH_RESEND_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(3),
  // Optional on Vercel, where the gateway authenticates with OIDC instead.
  AI_GATEWAY_API_KEY: z.string().optional(),
});

let cached: z.infer<typeof schema> | undefined;

export function env() {
  cached ??= schema.parse(process.env);
  return cached;
}
