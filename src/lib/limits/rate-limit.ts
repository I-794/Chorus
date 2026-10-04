import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Anything that can run SQL: the db or a transaction.
type AnyDb = Pick<NodePgDatabase, "execute">;

/**
 * Counts this request against the user's current one-minute window, atomically.
 * One row per user: a new minute resets the count to 1.
 */
export async function hitRateLimit(
  db: AnyDb,
  userId: string,
  limitPerMinute: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const result = await db.execute<{ count: number; window_start: Date }>(sql`
    INSERT INTO rate_limits (user_id, window_start, count)
    VALUES (${userId}, date_trunc('minute', now()), 1)
    ON CONFLICT (user_id) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + 1
        ELSE 1
      END,
      window_start = excluded.window_start
    RETURNING count, window_start
  `);
  const row = result.rows[0];
  const windowEnd = new Date(row.window_start).getTime() + 60_000;
  return {
    allowed: Number(row.count) <= limitPerMinute,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - Date.now()) / 1000)),
  };
}
