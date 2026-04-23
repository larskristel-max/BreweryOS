import { verifySupabaseJwt, unauthorizedResponse, jsonResponse, type AuthEnv } from "../../_shared/auth";
import { loadEntities, type NotionEnv, type SemanticEntity } from "../../_shared/notion";

type Env = AuthEnv & NotionEnv;

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const user = await verifySupabaseJwt(request.headers.get("Authorization"), env);
  if (!user) return unauthorizedResponse();

  const url = new URL(request.url);
  const ruleGroup = url.searchParams.get("ruleGroup");
  const entityClass = url.searchParams.get("entityClass");
  const memoryLayer = url.searchParams.get("memoryLayer");
  const layer = url.searchParams.get("layer");
  const appRole = url.searchParams.get("appRole");
  const active = url.searchParams.get("active");

  let entities: SemanticEntity[] = [];
  try {
    entities = await loadEntities(env);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to load entities" }, 502);
  }

  const filtered = entities.filter((entity) => {
    if (ruleGroup && entity.ruleGroup !== ruleGroup) return false;
    if (entityClass && entity.entityClass !== entityClass) return false;
    if (memoryLayer && entity.memoryLayer !== memoryLayer) return false;
    if (layer && entity.layer !== layer) return false;
    if (appRole && entity.appRole !== appRole) return false;
    if (active === "true" && !entity.flags.active) return false;
    if (active === "false" && entity.flags.active) return false;
    return true;
  });

  return jsonResponse({ entities: filtered });
}
