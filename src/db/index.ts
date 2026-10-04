import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

function createDb() {
  const pool = new Pool({
    connectionString: env().DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 5_000,
  });
  // Lets Vercel close idle connections before a function instance is suspended.
  attachDatabasePool(pool);
  return drizzle(pool, { schema });
}

type Db = ReturnType<typeof createDb>;

// Reuse one pool per server instance (and across hot reloads in dev).
const globalForDb = globalThis as unknown as { chorusDb?: Db };

export function getDb(): Db {
  globalForDb.chorusDb ??= createDb();
  return globalForDb.chorusDb;
}

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
