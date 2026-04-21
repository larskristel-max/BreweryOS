// Cloudflare Pages Function — Notion proxy
// Implements GET /api/notion/* → Notion API → normalized contract objects
// Full implementation: Task #9

export async function onRequest() {
  return new Response(JSON.stringify({ ok: true, message: "Notion proxy not yet implemented" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
