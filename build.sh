#!/usr/bin/env bash
set -euo pipefail

# Ensure required env vars are set
: "${AIRTABLE_KEY:?AIRTABLE_KEY environment variable is required}"

mkdir -p dist

# Substitute placeholder with the actual key from Netlify env vars
sed "s|__AIRTABLE_KEY__|${AIRTABLE_KEY}|g" index.html > dist/index.html

echo "Build complete — dist/index.html ready"
