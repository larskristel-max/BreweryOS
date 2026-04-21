/**
 * RETIRED — This Express server is no longer the primary server.
 *
 * The application now runs as a Vite-built static SPA deployed to Cloudflare Pages.
 * - Development: `npm run dev` (Vite, port 5000)
 * - Build:        `npm run build` → dist/
 * - Deploy:       `wrangler pages deploy dist/`
 * - API routes:   Cloudflare Pages Functions in functions/api/
 *
 * Legacy Notion proxy, Supabase test endpoint, and Airtable proxy code is kept
 * below for reference only and is NOT active.
 */
console.error(
  "[server] server/index.js is retired. Run `npm run dev` instead."
);
process.exit(1);
