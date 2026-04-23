// ── Operon BrewOS — Typed Supabase Client & Query Helpers ──
// All helpers use the authenticated client so RLS applies automatically.
// No application-level brewery_id filter is required — the DB enforces isolation.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type {
  BreweryProfile,
  Ingredient,
  PackagingFormat,
  Recipe,
  Batch,
  BrewLog,
  Lot,
  Sale,
  Declaration,
  InventoryMovement,
  PendingMovement,
  EventLog,
} from "@/types/domain";

// ── Database row types (snake_case as returned by Postgres) ──

export interface DbBreweryProfile {
  id: string;
  name: string;
  legal_name: string | null;
  display_name: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  language: string;
  vat_number: string | null;
  excise_authorization_number: string | null;
  is_small_independent_brewery: boolean;
  emcs_enabled: boolean;
  packaging_contribution_mode: string | null;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
}

export interface DbBreweryUser {
  id: string;
  brewery_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbIngredient {
  id: string;
  brewery_id: string;
  name: string;
  category: string | null;
  default_unit: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPackagingFormat {
  id: string;
  brewery_id: string;
  name: string;
  container_type: string;
  package_size_label: string | null;
  size_liters: number;
  is_reusable: boolean;
  packaging_contribution_category: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRecipe {
  id: string;
  brewery_id: string;
  name: string;
  default_batch_size_liters: number | null;
  target_og: number | null;
  target_fg: number | null;
  target_pre_boil_volume_liters: number | null;
  target_post_boil_volume_liters: number | null;
  target_fermenter_volume_liters: number | null;
  default_boil_duration_min: number | null;
  default_yeast_notes: string | null;
  default_packaging_type: string | null;
  default_packaging_format_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBatch {
  id: string;
  brewery_id: string;
  batch_number: string | null;
  declaration_number: string | null;
  recipe_id: string | null;
  brew_date: string | null;
  status: string;
  target_volume_liters: number | null;
  actual_volume_liters: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbBrewLog {
  id: string;
  brewery_id: string;
  batch_id: string;
  brew_date: string | null;
  actual_mash_volume_liters: number | null;
  actual_strike_water_temp_c: number | null;
  actual_pre_boil_volume_liters: number | null;
  actual_post_boil_volume_liters: number | null;
  actual_boil_duration_min: number | null;
  actual_fermenter_volume_liters: number | null;
  yeast_pitch_temp_c: number | null;
  yeast_notes: string | null;
  packaged_date: string | null;
  packaged_volume_liters: number | null;
  packaging_format_id: string | null;
  exceptions: string | null;
  brewer_notes: string | null;
  log_status: string;
  created_at: string;
  updated_at: string;
}

export interface DbLot {
  id: string;
  brewery_id: string;
  batch_id: string | null;
  parent_lot_id: string | null;
  packaging_format_id: string | null;
  lot_number: string;
  internal_lot_ref: string | null;
  lot_type: string;
  status: string;
  packaging_state: string;
  excise_state: string;
  volume_liters: number | null;
  units_count: number | null;
  lot_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbSale {
  id: string;
  brewery_id: string;
  lot_id: string | null;
  customer: string;
  sale_date: string | null;
  volume_sold: number | null;
  unit: string | null;
  invoice_number: string | null;
  status: string;
  due_date: string | null;
  amount: number | null;
  currency: string;
  excise_mode: string | null;
  arc_reference: string | null;
  emcs_reference: string | null;
  stock_direction: string;
  elimination_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDeclaration {
  id: string;
  brewery_id: string;
  declaration_number: string | null;
  declaration_type: string;
  period_start: string;
  period_end: string;
  submission_date: string | null;
  status: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbInventoryMovement {
  id: string;
  brewery_id: string;
  movement_timestamp: string;
  movement_type: string;
  scope: string | null;
  ingredient_id: string | null;
  ingredient_receipt_id: string | null;
  lot_id: string | null;
  source_lot_id: string | null;
  destination_lot_id: string | null;
  batch_id: string | null;
  sale_id: string | null;
  quantity: number;
  unit: string;
  base_quantity_liters: number | null;
  base_quantity_kg: number | null;
  direction: string;
  excise_effect: boolean;
  reference_number: string | null;
  reason: string | null;
  notes: string | null;
  source_pending_movement_id: string | null;
  elimination_reason: string | null;
  created_at: string;
}

export interface DbPendingMovement {
  id: string;
  brewery_id: string;
  pending_type: string;
  scope: string | null;
  ingredient_id: string | null;
  ingredient_receipt_id: string | null;
  batch_id: string | null;
  lot_id: string | null;
  source_lot_id: string | null;
  destination_lot_id: string | null;
  sale_id: string | null;
  quantity: number | null;
  unit: string | null;
  direction: string | null;
  missing_fields_summary: string | null;
  why_completion_matters: string | null;
  resolution_status: string;
  completion_notes: string | null;
  elimination_reason: string | null;
  linked_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEventLog {
  id: string;
  brewery_id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  event_type: string;
  object_type: string | null;
  object_id: string | null;
  related_ids: Record<string, unknown> | null;
  event_timestamp: string;
  summary: string | null;
  payload_json: Record<string, unknown> | null;
  created_at: string;
}

// ── Type mappers (DB row → domain type) ──

function mapBreweryProfile(r: DbBreweryProfile): BreweryProfile {
  return {
    id: r.id,
    slug: r.id,
    name: r.display_name ?? r.name,
    country: r.country ?? "",
    locale: r.language,
    currency: r.currency,
    timezone: r.timezone,
    annualProductionLimitL: null,
    exciseRegistrationNumber: r.excise_authorization_number,
    isActive: r.onboarding_status !== "deactivated",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapIngredient(r: DbIngredient): Ingredient {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    name: r.name,
    category: (r.category as Ingredient["category"]) ?? "other",
    unit: r.default_unit ?? "kg",
    currentStockKg: null,
    notes: null,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapPackagingFormat(r: DbPackagingFormat): PackagingFormat {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    name: r.name,
    volumeL: r.size_liters,
    containerType: r.container_type,
    isActive: r.is_active,
  };
}

function mapRecipe(r: DbRecipe): Recipe {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    name: r.name,
    style: null,
    targetOg: r.target_og,
    targetFg: r.target_fg,
    targetAbvPct: null,
    targetIbu: null,
    targetColorEbc: null,
    mashTempC: null,
    boilDurationMin: r.default_boil_duration_min,
    preboilVolumeL: r.target_pre_boil_volume_liters,
    postboilVolumeL: r.target_post_boil_volume_liters,
    notes: r.notes,
    isArchived: !r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapBatch(r: DbBatch): Batch {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    recipeId: r.recipe_id,
    batchNumber: r.batch_number,
    declarationNumber: r.declaration_number,
    displayName: r.batch_number,
    status: r.status as Batch["status"],
    brewDate: r.brew_date,
    packageDate: null,
    volumeBrewedL: r.actual_volume_liters,
    volumePackagedL: null,
    actualOg: null,
    actualFg: null,
    actualAbvPct: null,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapBrewLog(r: DbBrewLog): BrewLog {
  return {
    id: r.id,
    batchId: r.batch_id,
    loggedAt: r.created_at,
    stage: r.log_status,
    value: r.actual_fermenter_volume_liters,
    unit: "L",
    notes: r.brewer_notes,
  };
}

function mapLot(r: DbLot): Lot {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    batchId: r.batch_id,
    lotType: r.lot_type as Lot["lotType"],
    status: r.status as Lot["status"],
    volumeL: r.volume_liters ?? 0,
    packagingState: r.packaging_state as Lot["packagingState"],
    exciseState: r.excise_state as Lot["exciseState"],
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapSale(r: DbSale): Sale {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    lotId: r.lot_id,
    saleDate: r.sale_date ?? r.created_at,
    volumeL: r.volume_sold ?? 0,
    pricePerL: r.amount && r.volume_sold ? r.amount / r.volume_sold : null,
    buyerName: r.customer,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function mapDeclaration(r: DbDeclaration): Declaration {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    batchId: null,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    volumeL: 0,
    exciseState: r.status === "submitted" ? "submitted" : r.status === "accepted" ? "cleared" : "pending",
    submittedAt: r.submission_date,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function mapInventoryMovement(r: DbInventoryMovement): InventoryMovement {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    ingredientId: r.ingredient_id,
    lotId: r.lot_id,
    direction: r.direction as InventoryMovement["direction"],
    quantityKg: r.base_quantity_kg,
    volumeL: r.base_quantity_liters,
    movedAt: r.movement_timestamp,
    reason: r.reason,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function mapPendingMovement(r: DbPendingMovement): PendingMovement {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    ingredientId: r.ingredient_id,
    lotId: r.lot_id,
    direction: (r.direction as PendingMovement["direction"]) ?? "out",
    quantityKg: null,
    volumeL: r.quantity,
    scheduledFor: null,
    resolvedAt: null,
    resolutionStatus: r.resolution_status as PendingMovement["resolutionStatus"],
    notes: r.completion_notes,
    createdAt: r.created_at,
  };
}

function mapEventLog(r: DbEventLog): EventLog {
  return {
    id: r.id,
    breweryId: r.brewery_id,
    userId: r.actor_user_id,
    category: (r.object_type as EventLog["category"]) ?? "system",
    entityType: r.object_type,
    entityId: r.object_id,
    action: r.event_type,
    payload: r.payload_json,
    createdAt: r.created_at,
  };
}

// ── Client factory ──

export const dbClient: SupabaseClient = supabase;

// Helper: throw on Supabase error
function assertOk<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`[db] ${error.message}`);
  if (data === null) throw new Error("[db] No data returned");
  return data;
}

// ── Brewery ──

export async function getBrewery(id: string): Promise<BreweryProfile> {
  const { data, error } = await dbClient
    .from("brewery_profiles")
    .select("*")
    .eq("id", id)
    .single();
  return mapBreweryProfile(assertOk(data, error));
}

export async function updateBrewery(id: string, patch: Partial<DbBreweryProfile>): Promise<BreweryProfile> {
  const { data, error } = await dbClient
    .from("brewery_profiles")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapBreweryProfile(assertOk(data, error));
}

// ── Ingredients ──

export async function getIngredients(breweryId: string): Promise<Ingredient[]> {
  const { data, error } = await dbClient
    .from("ingredients")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("name");
  return assertOk(data, error).map(mapIngredient);
}

export async function getIngredient(id: string): Promise<Ingredient> {
  const { data, error } = await dbClient
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .single();
  return mapIngredient(assertOk(data, error));
}

export async function createIngredient(payload: Omit<DbIngredient, "id" | "created_at" | "updated_at">): Promise<Ingredient> {
  const { data, error } = await dbClient
    .from("ingredients")
    .insert(payload)
    .select()
    .single();
  return mapIngredient(assertOk(data, error));
}

export async function updateIngredient(id: string, patch: Partial<DbIngredient>): Promise<Ingredient> {
  const { data, error } = await dbClient
    .from("ingredients")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapIngredient(assertOk(data, error));
}

// ── Packaging Formats ──

export async function getPackagingFormats(breweryId: string): Promise<PackagingFormat[]> {
  const { data, error } = await dbClient
    .from("packaging_formats")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("name");
  return assertOk(data, error).map(mapPackagingFormat);
}

export async function getPackagingFormat(id: string): Promise<PackagingFormat> {
  const { data, error } = await dbClient
    .from("packaging_formats")
    .select("*")
    .eq("id", id)
    .single();
  return mapPackagingFormat(assertOk(data, error));
}

export async function createPackagingFormat(payload: Omit<DbPackagingFormat, "id" | "created_at" | "updated_at">): Promise<PackagingFormat> {
  const { data, error } = await dbClient
    .from("packaging_formats")
    .insert(payload)
    .select()
    .single();
  return mapPackagingFormat(assertOk(data, error));
}

export async function updatePackagingFormat(id: string, patch: Partial<DbPackagingFormat>): Promise<PackagingFormat> {
  const { data, error } = await dbClient
    .from("packaging_formats")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapPackagingFormat(assertOk(data, error));
}

// ── Recipes ──

export async function getRecipes(breweryId: string): Promise<Recipe[]> {
  const { data, error } = await dbClient
    .from("recipes")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("name");
  return assertOk(data, error).map(mapRecipe);
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data, error } = await dbClient
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  return mapRecipe(assertOk(data, error));
}

export async function createRecipe(payload: Omit<DbRecipe, "id" | "created_at" | "updated_at">): Promise<Recipe> {
  const { data, error } = await dbClient
    .from("recipes")
    .insert(payload)
    .select()
    .single();
  return mapRecipe(assertOk(data, error));
}

export async function updateRecipe(id: string, patch: Partial<DbRecipe>): Promise<Recipe> {
  const { data, error } = await dbClient
    .from("recipes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapRecipe(assertOk(data, error));
}

// ── Batches ──

export async function getBatches(breweryId: string): Promise<Batch[]> {
  const { data, error } = await dbClient
    .from("batches")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("created_at", { ascending: false });
  return assertOk(data, error).map(mapBatch);
}

export async function getBatch(id: string): Promise<Batch> {
  const { data, error } = await dbClient
    .from("batches")
    .select("*")
    .eq("id", id)
    .single();
  return mapBatch(assertOk(data, error));
}

export async function createBatch(payload: Omit<DbBatch, "id" | "created_at" | "updated_at">): Promise<Batch> {
  const { data, error } = await dbClient
    .from("batches")
    .insert(payload)
    .select()
    .single();
  return mapBatch(assertOk(data, error));
}

export async function updateBatch(id: string, patch: Partial<DbBatch>): Promise<Batch> {
  const { data, error } = await dbClient
    .from("batches")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapBatch(assertOk(data, error));
}

// ── Brew Logs ──

export async function getBrewLogs(batchId: string): Promise<BrewLog[]> {
  const { data, error } = await dbClient
    .from("brew_logs")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at");
  return assertOk(data, error).map(mapBrewLog);
}

export async function getBrewLog(id: string): Promise<BrewLog> {
  const { data, error } = await dbClient
    .from("brew_logs")
    .select("*")
    .eq("id", id)
    .single();
  return mapBrewLog(assertOk(data, error));
}

export async function createBrewLog(payload: Omit<DbBrewLog, "id" | "created_at" | "updated_at">): Promise<BrewLog> {
  const { data, error } = await dbClient
    .from("brew_logs")
    .insert(payload)
    .select()
    .single();
  return mapBrewLog(assertOk(data, error));
}

export async function updateBrewLog(id: string, patch: Partial<DbBrewLog>): Promise<BrewLog> {
  const { data, error } = await dbClient
    .from("brew_logs")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapBrewLog(assertOk(data, error));
}

// ── Lots ──

export async function getLots(breweryId: string): Promise<Lot[]> {
  const { data, error } = await dbClient
    .from("lots")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("created_at", { ascending: false });
  return assertOk(data, error).map(mapLot);
}

export async function getLotsByBatch(batchId: string): Promise<Lot[]> {
  const { data, error } = await dbClient
    .from("lots")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at");
  return assertOk(data, error).map(mapLot);
}

export async function getLot(id: string): Promise<Lot> {
  const { data, error } = await dbClient
    .from("lots")
    .select("*")
    .eq("id", id)
    .single();
  return mapLot(assertOk(data, error));
}

export async function createLot(payload: Omit<DbLot, "id" | "created_at" | "updated_at">): Promise<Lot> {
  const { data, error } = await dbClient
    .from("lots")
    .insert(payload)
    .select()
    .single();
  return mapLot(assertOk(data, error));
}

export async function updateLot(id: string, patch: Partial<DbLot>): Promise<Lot> {
  const { data, error } = await dbClient
    .from("lots")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapLot(assertOk(data, error));
}

// ── Sales ──

export async function getSales(breweryId: string): Promise<Sale[]> {
  const { data, error } = await dbClient
    .from("sales")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("sale_date", { ascending: false });
  return assertOk(data, error).map(mapSale);
}

export async function getSale(id: string): Promise<Sale> {
  const { data, error } = await dbClient
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();
  return mapSale(assertOk(data, error));
}

export async function createSale(payload: Omit<DbSale, "id" | "created_at" | "updated_at">): Promise<Sale> {
  const { data, error } = await dbClient
    .from("sales")
    .insert(payload)
    .select()
    .single();
  return mapSale(assertOk(data, error));
}

export async function updateSale(id: string, patch: Partial<DbSale>): Promise<Sale> {
  const { data, error } = await dbClient
    .from("sales")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapSale(assertOk(data, error));
}

// ── Declarations ──

export async function getDeclarations(breweryId: string): Promise<Declaration[]> {
  const { data, error } = await dbClient
    .from("declarations")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("period_start", { ascending: false });
  return assertOk(data, error).map(mapDeclaration);
}

export async function getDeclaration(id: string): Promise<Declaration> {
  const { data, error } = await dbClient
    .from("declarations")
    .select("*")
    .eq("id", id)
    .single();
  return mapDeclaration(assertOk(data, error));
}

export async function createDeclaration(payload: Omit<DbDeclaration, "id" | "created_at" | "updated_at">): Promise<Declaration> {
  const { data, error } = await dbClient
    .from("declarations")
    .insert(payload)
    .select()
    .single();
  return mapDeclaration(assertOk(data, error));
}

export async function updateDeclaration(id: string, patch: Partial<DbDeclaration>): Promise<Declaration> {
  const { data, error } = await dbClient
    .from("declarations")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapDeclaration(assertOk(data, error));
}

// ── Inventory Movements ──

export async function getInventoryMovements(breweryId: string, limit = 100): Promise<InventoryMovement[]> {
  const { data, error } = await dbClient
    .from("inventory_movements")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("movement_timestamp", { ascending: false })
    .limit(limit);
  return assertOk(data, error).map(mapInventoryMovement);
}

export async function createInventoryMovement(payload: Omit<DbInventoryMovement, "id" | "created_at">): Promise<InventoryMovement> {
  const { data, error } = await dbClient
    .from("inventory_movements")
    .insert(payload)
    .select()
    .single();
  return mapInventoryMovement(assertOk(data, error));
}

// ── Pending Movements ──

export async function getPendingMovements(breweryId: string): Promise<PendingMovement[]> {
  const { data, error } = await dbClient
    .from("pending_movements")
    .select("*")
    .eq("brewery_id", breweryId)
    .eq("resolution_status", "pending")
    .order("created_at", { ascending: false });
  return assertOk(data, error).map(mapPendingMovement);
}

export async function getPendingMovement(id: string): Promise<PendingMovement> {
  const { data, error } = await dbClient
    .from("pending_movements")
    .select("*")
    .eq("id", id)
    .single();
  return mapPendingMovement(assertOk(data, error));
}

export async function createPendingMovement(payload: Omit<DbPendingMovement, "id" | "created_at" | "updated_at">): Promise<PendingMovement> {
  const { data, error } = await dbClient
    .from("pending_movements")
    .insert(payload)
    .select()
    .single();
  return mapPendingMovement(assertOk(data, error));
}

export async function updatePendingMovement(id: string, patch: Partial<DbPendingMovement>): Promise<PendingMovement> {
  const { data, error } = await dbClient
    .from("pending_movements")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  return mapPendingMovement(assertOk(data, error));
}

// ── Event Logs ──

export async function getEventLogs(breweryId: string, limit = 50): Promise<EventLog[]> {
  const { data, error } = await dbClient
    .from("event_logs")
    .select("*")
    .eq("brewery_id", breweryId)
    .order("event_timestamp", { ascending: false })
    .limit(limit);
  return assertOk(data, error).map(mapEventLog);
}

export async function logEvent(payload: Omit<DbEventLog, "id" | "created_at" | "event_timestamp">): Promise<void> {
  const { error } = await dbClient
    .from("event_logs")
    .insert(payload);
  if (error) console.error("[db] logEvent failed:", error.message);
}
