// Cloudflare Pages Function — Brewery provisioning
// POST /api/provision-brewery
// 1. Verifies Supabase JWT
// 2. Calls provision_brewery() SQL RPC (atomic: brewery + user + packaging formats; idempotent)
// 3. Fetches current app_metadata and MERGES brewery_id (does not overwrite other keys)
// Returns { breweryId, notionSourceId } on success

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Optional server-owned Notion integration source ID.
  // Set this in environment variables to connect all breweries to the same Notion workspace.
  // Clients NEVER supply this value — it is server-assigned only.
  NOTION_SOURCE_ID?: string;
}

interface ProvisionBody {
  name: string;
  language?: string;
  timezone?: string;
  country?: string;
  exciseEnabled?: boolean;
  // notionSourceId intentionally NOT accepted from client — assigned server-side from env
}

interface SupabaseAdminUser {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
}

async function verifyAndGetUser(
  authHeader: string | null,
  env: Env
): Promise<{ valid: false } | { valid: true; userId: string; email: string; displayName: string }> {
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };
  const token = authHeader.slice(7);
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return { valid: false };
    const user = await res.json() as SupabaseAdminUser;
    if (!user?.id) return { valid: false };
    const displayName =
      user.user_metadata?.display_name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      (user.email ?? "").split("@")[0];
    return { valid: true, userId: user.id, email: user.email ?? "", displayName };
  } catch {
    return { valid: false };
  }
}

function adminHeaders(env: Env): Record<string, string> {
  return {
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
  };
}

async function callRpc(env: Env, fn: string, params: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      ...adminHeaders(env),
      Prefer: "return=representation",
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const errMsg =
      (json as { message?: string })?.message ??
      (json as { error?: string })?.error ??
      (json as { hint?: string })?.hint ??
      `RPC ${fn} failed (${res.status})`;
    throw new Error(errMsg);
  }
  return json;
}

// Fetch the user's current app_metadata so we can merge into it (not overwrite)
async function fetchAppMetadata(env: Env, userId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "GET",
    headers: adminHeaders(env),
  });
  if (!res.ok) return {};
  const user = await res.json() as SupabaseAdminUser;
  return user.app_metadata ?? {};
}

// Merges brewery_id into existing app_metadata (preserves any other keys)
async function mergeAppMetadata(env: Env, userId: string, breweryId: string): Promise<void> {
  const existing = await fetchAppMetadata(env, userId);
  const merged = { ...existing, brewery_id: breweryId };
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: adminHeaders(env),
    body: JSON.stringify({ app_metadata: merged }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to merge app_metadata: ${text}`);
  }
}

// Also resolve notion_source_id from brewery_profiles (service role bypasses RLS)
async function fetchNotionSourceId(env: Env, breweryId: string): Promise<string | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/brewery_profiles?id=eq.${breweryId}&select=notion_source_id`,
    { headers: adminHeaders(env) }
  );
  if (!res.ok) return null;
  const rows = await res.json() as Array<{ notion_source_id?: string | null }>;
  return rows[0]?.notion_source_id ?? null;
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  const authResult = await verifyAndGetUser(request.headers.get("Authorization"), env);
  if (!authResult.valid) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  const { userId, email, displayName } = authResult;

  let body: ProvisionBody;
  try {
    body = await request.json() as ProvisionBody;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!body.name?.trim()) {
    return new Response(
      JSON.stringify({ error: "Brewery name is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 1: Call the idempotent atomic SQL RPC.
  // If user already has a brewery (previous partial failure), RPC returns existing brewery_id.
  // notionSourceId is server-assigned from NOTION_SOURCE_ID env var — never from client body.
  let breweryId: string;
  try {
    const rpcResult = await callRpc(env, "provision_brewery", {
      p_auth_user_id: userId,
      p_user_name: displayName,
      p_user_email: email,
      p_brewery_name: body.name.trim(),
      p_country: body.country ?? "",
      p_language: body.language ?? "en",
      p_timezone: body.timezone ?? "UTC",
      p_emcs_enabled: body.exciseEnabled ?? false,
      p_notion_source_id: env.NOTION_SOURCE_ID ?? null,
    }) as { brewery_id: string };

    breweryId = rpcResult.brewery_id;
    if (!breweryId) throw new Error("RPC returned no brewery_id");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provisioning failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 2: Merge brewery_id into app_metadata (safe merge — does not overwrite other keys).
  // The RPC is idempotent, so on retry after a metadata failure the DB row already exists
  // and we simply re-attempt the metadata update.
  try {
    await mergeAppMetadata(env, userId, breweryId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set session context";
    return new Response(
      JSON.stringify({ error: message, breweryId }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 3: Resolve notion_source_id to return to the client
  const notionSourceId = await fetchNotionSourceId(env, breweryId);

  return new Response(
    JSON.stringify({ ok: true, breweryId, notionSourceId }),
    { status: 201, headers: { "Content-Type": "application/json" } }
  );
}
