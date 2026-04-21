# Operon BrewOS

Brewery management app. React + TypeScript + Tailwind frontend built with Vite, deployed to Cloudflare Pages. Backend concerns are Cloudflare Pages Functions. Operational data reads/writes go directly from the frontend to Supabase (RLS-enforced).

## Architecture

- **Frontend**: React + TypeScript + Vite (Tailwind v4 via `@tailwindcss/vite`)
- **Routing**: React Router v7 (`BrowserRouter`)
- **App shell**: `src/components/AppShell.tsx` + `src/components/BottomNav.tsx`
- **State**: `src/context/AppContext.tsx` — session, brewery, role, permissions
- **Supabase client**: `src/lib/supabase.ts` — initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Notion API client**: `src/api/notion.ts` — typed fetch wrapper calling `/api/notion/*`
- **Domain types**: `src/types/domain.ts` — all entities in the canonical chain
- **Pages Functions**: `functions/api/` — stub handlers, full implementation in Task #9
- **Deployment**: Cloudflare Pages via `wrangler pages deploy dist/`

## Development

```
npm run dev      # Vite dev server on port 5000
npm run build    # TypeScript check + Vite build → dist/
npm run preview  # Preview dist/ locally
```

The Express server (`server/index.js`) is no longer on the critical path. Development uses `vite dev`.

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `OperationsPage` | Main dashboard |
| `/brew` | `BrewPage` | Let's Brew assistant |
| `/batches` | `BatchesPage` | Batch list |
| `/batches/:id` | `BatchDetailPage` | Batch detail |
| `/recipes` | `RecipesPage` | Recipe library |
| `/recipes/new` | `RecipeNewPage` | Recipe builder |
| `/recipes/:id` | `RecipeDetailPage` | Recipe detail |
| `/settings` | `SettingsPage` | Settings |
| `/signin` | `SignInPage` | Auth (no shell) |
| `/signup` | `SignUpPage` | Auth (no shell) |

## Design Tokens (Tailwind v4 CSS `@theme`)

Defined in `src/index.css`:
- **Ink scale**: `--color-ink-900` (#111827), `--color-ink-800` (#1f2937), `--color-ink-700` (#374151)
- **State colors**: green (#22c55e), yellow (#eab308), red (#ef4444), orange (#ea580c), blue (#3b82f6)
- **Backgrounds**: white main, soft (#eaf0f5), page (#f8f9fb)
- **Radius**: card (16px), btn (16px), dock (26px)
- **Font sizes**: screen-title (24px), section-title (13px), card-title (16px), body (14px), meta (11px)

## Cloudflare Pages Functions (stubs)

- `functions/api/notion/[[path]].ts` — Notion proxy (Task #9)
- `functions/api/provision-brewery.ts` — brewery provisioning (Task #9)
- `functions/api/ai/intent.ts` — AI intent router (Task #8)
- `functions/api/ai/transcribe.ts` — audio transcription (Task #8)

## Supabase Schema

Tables (all multi-brewery, RLS-enforced):
`brewery_profiles`, `packaging_formats`, `ingredients`, `ingredient_receipts`, `recipes`, `recipe_malts`, `recipe_hops`, `recipe_misc`, `users`, `batches`, `batch_inputs`, `brew_logs`, `mash_steps`, `boil_additions`, `fermentation_checks`, `lots`, `sales`, `declarations`, `inventory_movements`, `tasks`, `pending_movements`, `issues`, `event_logs`.

Schema at: `server/db/001_initial_schema.sql`

## Secrets Required

- `VITE_SUPABASE_URL` — Supabase project URL (browser-safe)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only, Pages Functions)
- `NOTION_TOKEN` — Notion integration token (Pages Functions)
- `AIRTABLE_KEY` — Airtable API key (legacy, still used by server/index.js)

## Legacy

`server/index.js` — Express server, no longer the primary server for the app. Kept for reference. Was replaced by Vite + Cloudflare Pages Functions architecture.
