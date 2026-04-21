import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEntities, loadLinks, loadGraph, loadReadiness,
  clearCache, whoami
} from "./notion-contract.js";
import { supabase } from "./supabase.js";
import { runMigration, validateMigration, getMigrationSql } from "./db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ---------- Airtable proxy (preserves contract from netlify/functions/airtable.js) ----------
app.post("/airtable", async (req, res) => {
  try {
    const { method = "GET", baseId, table, params = "", id, fields } = req.body || {};
    const apiKey = process.env.AIRTABLE_KEY;
    if (!apiKey) return res.status(500).json({ error: "AIRTABLE_KEY is not configured" });
    if (!baseId || !table) return res.status(400).json({ error: "baseId and table are required" });

    let p = encodeURIComponent(table);
    if (id) p += `/${encodeURIComponent(id)}`;
    if (params) p += params;

    const options = { method, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } };
    if (method === "PATCH" || method === "POST") options.body = JSON.stringify({ fields: fields || {} });

    const r = await fetch(`https://api.airtable.com/v0/${baseId}/${p}`, options);
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    res.status(500).json({ error: "Proxy request failed", detail: e.message });
  }
});

// ---------- Notion read-only API (returns normalized contract objects) ----------
function notionError(res, e) {
  console.error("[notion]", e.status || "", e.message);
  res.status(e.status || 500).json({ error: e.message, detail: e.body });
}

app.get("/notion/health", async (req, res) => {
  try {
    const me = await whoami();
    res.json({ ok: true, bot: me.name, workspace: me.bot?.workspace_name || null });
  } catch (e) { notionError(res, e); }
});

app.get("/notion/entities", async (req, res) => {
  try {
    const all = await loadEntities();
    let out = all;
    const { ruleGroup, entityClass, memoryLayer, layer, appRole, active } = req.query;
    if (ruleGroup) out = out.filter(e => e.ruleGroup === ruleGroup);
    if (entityClass) out = out.filter(e => e.entityClass === entityClass);
    if (memoryLayer) out = out.filter(e => e.memoryLayer === memoryLayer);
    if (layer) out = out.filter(e => e.layer === layer);
    if (appRole) out = out.filter(e => e.appRole === appRole);
    if (active === "true") out = out.filter(e => e.flags.active);
    res.json({ count: out.length, entities: out });
  } catch (e) { notionError(res, e); }
});

app.get("/notion/entities/:idOrKey", async (req, res) => {
  try {
    const { byId, byKey } = await loadGraph();
    const ent = byId.get(req.params.idOrKey) || byKey.get(req.params.idOrKey);
    if (!ent) return res.status(404).json({ error: "Entity not found" });
    res.json(ent);
  } catch (e) { notionError(res, e); }
});

app.get("/notion/links", async (req, res) => {
  try {
    const all = await loadLinks();
    let out = all;
    const { relationType, sourceKey, targetKey } = req.query;
    if (relationType) out = out.filter(l => l.relationType === relationType);
    if (sourceKey) out = out.filter(l => l.source.key === sourceKey);
    if (targetKey) out = out.filter(l => l.target.key === targetKey);
    res.json({ count: out.length, links: out });
  } catch (e) { notionError(res, e); }
});

app.get("/notion/readiness", async (req, res) => {
  try { res.json(await loadReadiness()); }
  catch (e) { notionError(res, e); }
});

app.get("/notion/graph", async (req, res) => {
  try {
    const { entities, links } = await loadGraph();
    res.json({ entities, links });
  } catch (e) { notionError(res, e); }
});

app.post("/notion/cache/clear", (req, res) => { clearCache(); res.json({ ok: true }); });

// ---------- Supabase: connectivity + schema migration ----------
app.get("/supabase/test", async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: "Supabase client not initialised — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" });
  }
  try {
    const { error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/supabase/schema", (req, res) => {
  try {
    const sql = getMigrationSql("001_initial_schema.sql");
    res.type("text/plain").send(sql);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/supabase/migrate/dry-run", async (req, res) => {
  try {
    const result = await validateMigration("001_initial_schema.sql");
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/supabase/migrate", async (req, res) => {
  try {
    const result = await runMigration("001_initial_schema.sql");
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ---------- Static assets ----------
app.use(express.static(ROOT, { extensions: ["html"] }));

const PORT = parseInt(process.env.PORT || "5000", 10);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`BreweryOS server listening on http://0.0.0.0:${PORT}`);
});
