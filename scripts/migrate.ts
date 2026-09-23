import "dotenv/config";

import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for migrations.");

const connection = await mysql.createConnection({ uri: databaseUrl, timezone: "Z" });
try {
  await migrate(drizzle({ client: connection }), { migrationsFolder: "drizzle" });
  console.log("Database migrations are up to date.");
} finally {
  await connection.end();
}
