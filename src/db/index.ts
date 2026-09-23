import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import { env } from "@/lib/config";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  racanaPool?: mysql.Pool;
};

export const pool =
  globalForDb.racanaPool ??
  mysql.createPool({
    uri: env.DATABASE_URL,
    connectionLimit: 10,
    timezone: "Z",
    enableKeepAlive: true,
  });

if (process.env.NODE_ENV !== "production") globalForDb.racanaPool = pool;

export const db = drizzle({ client: pool, schema, mode: "default" });
