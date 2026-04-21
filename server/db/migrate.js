/**
 * Operon migration runner.
 *
 * Connects directly to Supabase Postgres via node-postgres.
 * Requires one of:
 *   SUPABASE_DB_URL  — full PostgreSQL connection string
 *   SUPABASE_DB_PASSWORD — DB password (project ref inferred from SUPABASE_URL)
 */
import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buildConnectionString() {
  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }
  const password = process.env.SUPABASE_DB_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!password || !supabaseUrl) {
    throw new Error(
      "Set SUPABASE_DB_URL or both SUPABASE_URL + SUPABASE_DB_PASSWORD to run migrations."
    );
  }
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `postgresql://postgres.${ref}:${password}@aws-0-eu-west-3.pooler.supabase.com:5432/postgres?sslmode=require`;
}

export async function runMigration(migrationFile = "001_initial_schema.sql") {
  const connStr = buildConnectionString();
  const filePath = path.join(__dirname, migrationFile);
  const sql = readFileSync(filePath, "utf8");

  const client = new Client({ connectionString: connStr });
  await client.connect();
  try {
    await client.query(sql);
    return { success: true, migration: migrationFile };
  } finally {
    await client.end();
  }
}

export async function validateMigration(migrationFile = "001_initial_schema.sql") {
  const connStr = buildConnectionString();
  const filePath = path.join(__dirname, migrationFile);
  const sql = readFileSync(filePath, "utf8");

  const client = new Client({ connectionString: connStr });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("ROLLBACK");
    return { success: true, dry_run: true, migration: migrationFile };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

export function getMigrationSql(migrationFile = "001_initial_schema.sql") {
  const filePath = path.join(__dirname, migrationFile);
  return readFileSync(filePath, "utf8");
}
