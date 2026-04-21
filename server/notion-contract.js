const NOTION_VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

export const DB = {
  GRAPH: "716a5c2f-b909-4e87-8c82-7aad235bf75c",
  LINKS: "01c7b203-f8a8-492f-86f5-45e3ad7538b9",
  LINKS_RELATIONAL: "2f8bd4cb-dcb5-4ed4-8cdb-a43bd37a5865",
  SEMANTIC_LINKS_LEGACY: "8cdb9495-fd8c-4727-8ddb-d7043edde09a"
};

function authHeaders() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN is not configured");
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json"
  };
}

async function notionFetch(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(), ...(init.headers || {}) } });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(json?.message || `Notion ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function queryAll(databaseId) {
  const out = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const j = await notionFetch(`/databases/${databaseId}/query`, { method: "POST", body: JSON.stringify(body) });
    if (j.results) out.push(...j.results);
    cursor = j.has_more ? j.next_cursor : undefined;
  } while (cursor);
  return out;
}

const plain = (rich) => (rich || []).map(t => t.plain_text).join("");
function readProp(p) {
  if (!p) return null;
  switch (p.type) {
    case "title": return plain(p.title);
    case "rich_text": return plain(p.rich_text);
    case "select": return p.select?.name ?? null;
    case "multi_select": return (p.multi_select || []).map(x => x.name);
    case "status": return p.status?.name ?? null;
    case "checkbox": return !!p.checkbox;
    case "number": return p.number ?? null;
    case "unique_id": return p.unique_id ? `${p.unique_id.prefix || ""}${p.unique_id.number}` : null;
    case "relation": return (p.relation || []).map(r => r.id);
    case "created_time": return p.created_time;
    case "last_edited_time": return p.last_edited_time;
    default: return null;
  }
}

// ---------- Normalization (the app contract) ----------

/**
 * Normalized SemanticEntity shape.
 * UI code consumes ONLY this shape — never raw Notion property objects.
 */
export function normalizeEntity(page) {
  const P = page.properties || {};
  return {
    id: page.id,
    key: readProp(P["Entity Key"]) || null,
    name: readProp(P["Entity Name"]) || "(untitled)",
    description: readProp(P["Description"]) || "",
    layer: readProp(P["Layer"]) || null,
    memoryLayer: readProp(P["Memory Layer"]) || null,
    entityClass: readProp(P["Entity Class"]) || null,
    canonicalObjectType: readProp(P["Canonical Object Type"]) || null,
    canonicalWorkflowType: readProp(P["Canonical Workflow Type"]) || null,
    ruleGroup: readProp(P["Rule Group"]) || null,
    appRole: readProp(P["App Role"]) || null,
    workspaceRole: readProp(P["Workspace Role"]) || null,
    entityId: readProp(P["Entity ID"]) || null,
    displayLabel: readProp(P["Display Label"]) || null,
    localAlias: readProp(P["Local Alias"]) || null,
    semanticConfidence: readProp(P["Semantic Confidence"]) || null,
    sourceNote: readProp(P["Source Note"]) || "",
    flags: {
      active: readProp(P["Active"]) ?? false,
      isReadinessDriver: readProp(P["Is Readiness Driver"]) ?? false,
      requiresDispatch: readProp(P["Requires Dispatch"]) ?? false,
      requiresClosure: readProp(P["Requires Closure"]) ?? false,
      tracksDensity: readProp(P["Tracks Density"]) ?? false,
      appComputed: readProp(P["App Computed"]) ?? false,
      appendUnderOriginal: readProp(P["Append Under Original"]) ?? false,
      preserveSourceFile: readProp(P["Preserve Source File"]) ?? false
    },
    airtable: {
      target: readProp(P["Airtable Target"]) || null,
      fieldName: readProp(P["Airtable Field Name"]) || null
    },
    status: readProp(P["Status"]) || null,
    createdTime: readProp(P["Created"]) || page.created_time,
    lastEditedTime: readProp(P["Last Edited"]) || page.last_edited_time
  };
}

/**
 * Normalized SemanticLink shape.
 * Sources/targets carry both Notion ids (where available) and string keys.
 */
export function normalizeLink(page, { variant }) {
  const P = page.properties || {};
  const sourceIds = readProp(P["Source Entity"]) || [];
  const targetIds = readProp(P["Target Entity"]) || [];
  return {
    id: page.id,
    variant, // "relation" | "key" | "legacy"
    name: readProp(P["Link Name"]) || "(unnamed)",
    relationType: readProp(P["Relation Type"]) || null,
    source: {
      ids: sourceIds,
      key: readProp(P["Source Entity Key"]) || null
    },
    target: {
      ids: targetIds,
      key: readProp(P["Target Entity Key"]) || null
    },
    weight: readProp(P["Reasoning Weight"]) ?? null,
    confidence: readProp(P["Confidence"]) || null,
    note: readProp(P["Reasoning Note"]) || "",
    description: readProp(P["Description"]) || "",
    status: readProp(P["Status"]) || null,
    createdTime: readProp(P["Created"]) || page.created_time,
    lastEditedTime: page.last_edited_time
  };
}

// ---------- Cached loaders ----------

const TTL_MS = 60 * 1000;
const cache = new Map(); // key -> { at, value }

async function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = await loader();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function clearCache() { cache.clear(); }

export async function loadEntities() {
  return cached("entities", async () => {
    const pages = await queryAll(DB.GRAPH);
    return pages.map(normalizeEntity);
  });
}

export async function loadLinks() {
  return cached("links", async () => {
    const [a, b, c] = await Promise.all([
      queryAll(DB.LINKS).catch(() => []),
      queryAll(DB.LINKS_RELATIONAL).catch(() => []),
      queryAll(DB.SEMANTIC_LINKS_LEGACY).catch(() => [])
    ]);
    return [
      ...a.map(p => normalizeLink(p, { variant: "relation" })),
      ...b.map(p => normalizeLink(p, { variant: "key" })),
      ...c.map(p => normalizeLink(p, { variant: "legacy" }))
    ];
  });
}

// ---------- Derived views ----------

export async function loadGraph() {
  const [entities, links] = await Promise.all([loadEntities(), loadLinks()]);
  const byId = new Map(entities.map(e => [e.id, e]));
  const byKey = new Map(entities.filter(e => e.key).map(e => [e.key, e]));
  return { entities, links, byId, byKey };
}

export async function loadReadiness() {
  const { entities, links } = await loadGraph();
  const drivers = entities.filter(e => e.ruleGroup === "execution_readiness" || e.flags.isReadinessDriver);
  const driverIds = new Set(drivers.map(d => d.id));
  const related = links.filter(l =>
    l.source.ids.some(id => driverIds.has(id)) ||
    l.target.ids.some(id => driverIds.has(id))
  );
  return { drivers, links: related };
}

export async function whoami() {
  return notionFetch("/users/me");
}
