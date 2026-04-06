# BreweryOS

BreweryOS is a mobile-first brewery operations prototype.

It is currently a **single-file web app** built around a live Airtable-backed workflow for batches, brew logs, tasks, agenda items, and financial views.

## What this repo currently is

Today, the app is primarily:

- `index.html` — main application UI, styles, and client-side logic

This means the current app is **not yet split into separate frontend files or a structured app framework**. HTML, CSS, JavaScript, Airtable access, and semantic runtime logic are all currently living in one file.

That is acceptable for prototype speed, but it increases fragility.

## What the app does

The current prototype includes:

- language selection and entry flow
- home screen with “What’s next”, active batches, agenda preview, and financial preview
- batches list and batch detail screens
- brew-day logging flow
- agenda screen
- financial screen
- settings screen
- tasks screen
- semantic readiness logic for process runs

## Data sources

The app is currently wired to:

- Airtable for operational data
- a semantic layer in the frontend that normalizes statuses and computes readiness
- experimental frontend-side Notion/Anthropic semantic loading hooks

## Important reality of the current architecture

This repo is in **prototype / stabilization** state, not clean production architecture.

Known characteristics:

- single-file app architecture
- mixed live data and demo data in parts of the UI
- some client-side business logic is coupled directly to Airtable responses
- semantic logic exists, but parts of it are still hardcoded fallback logic
- there are signs of layered AI patching over time

## Branching and deployment

Current important behavior:

- Netlify production deploys from `main`
- do **not** assume the GitHub default branch is the production branch
- treat `main` as the live branch unless deployment settings are changed

Recommended workflow:

1. create or use a working branch
2. make targeted changes
3. review carefully
4. merge into `main`
5. let Netlify publish from `main`

## Safety note before editing

Because the app currently lives in one file, avoid random broad edits.

Preferred approach:

- make narrow, well-scoped changes
- verify element IDs carefully
- avoid mixing visual cleanup with major logic rewrites unless intentional
- keep semantic logic changes isolated and explicit

## Current priorities

Stabilization should come before major feature expansion.

Recommended near-term priorities:

1. fix DOM mismatches and fragile UI bindings
2. keep Home screen layout stable and mobile-first
3. reduce contradictions between demo data and live data
4. verify Airtable key/runtime behavior
5. gradually split the app into cleaner files later

## Longer-term direction

A healthier structure later would look more like:

- `index.html`
- `styles/`
- `scripts/`
- `config/`
- `data/`
- `semantic/`

But that should happen as a controlled refactor, not as a chaotic rewrite.

## Plain-language summary

This repo is a real working BrewOS prototype, but it is still held together in a very compressed format.

It already contains useful operational logic.
It also needs careful stabilization so future work does not become harder every time something new is added.
