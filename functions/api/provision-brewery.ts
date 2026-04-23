import { verifySupabaseJwt, unauthorizedResponse, jsonResponse, type AuthEnv } from "../_shared/auth";

interface Env extends AuthEnv {
  SUPABASE_SERVICE_ROLE_KEY: string;
  NOTION_SOURCE_ID?: string;
}

interface ProvisionBody {
  name: string;
  language?: string;
  timezone?: string;
  country?: string;
  exciseEnabled?: boolean;
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
  const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) {
    const message =
      (json.message as string | undefined) ??
      (json.error as string | undefined) ??
      (json.hint as string | undefined) ??
      `RPC ${fn} failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

async function fetchAppMetadata(env: Env, userId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "GET",
    headers: adminHeaders(env),
  });
  if (!res.ok) return {};
  const user = (await res.json()) as SupabaseAdminUser;
  return user.app_metadata ?? {};
}

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

async function fetchNotionSourceId(env: Env, breweryId: string): Promise<string | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/brewery_profiles?id=eq.${breweryId}&select=notion_source_id`,
    { headers: adminHeaders(env) }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ notion_source_id?: string | null }>;
  return rows[0]?.notion_source_id ?? null;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  const authUser = await verifySupabaseJwt(request.headers.get("Authorization"), env);
  if (!authUser) return unauthorizedResponse();

  let body: ProvisionBody;
  try {
    body = (await request.json()) as ProvisionBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!body.name?.trim()) {
    return jsonResponse({ error: "Brewery name is required" }, 400);
  }

  const displayName =
    authUser.user_metadata?.display_name ??
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    (authUser.email ?? "").split("@")[0];

  let breweryId: string;
  try {
    const rpc = (await callRpc(env, "provision_brewery", {
      p_auth_user_id: authUser.id,
      p_user_name: displayName,
      p_user_email: authUser.email ?? "",
      p_brewery_name: body.name.trim(),
      p_country: body.country ?? "",
      p_language: body.language ?? "en",
      p_timezone: body.timezone ?? "UTC",
      p_emcs_enabled: body.exciseEnabled ?? false,
      p_notion_source_id: env.NOTION_SOURCE_ID ?? null,
    })) as { brewery_id?: string };

    if (!rpc.brewery_id) throw new Error("RPC returned no brewery_id");
    breweryId = rpc.brewery_id;
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Provisioning failed" }, 500);
  }

  try {
    await mergeAppMetadata(env, authUser.id, breweryId);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to set session context", breweryId }, 500);
  }

  const notionSourceId = await fetchNotionSourceId(env, breweryId);
  return jsonResponse({ ok: true, breweryId, notionSourceId }, 201);
}
