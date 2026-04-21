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

## Secrets

- `AIRTABLE_KEY` (required)
- `AIRTABLE_BASE_ID` is **not** stored as a secret; the frontend currently hardcodes the base via `BASE`.
- `NOTION_TOKEN` (required) — internal integration with the four databases shared.

## Notion databases consumed

- `716a5c2f-b909-4e87-8c82-7aad235bf75c` — App Semantic Graph (entities)
- `01c7b203-f8a8-492f-86f5-45e3ad7538b9` — App Semantic Links (relations)
- `2f8bd4cb-dcb5-4ed4-8cdb-a43bd37a5865` — App Semantic Links — Relational (key-based)
- `8cdb9495-fd8c-4727-8ddb-d7043edde09a` — Brasserie ... Semantic Links (legacy edges)

## Run / deploy

- Dev: `node server/index.js` on port 5000 (configured workflow).
- Deploy: autoscale, `node server/index.js`.
