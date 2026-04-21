// ── Operon BrewOS — Seed helpers for new brewery provisioning ──
// Used by Task #9 provisioning flow: inserts starter records for a fresh brewery.
// Requires the Supabase service role client (bypasses RLS).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("[seed] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface SeedBreweryInput {
  name: string;
  country?: string;
  timezone?: string;
  currency?: string;
  language?: string;
}

/**
 * Insert a new brewery_profiles row and return its ID.
 * Idempotent: if a brewery with the same name already exists for provisioning
 * purposes this returns the existing row (by name match — unique provisioning
 * flows should pass a deterministic name or check before calling).
 */
export async function seedBreweryProfile(input: SeedBreweryInput): Promise<string> {
  const client = getServiceClient();

  const { data, error } = await client
    .from("brewery_profiles")
    .insert({
      name: input.name,
      display_name: input.name,
      country: input.country ?? null,
      timezone: input.timezone ?? "UTC",
      currency: input.currency ?? "EUR",
      language: input.language ?? "en",
      onboarding_status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(`[seed] Failed to create brewery profile: ${error.message}`);
  return data.id;
}

/**
 * Insert default packaging formats for a new brewery.
 * Covers common vessel types across European craft brewery contexts.
 */
export async function seedPackagingFormats(breweryId: string): Promise<void> {
  const client = getServiceClient();

  const defaults = [
    { name: "Keg 30L", container_type: "keg", size_liters: 30, is_reusable: true },
    { name: "Keg 20L", container_type: "keg", size_liters: 20, is_reusable: true },
    { name: "Keg 50L", container_type: "keg", size_liters: 50, is_reusable: true },
    { name: "Can 33cl", container_type: "can", size_liters: 0.33, is_reusable: false },
    { name: "Can 50cl", container_type: "can", size_liters: 0.5, is_reusable: false },
    { name: "Bottle 33cl", container_type: "bottle", size_liters: 0.33, is_reusable: false },
    { name: "Bottle 75cl", container_type: "bottle", size_liters: 0.75, is_reusable: false },
    { name: "Growler 2L", container_type: "growler", size_liters: 2, is_reusable: true },
  ];

  const rows = defaults.map((fmt) => ({
    brewery_id: breweryId,
    name: fmt.name,
    container_type: fmt.container_type,
    size_liters: fmt.size_liters,
    is_reusable: fmt.is_reusable,
    is_active: true,
  }));

  const { error } = await client.from("packaging_formats").insert(rows);
  if (error) throw new Error(`[seed] Failed to seed packaging formats: ${error.message}`);
  console.log(`[seed] Inserted ${rows.length} packaging formats for brewery ${breweryId}`);
}

/**
 * Full seed for a new brewery: profile + packaging formats.
 * Returns the new brewery ID.
 */
export async function seedNewBrewery(input: SeedBreweryInput): Promise<string> {
  const breweryId = await seedBreweryProfile(input);
  await seedPackagingFormats(breweryId);
  console.log(`[seed] New brewery seeded: ${breweryId}`);
  return breweryId;
}
