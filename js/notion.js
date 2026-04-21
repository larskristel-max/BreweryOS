// Read-only Notion client. Consumes normalized contract objects from the backend.
// UI code must use these helpers — never the raw Notion API.

async function notionGet(path, params) {
  const url = new URL(path, window.location.origin);
  if (params) for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
  }
  const r = await fetch(url.toString(), { method: "GET" });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data?.error || `Notion request failed (${r.status})`);
    err.status = r.status;
    err.detail = data?.detail;
    throw err;
  }
  return data;
}

window.notion = {
  health:    ()        => notionGet("/notion/health"),
  entities:  (filter)  => notionGet("/notion/entities", filter).then(d => d.entities),
  entity:    (idOrKey) => notionGet(`/notion/entities/${encodeURIComponent(idOrKey)}`),
  links:     (filter)  => notionGet("/notion/links", filter).then(d => d.links),
  graph:     ()        => notionGet("/notion/graph"),
  readiness: ()        => notionGet("/notion/readiness"),

  // Convenience selectors mapped to the existing semantic areas
  productFoundations: () => window.notion.entities({ memoryLayer: "domain_knowledge" }),
  systemEntities:     () => window.notion.entities({ entityClass: "System" }),
  controlEntities:    () => window.notion.entities({ entityClass: "Control" }),
  executionReadiness: () => window.notion.entities({ ruleGroup: "execution_readiness" })
};
