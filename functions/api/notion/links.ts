import { verifySupabaseJwt, unauthorizedResponse, jsonResponse, type AuthEnv } from "../../_shared/auth";
import { loadLinks, type NotionEnv } from "../../_shared/notion";

type Env = AuthEnv & NotionEnv;

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const user = await verifySupabaseJwt(request.headers.get("Authorization"), env);
  if (!user) return unauthorizedResponse();

  const url = new URL(request.url);
  const relationType = url.searchParams.get("relationType");
  const sourceKey = url.searchParams.get("sourceKey");
  const targetKey = url.searchParams.get("targetKey");

  try {
    const links = await loadLinks(env);
    const filtered = links.filter((link) => {
      if (relationType && link.relationType !== relationType) return false;
      if (sourceKey && link.source.key !== sourceKey) return false;
      if (targetKey && link.target.key !== targetKey) return false;
      return true;
    });
    return jsonResponse({ links: filtered });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Failed to load links" }, 502);
  }
}
