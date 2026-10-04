@AGENTS.md

# Chorus

A small multi-model AI chat app (think a mini T3 Chat). Phase 1 = MVP only.

## Stack
- Next.js 16 App Router + TypeScript (strict), pnpm
- AI SDK v7 (`ai`, `@ai-sdk/react`) through Vercel AI Gateway: model ids are plain strings like `"anthropic/claude-haiku-4.5"`
- Postgres (Neon in prod, any Postgres locally) via Drizzle ORM and the `pg` driver
- Auth.js v5 (`next-auth@beta`): Google + Resend email links, database sessions
- Tailwind v4, Streamdown for markdown, lucide-react icons

## Commands
- `pnpm dev`: run locally (needs `.env.local`, see `.env.example`)
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: run all four before calling work done
- `pnpm db:generate` after editing `src/db/schema.ts`, then `pnpm db:migrate`
- DB integration tests run only when `TEST_DATABASE_URL` is set

## Where things live
- `src/config/models.ts`: THE list of models (id, name, provider, prices per 1M tokens, plans). Add or remove models only here.
- `src/config/plans.ts`: plan limits (daily cap, messages/minute, max output tokens)
- `src/app/api/chat/route.ts`: the streaming route; its numbered comments are the request pipeline
- `src/lib/limits/`: rate limit and daily cap SQL, plus the plan resolver
- `src/db/schema.ts`: all tables; `src/db/queries/`: all queries

## Rules
- Secrets and model calls are server-only. Server modules start with `import "server-only"`. Never add a `NEXT_PUBLIC_` secret.
- Validate every request body and route param with zod (`src/lib/validation.ts`). Wrap route handlers in `handle()` from `src/lib/api-errors.ts` so errors share one JSON shape.
- Every user-data query filters by `userId`. Another user's resource returns 404, not 403.
- Money is integer micro-dollars (1 USD = 1,000,000). tokens × price-per-1M = micro-dollars. Never use floats for stored money.
- The client sends only the new message; history always comes from the database.
- A user's plan comes only from `getUserPlan()`. Stripe (later) writes the `subscriptions` table; limit code shouldn't change.
- The usage ledger (`usage_events`) is never deleted with a chat.
- Keep it simple: Phase 1 has no agents, tools, file uploads or voice.

## UI
- Design tokens are CSS variables in `src/app/globals.css` (light + dark via `prefers-color-scheme`). Use the Tailwind color names (`bg-muted`, `text-muted-foreground`, `bg-accent-soft`, ...) and never hard-code colors.
- Calm, focused, readable: one accent color, subtle motion, respect `prefers-reduced-motion`.
- For UI work, use the `design-taste-frontend` skill if it's installed in `.claude/skills/` (dials: DESIGN_VARIANCE 3, MOTION_INTENSITY 3, VISUAL_DENSITY 5).
