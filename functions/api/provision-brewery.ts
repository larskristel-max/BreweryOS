// Cloudflare Pages Function — Brewery provisioning
// POST /api/provision-brewery → create brewery_profile + owner user
// Full implementation: Task #9

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true, message: "Brewery provisioning not yet implemented" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
