// Cloudflare Pages Function — AI intent router
// POST /api/ai/intent → parse natural-language brew intent
// Full implementation: Task #8 (AI voice router)

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true, message: "AI intent router not yet implemented" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
