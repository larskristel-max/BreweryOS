# BreweryOS

Static HTML brewery management app, originally hosted on Netlify.

## Replit Setup
- Served via `python3 -m http.server 5000 --bind 0.0.0.0` workflow.
- Deployment: static, publishing root directory.

## Notes
- The Airtable proxy in `netlify/functions/airtable.js` only runs on Netlify (requires `AIRTABLE_KEY`). It is not active on Replit's static deployment.
