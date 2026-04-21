# BreweryOS

Brewery management app. Static frontend (`index.html` + `js/`) backed by a small Node/Express server that proxies to the operational + semantic data layers.

## Architecture

- **Operational facts layer** → Airtable (existing bases).
  Browser → `POST /airtable` → Airtable REST API. Contract preserved 1:1 from `netlify/functions/airtable.js`.

- **Semantic / rules / readiness layer** → Notion (existing workspace, read-only for now).
  Browser → `GET /notion/*` → Notion API → normalized into the app contract types defined in `server/notion-contract.js`. **UI never sees raw Notion shapes.**

## Notion app contract

`SemanticEntity` (from `App Semantic Graph`):
`id, key, name, description, layer, memoryLayer, entityClass, canonicalObjectType, canonicalWorkflowType, ruleGroup, appRole, workspaceRole, entityId, displayLabel, localAlias, semanticConfidence, sourceNote, flags{active,isReadinessDriver,requiresDispatch,requiresClosure,tracksDensity,appComputed,...}, airtable{target,fieldName}, status, createdTime, lastEditedTime`

`SemanticLink` (from `App Semantic Links`, `App Semantic Links — Relational`, `Brasserie ... Semantic Links`):
`id, variant, name, relationType, source{ids,key}, target{ids,key}, weight, confidence, note, description, status, createdTime, lastEditedTime`

## Notion endpoints (read-only)

- `GET /notion/health` — token + workspace check
- `GET /notion/entities?ruleGroup=&entityClass=&memoryLayer=&layer=&appRole=&active=true`
- `GET /notion/entities/:idOrKey`
- `GET /notion/links?relationType=&sourceKey=&targetKey=`
- `GET /notion/graph` — entities + links bundle
- `GET /notion/readiness` — execution-readiness drivers + connected links
- `POST /notion/cache/clear` — invalidate the 60s in-memory cache

## Frontend client

`js/notion.js` exposes `window.notion` with methods that match the endpoints (`entities`, `entity`, `links`, `graph`, `readiness`, `health`) plus convenience selectors (`productFoundations`, `executionReadiness`, `controlEntities`, `systemEntities`).

## Supabase (operational DB backbone)

- **Client**: `server/supabase.js` — service-role client, server-side only, never exposed to browser.
- **Schema**: `server/db/001_initial_schema.sql` — 23 tables, 14 ENUMs, updated_at triggers. Applied manually via Supabase Dashboard SQL Editor. RLS enabled on all tables.
- **Tables**: `brewery_profiles`, `packaging_formats`, `ingredients`, `ingredient_receipts`, `recipes`, `recipe_malts/hops/misc`, `users`, `batches`, `batch_inputs`, `brew_logs`, `mash_steps`, `boil_additions`, `fermentation_checks`, `lots`, `sales`, `declarations`, `inventory_movements`, `tasks`, `pending_movements`, `issues`, `event_logs`.
- **Endpoint**: `GET /supabase/test` — confirms service-role client is live.
- **Access pattern**: all reads/writes go through `server/supabase.js` using the service-role key; RLS is bypassed server-side intentionally.

## Secrets

- `AIRTABLE_KEY` (required)
- `AIRTABLE_BASE_ID` is **not** stored as a secret; the frontend currently hardcodes the base via `BASE`.
- `NOTION_TOKEN` (required) — internal integration with the four databases shared.
- `SUPABASE_URL` (required) — project URL.
- `SUPABASE_ANON_KEY` (required) — public anon key.
- `SUPABASE_SERVICE_ROLE_KEY` (required) — service role key for server-side access.

## Notion databases consumed

- `716a5c2f-b909-4e87-8c82-7aad235bf75c` — App Semantic Graph (entities)
- `01c7b203-f8a8-492f-86f5-45e3ad7538b9` — App Semantic Links (relations)
- `2f8bd4cb-dcb5-4ed4-8cdb-a43bd37a5865` — App Semantic Links — Relational (key-based)
- `8cdb9495-fd8c-4727-8ddb-d7043edde09a` — Brasserie ... Semantic Links (legacy edges)

## Run / deploy

- Dev: `node server/index.js` on port 5000 (configured workflow).
- Deploy: autoscale, `node server/index.js`.
