# Operon Foundation Pass

## Product-facing renames applied
- Brewery OS → Operon (document title, onboarding, entry CTAs, in-app brand lockups).
- App metadata now uses Operon with the tagline `vos opérations brassicoles`.
- PWA manifest identity updated to Operon.

## Remaining legacy references (intentional for compatibility)
- `brewos_*` localStorage keys are retained to avoid breaking existing persisted user state.
- `brewos` legacy identity key is retained in `PRODUCT_CONFIG.identity.legacyKeys`.
- Repository/folder name (`BreweryOS`) remains unchanged in this phase.

## New canonical domain model skeleton
- BreweryProfile
- PackagingFormat
- Ingredient
- Receipt
- Batch
- BrewLog
- Lot
- PendingMovement
- InventoryMovement
- Sale
- Declaration
- EventLog

## Logo asset usage
- Source asset: `/assets/branding/operon-logo.svg`
- Header brand lockup (`#app-brand-header`)
- Splash/loading lockup (`#app-brand-splash`)
- Web app icons (favicon, apple-touch-icon, manifest icon)

## Follow-on recommended phases
1. Rebuild Operations screen UI around `OperationsHomeContract` sections with action-first prioritization.
2. Move remaining inline literals to translation keys and complete locale-specific operational vocabulary.
3. Replace legacy storage keys with migration-safe Operon keys once persistence migration tooling exists.
4. Add TypeScript interfaces mirroring canonical model and contract files during TS/Tailwind rebuild.
