const NOTION_VERSION = "2022-06-28";
const API = "https://api.notion.com/v1";

export interface NotionEnv {
  NOTION_API_KEY: string;
  NOTION_DB_GRAPH: string;
  NOTION_DB_LINKS: string;
  NOTION_DB_LINKS_RELATIONAL: string;
  NOTION_DB_SEMANTIC_LINKS_LEGACY?: string;
}

export interface SemanticEntity {
  id: string;
  key: string | null;
  name: string;
  description: string;
  layer: string | null;
  memoryLayer: string | null;
  entityClass: string | null;
  canonicalObjectType: string | null;
  canonicalWorkflowType: string | null;
  ruleGroup: string | null;
  appRole: string | null;
  workspaceRole: string | null;
  entityId: string | null;
  displayLabel: string | null;
  localAlias: string | null;
  semanticConfidence: number | null;
  sourceNote: string;
  flags: {
    active: boolean;
    isReadinessDriver: boolean;
    requiresDispatch: boolean;
    requiresClosure: boolean;
    tracksDensity: boolean;
    appComputed: boolean;
    appendUnderOriginal: boolean;
    preserveSourceFile: boolean;
  };
  airtable: {
    target: string | null;
    fieldName: string | null;
  };
  status: string | null;
  createdTime: string | null;
  lastEditedTime: string | null;
}

export interface SemanticLink {
  id: string;
  variant: "relation" | "key" | "legacy";
  name: string;
  relationType: string | null;
  source: { ids: string[]; key: string | null };
  target: { ids: string[]; key: string | null };
  weight: number | null;
  confidence: string | null;
  note: string;
  description: string;
  status: string | null;
  createdTime: string | null;
  lastEditedTime: string | null;
}

function notionHeaders(env: NotionEnv): Record<string, string> {
  return {
    Authorization: `Bearer ${env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

async function notionFetch(env: NotionEnv, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...notionHeaders(env),
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : {};
  if (!res.ok) {
    const message = (body as { message?: string })?.message ?? `Notion ${res.status}`;
    throw new Error(message);
  }

  return body;
}

async function queryAll(env: NotionEnv, databaseId: string): Promise<Array<Record<string, unknown>>> {
  const out: Array<Record<string, unknown>> = [];
  let cursor: string | undefined;

  do {
    const payload: { page_size: number; start_cursor?: string } = { page_size: 100 };
    if (cursor) payload.start_cursor = cursor;

    const page = (await notionFetch(env, `/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify(payload),
    })) as {
      results?: Array<Record<string, unknown>>;
      has_more?: boolean;
      next_cursor?: string;
    };

    if (page.results) out.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);

  return out;
}

const plain = (rich: Array<{ plain_text?: string }> | undefined): string =>
  (rich ?? []).map((t) => t.plain_text ?? "").join("");

function readProp(prop: Record<string, unknown> | undefined): unknown {
  if (!prop) return null;
  switch (prop.type) {
    case "title":
      return plain(prop.title as Array<{ plain_text?: string }> | undefined);
    case "rich_text":
      return plain(prop.rich_text as Array<{ plain_text?: string }> | undefined);
    case "select":
      return (prop.select as { name?: string } | null)?.name ?? null;
    case "multi_select":
      return ((prop.multi_select as Array<{ name?: string }> | undefined) ?? []).map((x) => x.name ?? "");
    case "status":
      return (prop.status as { name?: string } | null)?.name ?? null;
    case "checkbox":
      return Boolean(prop.checkbox);
    case "number":
      return (prop.number as number | null | undefined) ?? null;
    case "unique_id": {
      const value = prop.unique_id as { prefix?: string; number?: number } | null;
      return value?.number !== undefined ? `${value.prefix ?? ""}${value.number}` : null;
    }
    case "relation":
      return ((prop.relation as Array<{ id: string }> | undefined) ?? []).map((r) => r.id);
    case "created_time":
      return (prop.created_time as string | undefined) ?? null;
    case "last_edited_time":
      return (prop.last_edited_time as string | undefined) ?? null;
    default:
      return null;
  }
}

function normalizeEntity(page: Record<string, unknown>): SemanticEntity {
  const properties = (page.properties as Record<string, Record<string, unknown>> | undefined) ?? {};

  return {
    id: page.id as string,
    key: (readProp(properties["Entity Key"]) as string | null) ?? null,
    name: (readProp(properties["Entity Name"]) as string | null) ?? "(untitled)",
    description: (readProp(properties["Description"]) as string | null) ?? "",
    layer: (readProp(properties["Layer"]) as string | null) ?? null,
    memoryLayer: (readProp(properties["Memory Layer"]) as string | null) ?? null,
    entityClass: (readProp(properties["Entity Class"]) as string | null) ?? null,
    canonicalObjectType: (readProp(properties["Canonical Object Type"]) as string | null) ?? null,
    canonicalWorkflowType: (readProp(properties["Canonical Workflow Type"]) as string | null) ?? null,
    ruleGroup: (readProp(properties["Rule Group"]) as string | null) ?? null,
    appRole: (readProp(properties["App Role"]) as string | null) ?? null,
    workspaceRole: (readProp(properties["Workspace Role"]) as string | null) ?? null,
    entityId: (readProp(properties["Entity ID"]) as string | null) ?? null,
    displayLabel: (readProp(properties["Display Label"]) as string | null) ?? null,
    localAlias: (readProp(properties["Local Alias"]) as string | null) ?? null,
    semanticConfidence: (readProp(properties["Semantic Confidence"]) as number | null) ?? null,
    sourceNote: (readProp(properties["Source Note"]) as string | null) ?? "",
    flags: {
      active: (readProp(properties["Active"]) as boolean | null) ?? false,
      isReadinessDriver: (readProp(properties["Is Readiness Driver"]) as boolean | null) ?? false,
      requiresDispatch: (readProp(properties["Requires Dispatch"]) as boolean | null) ?? false,
      requiresClosure: (readProp(properties["Requires Closure"]) as boolean | null) ?? false,
      tracksDensity: (readProp(properties["Tracks Density"]) as boolean | null) ?? false,
      appComputed: (readProp(properties["App Computed"]) as boolean | null) ?? false,
      appendUnderOriginal: (readProp(properties["Append Under Original"]) as boolean | null) ?? false,
      preserveSourceFile: (readProp(properties["Preserve Source File"]) as boolean | null) ?? false,
    },
    airtable: {
      target: (readProp(properties["Airtable Target"]) as string | null) ?? null,
      fieldName: (readProp(properties["Airtable Field Name"]) as string | null) ?? null,
    },
    status: (readProp(properties["Status"]) as string | null) ?? null,
    createdTime: (readProp(properties["Created"]) as string | null) ?? ((page.created_time as string | undefined) ?? null),
    lastEditedTime:
      (readProp(properties["Last Edited"]) as string | null) ??
      ((page.last_edited_time as string | undefined) ?? null),
  };
}

function normalizeLink(page: Record<string, unknown>, variant: SemanticLink["variant"]): SemanticLink {
  const properties = (page.properties as Record<string, Record<string, unknown>> | undefined) ?? {};
  const sourceIds = (readProp(properties["Source Entity"]) as string[] | null) ?? [];
  const targetIds = (readProp(properties["Target Entity"]) as string[] | null) ?? [];

  return {
    id: page.id as string,
    variant,
    name: (readProp(properties["Link Name"]) as string | null) ?? "(unnamed)",
    relationType: (readProp(properties["Relation Type"]) as string | null) ?? null,
    source: {
      ids: sourceIds,
      key: (readProp(properties["Source Entity Key"]) as string | null) ?? null,
    },
    target: {
      ids: targetIds,
      key: (readProp(properties["Target Entity Key"]) as string | null) ?? null,
    },
    weight: (readProp(properties["Reasoning Weight"]) as number | null) ?? null,
    confidence: (readProp(properties["Confidence"]) as string | null) ?? null,
    note: (readProp(properties["Reasoning Note"]) as string | null) ?? "",
    description: (readProp(properties["Description"]) as string | null) ?? "",
    status: (readProp(properties["Status"]) as string | null) ?? null,
    createdTime: (readProp(properties["Created"]) as string | null) ?? ((page.created_time as string | undefined) ?? null),
    lastEditedTime: (page.last_edited_time as string | undefined) ?? null,
  };
}

export async function loadEntities(env: NotionEnv): Promise<SemanticEntity[]> {
  const pages = await queryAll(env, env.NOTION_DB_GRAPH);
  return pages.map(normalizeEntity);
}

export async function loadLinks(env: NotionEnv): Promise<SemanticLink[]> {
  const [relations, keys, legacy] = await Promise.all([
    queryAll(env, env.NOTION_DB_LINKS).catch(() => []),
    queryAll(env, env.NOTION_DB_LINKS_RELATIONAL).catch(() => []),
    env.NOTION_DB_SEMANTIC_LINKS_LEGACY ? queryAll(env, env.NOTION_DB_SEMANTIC_LINKS_LEGACY).catch(() => []) : Promise.resolve([]),
  ]);

  return [
    ...relations.map((page) => normalizeLink(page, "relation")),
    ...keys.map((page) => normalizeLink(page, "key")),
    ...legacy.map((page) => normalizeLink(page, "legacy")),
  ];
}

export async function loadGraph(env: NotionEnv): Promise<{ entities: SemanticEntity[]; links: SemanticLink[] }> {
  const [entities, links] = await Promise.all([loadEntities(env), loadLinks(env)]);
  return { entities, links };
}

export async function loadReadiness(env: NotionEnv): Promise<{ entities: SemanticEntity[]; links: SemanticLink[] }> {
  const { entities, links } = await loadGraph(env);
  const drivers = entities.filter((e) => e.ruleGroup === "execution_readiness" || e.flags.isReadinessDriver);
  const driverIds = new Set(drivers.map((d) => d.id));
  const related = links.filter(
    (l) => l.source.ids.some((id) => driverIds.has(id)) || l.target.ids.some((id) => driverIds.has(id))
  );
  return { entities: drivers, links: related };
}

export async function notionWhoAmI(env: NotionEnv): Promise<unknown> {
  return notionFetch(env, "/users/me");
}
