# Operon BrewOS

Brewery management app. React + TypeScript + Tailwind frontend built with Vite, deployed to Cloudflare Pages. Backend concerns are Cloudflare Pages Functions. Operational data reads/writes go directly from the frontend to Supabase (RLS-enforced).

## Architecture

- **Frontend**: React + TypeScript + Vite (Tailwind v4 via `@tailwindcss/vite`)
- **Routing**: React Router v7 (`BrowserRouter`)
- **App shell**: `src/components/AppShell.tsx` — consolidated nav + FAB + Outlet
- **UI components**: `src/components/ui/` — full iOS-like design system (see below)
- **State**: `src/context/AppContext.tsx` — session, brewery, role, permissions
- **i18n**: `src/contexts/LanguageContext.tsx` + `src/hooks/useTranslation.ts` — typed translation context supporting EN/FR/NL/DE. All UI strings accessed via `useTranslation()` hook with English fallback. Language persisted in `localStorage` under key `operon_language`.
- **Language gate**: `src/components/LanguageGate.tsx` — intercepts first launch if no language set; full-screen selector; smooth fade transition into app shell on tap.
- **Supabase client**: `src/lib/supabase.ts` — initialized with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Notion API client**: `src/api/notion.ts` — typed fetch wrapper calling `/api/notion/*`
- **Domain types**: `src/types/domain.ts` — all entities in the canonical chain
- **Pages Functions**: `functions/api/` — stub handlers, full implementation in Task #9
- **Deployment**: Cloudflare Pages via `wrangler pages deploy dist/`
- **Animations**: Framer Motion (`framer-motion`) — BottomSheet, Modal
- **Icons**: Phosphor Icons (`@phosphor-icons/react`) — Regular weight for nav/list, Bold for FAB/CTAs

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

## Design System (`src/components/ui/`)

Premium iOS-like design system. All components exported from `src/components/ui/index.ts`.

### Design Tokens

**Token source:** Tailwind v4 uses a `@theme` block in `src/index.css` (not `tailwind.config.ts` — Tailwind v4 does not use a config file). Custom `--color-*`, `--radius-*`, `--shadow-*` CSS variables defined in `@theme` automatically become Tailwind utility classes (`bg-*`, `text-*`, `rounded-*`, `shadow-*`). All component sizing uses Tailwind arbitrary values or `@theme`-backed utilities — no raw inline styles.

**Files:** `src/index.css` (`@theme` block), `src/styles/globals.css` (CSS utilities: `.tab-bar-blur`, `.skeleton-shimmer`, `.interactive`, `.page-enter`, `.spinner`, `.tabular`)

**Colors:**
- Page background: `#F2F2F7` (iOS grouped background)
- Card/surface: `#FFFFFF` with `shadow-sm` (1px 3px rgba(0,0,0,0.08))
- Accent amber: `#B45309` + `rgba(180,83,9,0.10)` tint
- Status: Success `#34C759`, Warning `#FF9500`, Danger `#FF3B30`, Info `#007AFF` — each with 10% opacity variant
- Text: Primary `#000000`, Secondary `rgba(60,60,67,0.6)`, Tertiary `rgba(60,60,67,0.3)`, Placeholder `rgba(60,60,67,0.25)`
- Hairline: `rgba(0,0,0,0.08)`

**Typography (iOS SF Pro rhythm):**
- Display: 34px/700, Title: 28px/700, Title2: 22px/700
- Headline: 17px/600, Body: 17px/400, Callout: 16px/400
- Subhead: 15px/400, Footnote: 13px/400, Caption: 11px/400
- Font stack: `-apple-system, BlinkMacSystemFont, 'Inter', sans-serif`

**Spacing:** 4px base grid. Page horizontal margin 16px. Section gap 28px. Min row height 44px.

**Radii:** Cards 16px, Inputs 10px, Buttons 12px, Chips 999px, Sheets 24px.

### Components

| Component | File | Description |
|-----------|------|-------------|
| `PageLayout` | `PageLayout.tsx` | Full page wrapper with page-enter animation and 16px padding |
| `PageHeader` | `PageHeader.tsx` | Large-title iOS header; animates compact on scroll; optional back chevron + right action |
| `SectionHeader` | `SectionHeader.tsx` | Uppercase 11px iOS section label with optional action button |
| `Card` | `Card.tsx` | White surface, rounded-2xl, shadow-sm, standard padding |
| `GroupedList` | `GroupedList.tsx` | Container for ListRow items with inset hairline dividers between rows |
| `ListRow` | `ListRow.tsx` | 44px min-height row: icon slot, label, optional value + chevron; press state |
| `StatusChip` | `StatusChip.tsx` | Pill chips: success/warning/danger/info/neutral; 10% opacity bg |
| `StatCard` | `StatCard.tsx` | Metric display: large tabular number, unit, title label |
| `Button` | `Button.tsx` | primary (amber solid) / secondary (amber tint) / ghost variants; 44px min height |
| `IconButton` | `IconButton.tsx` | 44×44 circular button; primary/secondary/ghost variants |
| `FAB` | `FAB.tsx` | 56px amber FAB with spring shadow + press scale animation |
| `TabBar` | `TabBar.tsx` | Bottom nav: frosted glass, amber active, Phosphor icons |
| `BottomSheet` | `BottomSheet.tsx` | Framer Motion spring sheet: drag handle, drag-to-dismiss, spring stiffness 400 damping 40 |
| `Modal` | `Modal.tsx` | Centered dialog with spring-scale entry; backdrop dismiss |
| `Skeleton` | `Skeleton.tsx` | Shimmer loading state; `SkeletonCard` variant |
| `EmptyState` | `EmptyState.tsx` | Centered icon + title + body + optional CTA |
| `ToastProvider` / `useToast` | `Toast.tsx` | Pill toasts; auto-dismiss 3s; success/warning/danger/info; Framer Motion |
| `Divider` | `Divider.tsx` | 1px hairline rgba(0,0,0,0.08); optional inset |

### Interactions

- All tappable elements: `active:scale-[0.97] transition-transform duration-100` via `.interactive` class
- Page transitions: `page-enter` keyframe (200ms fade + 16px vertical slide)
- BottomSheet: spring (stiffness 400, damping 40); drag-to-dismiss
- Color transitions: `transition-colors duration-200` globally
- Tabular numbers: `.tabular` utility class (`font-variant-numeric: tabular-nums`)

## Auth, Multi-Tenancy & Roles

- **AuthGate**: `src/components/AuthGate.tsx` — wraps entire app; no session → redirect /signin; no brewery → show OnboardingWizard; session + brewery → render children; `isDemoMode` bypasses all auth checks (UI only — backend RLS still enforced)
- **Demo mode**: `AppContext.isDemoMode` persisted in `sessionStorage` key `"operon_demo"`. Enter via `enterDemoMode()` (called by "Try demo" on SignInPage), exit via `exitDemoMode()`. Provides `DEMO_BREWERY` context + static data from `src/data/demo.ts`. Demo mode must never grant access to protected backend mutations — all real Supabase writes still require a valid session.
- **OnboardingWizard**: `src/components/OnboardingWizard.tsx` — multi-step: brewery name/language/timezone/country/excise → calls `/api/provision-brewery` → confirms completion
- **Permissions**: `src/types/permissions.ts` — `Role` type, `Permissions` interface, `resolvePermissions(role)`, `escalationMessage(action)`, role threshold map
- **PermissionGuard**: `src/components/PermissionGuard.tsx` — `<CanDo action="...">`, `<RequiresRole action="..." explanation="...">` UI utilities
- **AppContext** (extended): session, user, breweryContext (`BreweryContext`), role, permissions, isResolvingBrewery, hasNoBrewery, refreshBreweryContext
- **SignInPage**: Email/password + Google OAuth via Supabase; form validation and error display
- **SignUpPage**: Email/password signup + Google OAuth; optional display name; confirmation screen

## Cloudflare Pages Functions

- `functions/api/notion/[[path]].ts` — Notion proxy: verifies Supabase JWT via Authorization header; proxies to Notion API; returns 401 if unauthenticated
- `functions/api/provision-brewery.ts` — Brewery provisioning: verifies JWT; uses SUPABASE_SERVICE_ROLE_KEY to insert brewery + brewery_users (owner role) + seed packaging formats
- `functions/api/ai/intent.ts` — AI intent router (Task #8)
- `functions/api/ai/transcribe.ts` — audio transcription (Task #8)

## Supabase Schema

Tables (all multi-brewery, RLS-enforced):
`brewery_profiles`, `packaging_formats`, `ingredients`, `ingredient_receipts`, `recipes`, `recipe_ingredients`, `recipe_mash_steps`, `recipe_boil_additions`, `users`, `batches`, `batch_inputs`, `brew_logs`, `mash_steps`, `boil_additions`, `fermentation_checks`, `lots`, `sales`, `declarations`, `inventory_movements`, `tasks`, `pending_movements`, `issues`, `event_logs`.

Schema migrations at `server/db/`:
- `001_initial_schema.sql` — full table definitions + triggers
- `002_rls_policies.sql` — Row Level Security policies for every table

## Data Layer

- **Typed query helpers**: `src/api/db.ts` — `getBatches()`, `getBatch(id)`, `createBatch()`, `updateBatch()`, `getLots()`, etc. All RLS-enforced via the anon client.
- **DB row types**: `DbBreweryProfile`, `DbBatch`, `DbLot`, etc. in `src/api/db.ts`
- **Domain mappers**: DB rows mapped to `src/types/domain.ts` shapes inside `src/api/db.ts`

## Migration & Seeding

- **Airtable migration**: `scripts/migrate-from-airtable.js` — one-time migration with dry-run mode. Requires `AIRTABLE_KEY`, `AIRTABLE_BASE_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BREWERY_ID`.
- **Seed helpers**: `server/seed.ts` — `seedNewBrewery()`, `seedBreweryProfile()`, `seedPackagingFormats()` used by Task #9 provisioning.

## Secrets Required

- `VITE_SUPABASE_URL` — Supabase project URL (browser-safe, set as env var)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (browser-safe, set as env var)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only, Pages Functions)
- `NOTION_TOKEN` — Notion integration token (Pages Functions)
- `AIRTABLE_KEY` — Airtable API key (migration script only)

## Legacy

`server/index.js` — Express server, retired. Not on the critical path. Vite + Cloudflare Pages Functions is the active architecture.
`js/airtable.js` — Legacy Airtable proxy client. No longer called by React UI code. Retained as reference; removed from the active data path.
`netlify/functions/airtable.js` — Legacy Netlify function proxy. Not used in active Pages deployment.
