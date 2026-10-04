// Integration tests for the limit SQL. They need a migrated Postgres:
//   TEST_DATABASE_URL=postgres://... pnpm test
// Skipped when TEST_DATABASE_URL isn't set.
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  releaseReservation,
  reserveDailyBudget,
  settleDailyUsage,
} from "@/lib/limits/daily-cap";
import { hitRateLimit } from "@/lib/limits/rate-limit";

const url = process.env.TEST_DATABASE_URL;
const pool = url ? new Pool({ connectionString: url }) : undefined;
const db = pool ? drizzle(pool) : undefined;
const userId = "test-user";
const day = "2026-10-04";

describe.skipIf(!url)("limits (database)", () => {
  beforeEach(async () => {
    await db!.execute(sql`DELETE FROM users WHERE id = ${userId}`);
    await db!.execute(sql`INSERT INTO users (id, email) VALUES (${userId}, 'test@example.com')`);
  });

  afterAll(async () => {
    await db!.execute(sql`DELETE FROM users WHERE id = ${userId}`);
    await pool!.end();
  });

  it("rate limit allows N per minute, then blocks", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await hitRateLimit(db!, userId, 3));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
    expect(results[3].retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("rate limit resets in a new minute window", async () => {
    await db!.execute(sql`
      INSERT INTO rate_limits (user_id, window_start, count)
      VALUES (${userId}, date_trunc('minute', now()) - interval '1 minute', 99)`);
    expect((await hitRateLimit(db!, userId, 3)).allowed).toBe(true);
  });

  it("daily cap: reserves until the cap, then refuses", async () => {
    const cap = 1_000;
    const reserve = (estimateMicros: number) =>
      reserveDailyBudget(db!, { userId, day, estimateMicros, capMicros: cap });
    expect(await reserve(400)).toBe(true);
    expect(await reserve(400)).toBe(true);
    expect(await reserve(400)).toBe(false); // 1,200 > 1,000
    expect(await reserve(5_000)).toBe(false); // bigger than the cap on its own
  });

  it("daily cap: settling swaps the reservation for the real cost", async () => {
    const cap = 1_000;
    await reserveDailyBudget(db!, { userId, day, estimateMicros: 900, capMicros: cap });
    await settleDailyUsage(db!, {
      userId, day, estimateMicros: 900, costMicros: 100, inputTokens: 10, outputTokens: 20,
    });
    const { rows } = await db!.execute<{ cost_micros: string; reserved_micros: string; message_count: number }>(
      sql`SELECT cost_micros, reserved_micros, message_count FROM daily_usage WHERE user_id = ${userId}`,
    );
    expect(rows[0]).toMatchObject({ cost_micros: "100", reserved_micros: "0", message_count: 1 });
    // 100 spent → 900 left, so an 800 reservation fits again.
    expect(await reserveDailyBudget(db!, { userId, day, estimateMicros: 800, capMicros: cap })).toBe(true);
  });

  it("daily cap: releasing gives the budget back", async () => {
    const cap = 1_000;
    await reserveDailyBudget(db!, { userId, day, estimateMicros: 1_000, capMicros: cap });
    expect(await reserveDailyBudget(db!, { userId, day, estimateMicros: 1, capMicros: cap })).toBe(false);
    await releaseReservation(db!, { userId, day, estimateMicros: 1_000 });
    expect(await reserveDailyBudget(db!, { userId, day, estimateMicros: 1_000, capMicros: cap })).toBe(true);
  });

  it("daily cap holds under concurrent requests", async () => {
    const cap = 1_000;
    const attempts = await Promise.all(
      Array.from({ length: 20 }, () =>
        reserveDailyBudget(db!, { userId, day, estimateMicros: 100, capMicros: cap }),
      ),
    );
    expect(attempts.filter(Boolean)).toHaveLength(10);
  });
});
