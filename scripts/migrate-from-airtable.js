#!/usr/bin/env node
// ── Operon BrewOS — One-time Airtable → Supabase Migration ──
// Usage:
//   node scripts/migrate-from-airtable.js --dry-run   # preview only
//   node scripts/migrate-from-airtable.js             # execute migration
//
// Required environment variables:
//   AIRTABLE_KEY              — Airtable personal access token
//   AIRTABLE_BASE_ID          — Airtable base ID (appXXXXXX)
//   SUPABASE_URL              — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Service role key (bypasses RLS)
//   BREWERY_ID                — Target brewery_profiles.id in Supabase

import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

// ── Config from environment ──
const {
  AIRTABLE_KEY,
  AIRTABLE_BASE_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BREWERY_ID,
} = process.env;

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`[migrate] Missing required env var: ${name}`);
    process.exit(1);
  }
}

requireEnv("AIRTABLE_KEY");
requireEnv("AIRTABLE_BASE_ID");
requireEnv("SUPABASE_URL");
requireEnv("SUPABASE_SERVICE_ROLE_KEY");
requireEnv("BREWERY_ID");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Airtable helpers ──

async function airtableFetch(table, offset) {
  const params = new URLSearchParams({ pageSize: "100" });
  if (offset) params.set("offset", offset);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable fetch failed for ${table}: ${res.status} ${body}`);
  }
  return res.json();
}

async function airtableAll(table) {
  const records = [];
  let offset;
  do {
    const page = await airtableFetch(table, offset);
    if (page.records) records.push(...page.records);
    offset = page.offset;
  } while (offset);
  console.log(`[migrate] Fetched ${records.length} records from Airtable table: ${table}`);
  return records;
}

// ── Idempotency: check existing IDs ──

async function existingIds(table, column = "airtable_id") {
  // If the table has an airtable_id column, use it for deduplication.
  // Otherwise fall back to checking by external_ref or skipping.
  try {
    const { data, error } = await supabase.from(table).select(column);
    if (error) return new Set();
    return new Set((data || []).map((r) => r[column]).filter(Boolean));
  } catch {
    return new Set();
  }
}

// ── Upsert helper ──

async function upsert(table, rows, conflictColumn = "id") {
  if (rows.length === 0) return;
  if (DRY_RUN) {
    console.log(`[dry-run] Would upsert ${rows.length} rows into ${table}`);
    return;
  }
  const chunkSize = 50;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictColumn, ignoreDuplicates: false });
    if (error) {
      console.error(`[migrate] Upsert error for ${table}:`, error.message);
      throw error;
    }
  }
  console.log(`[migrate] Upserted ${rows.length} rows into ${table}`);
}

// ── Field extraction helpers ──

function f(record, field) {
  return record.fields?.[field] ?? null;
}

function fText(record, field) {
  const v = f(record, field);
  return typeof v === "string" ? v.trim() || null : null;
}

function fNum(record, field) {
  const v = f(record, field);
  return typeof v === "number" ? v : null;
}

function fBool(record, field) {
  return !!f(record, field);
}

function fDate(record, field) {
  const v = f(record, field);
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

// ── Migration: Ingredients ──
// Airtable table name may vary; update INGREDIENTS_TABLE as needed.

const INGREDIENTS_TABLE = "Ingredients";
const BATCHES_TABLE = "Batches";
const RECIPES_TABLE = "Recipes";
const BREW_LOGS_TABLE = "Brew Logs";
const PACKAGING_FORMATS_TABLE = "Packaging Formats";
const LOTS_TABLE = "Lots";
const SALES_TABLE = "Sales";

async function migrateIngredients() {
  console.log("\n[migrate] === Ingredients ===");
  let records;
  try {
    records = await airtableAll(INGREDIENTS_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping ingredients: ${e.message}`);
    return {};
  }

  const idMap = {};
  const rows = records.map((r) => {
    const row = {
      brewery_id: BREWERY_ID,
      name: fText(r, "Name") ?? fText(r, "Ingredient Name") ?? r.id,
      category: fText(r, "Category") ?? fText(r, "Type") ?? "other",
      default_unit: fText(r, "Unit") ?? fText(r, "Default Unit") ?? "kg",
      is_active: fBool(r, "Active") !== false,
    };
    idMap[r.id] = row;
    return row;
  });

  await upsert("ingredients", rows, "name");
  return idMap;
}

async function migratePackagingFormats() {
  console.log("\n[migrate] === Packaging Formats ===");
  let records;
  try {
    records = await airtableAll(PACKAGING_FORMATS_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping packaging formats: ${e.message}`);
    return {};
  }

  const rows = records.map((r) => ({
    brewery_id: BREWERY_ID,
    name: fText(r, "Name") ?? fText(r, "Format Name") ?? r.id,
    container_type: fText(r, "Container Type") ?? fText(r, "Type") ?? "other",
    package_size_label: fText(r, "Size Label"),
    size_liters: fNum(r, "Volume (L)") ?? fNum(r, "Size (L)") ?? fNum(r, "Liters") ?? 0,
    is_reusable: fBool(r, "Reusable"),
    is_active: true,
  }));

  await upsert("packaging_formats", rows, "name");
}

async function migrateRecipes() {
  console.log("\n[migrate] === Recipes ===");
  let records;
  try {
    records = await airtableAll(RECIPES_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping recipes: ${e.message}`);
    return {};
  }

  const rows = records.map((r) => ({
    brewery_id: BREWERY_ID,
    name: fText(r, "Name") ?? fText(r, "Recipe Name") ?? r.id,
    target_og: fNum(r, "Target OG") ?? fNum(r, "OG"),
    target_fg: fNum(r, "Target FG") ?? fNum(r, "FG"),
    default_batch_size_liters: fNum(r, "Batch Size (L)") ?? fNum(r, "Volume (L)"),
    default_boil_duration_min: fNum(r, "Boil Duration (min)") ?? fNum(r, "Boil Time"),
    notes: fText(r, "Notes"),
    is_active: true,
  }));

  await upsert("recipes", rows, "name");
}

async function migrateBatches() {
  console.log("\n[migrate] === Batches ===");
  let records;
  try {
    records = await airtableAll(BATCHES_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping batches: ${e.message}`);
    return {};
  }

  const statusMap = {
    Planned: "planned",
    Brewing: "brewing",
    Fermenting: "fermenting",
    Conditioning: "conditioning",
    Ready: "ready",
    Packaged: "packaged",
    Closed: "closed",
  };

  const rows = records.map((r) => {
    const rawStatus = fText(r, "Status") ?? "planned";
    return {
      brewery_id: BREWERY_ID,
      batch_number: fText(r, "Batch Number") ?? fText(r, "Batch #") ?? fText(r, "Name"),
      declaration_number: fText(r, "Declaration Number") ?? fText(r, "Declaration #"),
      brew_date: fDate(r, "Brew Date") ?? fDate(r, "Date"),
      status: statusMap[rawStatus] ?? rawStatus.toLowerCase() ?? "planned",
      actual_volume_liters: fNum(r, "Volume (L)") ?? fNum(r, "Actual Volume"),
      notes: fText(r, "Notes"),
    };
  });

  await upsert("batches", rows, "batch_number");
}

async function migrateBrewLogs() {
  console.log("\n[migrate] === Brew Logs ===");
  let records;
  try {
    records = await airtableAll(BREW_LOGS_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping brew logs: ${e.message}`);
    return;
  }

  // Note: brew_logs require a valid batch_id FK; we match by batch_number
  const { data: batches } = await supabase
    .from("batches")
    .select("id, batch_number")
    .eq("brewery_id", BREWERY_ID);

  const batchByNumber = new Map((batches || []).map((b) => [b.batch_number, b.id]));

  const rows = records
    .map((r) => {
      const batchNumber = fText(r, "Batch Number") ?? fText(r, "Batch");
      const batchId = batchByNumber.get(batchNumber);
      if (!batchId) {
        console.warn(`[migrate] Brew log skipped — no batch found for: ${batchNumber}`);
        return null;
      }
      return {
        brewery_id: BREWERY_ID,
        batch_id: batchId,
        brew_date: fDate(r, "Brew Date") ?? fDate(r, "Date"),
        actual_fermenter_volume_liters: fNum(r, "Fermenter Volume (L)"),
        actual_pre_boil_volume_liters: fNum(r, "Pre-Boil Volume (L)"),
        actual_post_boil_volume_liters: fNum(r, "Post-Boil Volume (L)"),
        yeast_pitch_temp_c: fNum(r, "Yeast Pitch Temp"),
        brewer_notes: fText(r, "Notes") ?? fText(r, "Brewer Notes"),
        log_status: "complete",
      };
    })
    .filter(Boolean);

  await upsert("brew_logs", rows, "id");
}

async function migrateLots() {
  console.log("\n[migrate] === Lots ===");
  let records;
  try {
    records = await airtableAll(LOTS_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping lots: ${e.message}`);
    return;
  }

  const { data: batches } = await supabase
    .from("batches")
    .select("id, batch_number")
    .eq("brewery_id", BREWERY_ID);

  const batchByNumber = new Map((batches || []).map((b) => [b.batch_number, b.id]));

  const rows = records.map((r) => {
    const batchNumber = fText(r, "Batch Number") ?? fText(r, "Batch");
    return {
      brewery_id: BREWERY_ID,
      batch_id: batchNumber ? (batchByNumber.get(batchNumber) ?? null) : null,
      lot_number: fText(r, "Lot Number") ?? fText(r, "Name") ?? r.id,
      lot_type: "batch_output",
      status: "active",
      packaging_state: "unpackaged",
      excise_state: "not_applicable",
      volume_liters: fNum(r, "Volume (L)") ?? fNum(r, "Liters"),
      notes: fText(r, "Notes"),
    };
  });

  await upsert("lots", rows, "lot_number");
}

async function migrateSales() {
  console.log("\n[migrate] === Sales ===");
  let records;
  try {
    records = await airtableAll(SALES_TABLE);
  } catch (e) {
    console.warn(`[migrate] Skipping sales: ${e.message}`);
    return;
  }

  const rows = records.map((r) => ({
    brewery_id: BREWERY_ID,
    customer: fText(r, "Customer") ?? fText(r, "Buyer") ?? "Unknown",
    sale_date: fDate(r, "Sale Date") ?? fDate(r, "Date"),
    volume_sold: fNum(r, "Volume (L)"),
    unit: "L",
    invoice_number: fText(r, "Invoice Number") ?? fText(r, "Invoice #"),
    amount: fNum(r, "Amount") ?? fNum(r, "Total"),
    currency: "EUR",
    status: "confirmed",
    stock_direction: "out",
    notes: fText(r, "Notes"),
  }));

  await upsert("sales", rows, "invoice_number");
}

// ── Main ──

async function main() {
  console.log(`\n[migrate] Operon BrewOS — Airtable → Supabase Migration`);
  console.log(`[migrate] Target brewery: ${BREWERY_ID}`);
  console.log(`[migrate] Dry run: ${DRY_RUN}`);
  console.log(`[migrate] Base: ${AIRTABLE_BASE_ID}\n`);

  // Verify brewery exists
  const { data: brewery, error: breweryError } = await supabase
    .from("brewery_profiles")
    .select("id, name")
    .eq("id", BREWERY_ID)
    .single();

  if (breweryError || !brewery) {
    console.error(`[migrate] Brewery ${BREWERY_ID} not found in Supabase. Aborting.`);
    process.exit(1);
  }

  console.log(`[migrate] Confirmed brewery: ${brewery.name}\n`);

  await migrateIngredients();
  await migratePackagingFormats();
  await migrateRecipes();
  await migrateBatches();
  await migrateBrewLogs();
  await migrateLots();
  await migrateSales();

  console.log(`\n[migrate] Migration ${DRY_RUN ? "dry-run" : "complete"}.`);
}

main().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
