import { verifySupabaseJwt, unauthorizedResponse, jsonResponse, type AuthEnv } from "../../_shared/auth";
import { loadReadiness, type NotionEnv } from "../../_shared/notion";

type Env = AuthEnv & NotionEnv;

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const user = await verifySupabaseJwt(request.headers.get("Authorization"), env);
  if (!user) return unauthorizedResponse();

  try {
    return jsonResponse(await loadReadiness(env));
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to load readiness" }, 502);
  }
}
