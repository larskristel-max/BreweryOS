# Stabilization Notes

## Confirmed issue fixed next

The Home screen batch loader currently targets the wrong DOM id in the stabilization branch code review snapshot:

- code targets: `home-batches`
- actual element id: `home-batch-list`

This mismatch should be corrected before merge.

## Stabilization branch purpose

This branch exists to make BreweryOS safer before more feature layering.

## What has already improved on this branch

- neutralized visual system
- reduced blue drift
- cleaner access and language screens
- better mobile baseline
- README added
- safer documentation for future edits

## Remaining stabilization tasks

1. fix Home batch binding mismatch
2. scan for similar DOM id mismatches
3. verify home render flow after boot
4. ensure language flow and entry flow do not conflict
5. keep merge scope surgical

## Important rule

Do not merge broad new features into `main` until the Home binding and related fragile UI issues are resolved.
