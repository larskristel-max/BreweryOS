import { verifySupabaseJwt, unauthorizedResponse, jsonResponse, type AuthEnv } from "../../_shared/auth";
import { notionWhoAmI, type NotionEnv } from "../../_shared/notion";

type Env = AuthEnv & NotionEnv;

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const user = await verifySupabaseJwt(request.headers.get("Authorization"), env);
  if (!user) return unauthorizedResponse();

  try {
    const me = (await notionWhoAmI(env)) as { name?: string; bot?: { workspace_name?: string } };
    return jsonResponse({ ok: true, bot: me.name ?? null, workspace: me.bot?.workspace_name ?? null });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Notion health check failed" }, 502);
  }
}
