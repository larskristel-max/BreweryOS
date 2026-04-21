// Cloudflare Pages Function — Notion proxy
// GET|POST /api/notion/* → verifies Supabase JWT → proxies to Notion API

interface Env {
  NOTION_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const NOTION_VERSION = "2022-06-28";
const NOTION_BASE = "https://api.notion.com/v1";

async function verifySupabaseJwt(
  authHeader: string | null,
  env: Env
): Promise<{ valid: boolean; userId?: string }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false };
  }
  const token = authHeader.slice(7);
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return { valid: false };
    const user = await res.json() as { id?: string };
    if (!user?.id) return { valid: false };
    return { valid: true, userId: user.id };
  } catch {
    return { valid: false };
  }
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params: { path?: string[] };
}): Promise<Response> {
  const { request, env, params } = context;

  const authResult = await verifySupabaseJwt(
    request.headers.get("Authorization"),
    env
  );

  if (!authResult.valid) {
    return new Response(
      JSON.stringify({ error: "Unauthorized", detail: "Valid Supabase session required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const pathSegments = params.path ?? [];
  const notionPath = pathSegments.join("/");
  const url = new URL(request.url);
  const notionUrl = `${NOTION_BASE}/${notionPath}${url.search}`;

  const notionHeaders: Record<string, string> = {
    Authorization: `Bearer ${env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const init: RequestInit = {
    method: request.method,
    headers: notionHeaders,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const notionRes = await fetch(notionUrl, init);
    const body = await notionRes.text();

    return new Response(body, {
      status: notionRes.status,
      headers: {
        "Content-Type": notionRes.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Notion proxy error", detail: String(err) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
