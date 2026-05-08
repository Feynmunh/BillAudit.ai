import { drizzle } from "drizzle-orm/postgres-js";
import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

import * as schema from "./schema";

loadEnvConfig(process.cwd());

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Database is required: set DATABASE_URL to your Supabase Postgres connection string.");
  }
  return databaseUrl;
}

const sql = postgres(getDatabaseUrl(), { max: 5, ssl: "require" });

export const db = drizzle(sql, { schema });
