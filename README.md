# Chorus

Chat with GPT, Claude and Gemini in one place. Every reply shows what it cost, and
each user has a hard daily spending cap and a messages-per-minute limit.

Built with Next.js, the Vercel AI SDK + AI Gateway, Postgres (Neon) + Drizzle,
Auth.js and Tailwind.

## Run it locally

1. **Install:** `pnpm install`
2. **Environment:** `cp .env.example .env.local` and fill in every value
   (each one is explained in the file).
3. **Database:** create a free Neon project (or use any Postgres), put its URL in
   `DATABASE_URL`, then run `pnpm db:migrate`.
4. **Start:** `pnpm dev` and open http://localhost:3000

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test        # add TEST_DATABASE_URL=... to also run the database tests
pnpm build
```

## Deploy to Vercel

1. Import the repo in Vercel.
2. Add the env vars from `.env.example` (`AI_GATEWAY_API_KEY` is optional on Vercel).
3. Enable AI Gateway for the project.
4. Run `pnpm db:migrate` once against the production `DATABASE_URL`.
5. Add `https://<your-domain>/api/auth/callback/google` as a redirect URI in Google Cloud.

## How limits work

- **Plans** live in `src/config/plans.ts`. Everyone is on Free unless they have a row
  in the `subscriptions` table. To make yourself Pro for testing:
  ```sql
  INSERT INTO subscriptions (user_id, plan_id, status) VALUES ('<your user id>', 'pro', 'active');
  ```
- **Rate limit:** each request bumps a per-user counter for the current minute.
- **Daily cap:** before calling a model, the server reserves the most that reply
  could cost (full history + the maximum reply length). If that would go over
  the cap, the request is refused. When the reply ends, the real cost replaces
  the reservation. Caps reset at 00:00 UTC.
- **Stop button:** stopping hides the rest of the reply, but the model finishes on
  the server and the full cost is counted. This keeps billing exact.
