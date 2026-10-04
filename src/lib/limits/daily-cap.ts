import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Anything that can run SQL: the db or a transaction.
type AnyDb = Pick<NodePgDatabase, "execute">;

/**
 * Reserves the worst-case cost of a reply before calling the model.
 * The check and the reservation are one statement, so two tabs sending at
 * the same moment can't both slip past the cap.
 * Returns false when the reservation would go over the cap.
 */
export async function reserveDailyBudget(
  db: AnyDb,
  params: { userId: string; day: string; estimateMicros: number; capMicros: number },
): Promise<boolean> {
  const { userId, day, estimateMicros, capMicros } = params;
  if (estimateMicros > capMicros) return false;
  const result = await db.execute(sql`
    INSERT INTO daily_usage (user_id, day, reserved_micros)
    VALUES (${userId}, ${day}, ${estimateMicros})
    ON CONFLICT (user_id, day) DO UPDATE
      SET reserved_micros = daily_usage.reserved_micros + excluded.reserved_micros
      WHERE daily_usage.cost_micros + daily_usage.reserved_micros + excluded.reserved_micros
        <= ${capMicros}
    RETURNING user_id
  `);
  return result.rows.length > 0;
}

/** Swaps a reservation for the real cost once the reply has finished. */
export async function settleDailyUsage(
  db: AnyDb,
  params: {
    userId: string;
    day: string;
    estimateMicros: number;
    costMicros: number;
    inputTokens: number;
    outputTokens: number;
  },
): Promise<void> {
  const { userId, day, estimateMicros, costMicros, inputTokens, outputTokens } = params;
  await db.execute(sql`
    UPDATE daily_usage SET
      cost_micros = cost_micros + ${costMicros},
      reserved_micros = GREATEST(reserved_micros - ${estimateMicros}, 0),
      input_tokens = input_tokens + ${inputTokens},
      output_tokens = output_tokens + ${outputTokens},
      message_count = message_count + 1
    WHERE user_id = ${userId} AND day = ${day}
  `);
}

/** Gives back a reservation when the model call failed before any usage. */
export async function releaseReservation(
  db: AnyDb,
  params: { userId: string; day: string; estimateMicros: number },
): Promise<void> {
  await db.execute(sql`
    UPDATE daily_usage
    SET reserved_micros = GREATEST(reserved_micros - ${params.estimateMicros}, 0)
    WHERE user_id = ${params.userId} AND day = ${params.day}
  `);
}
