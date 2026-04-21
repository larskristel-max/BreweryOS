// Cloudflare Pages Function — Audio transcription
// POST /api/ai/transcribe → Whisper transcription → text
// Full implementation: Task #8 (AI voice router)

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true, message: "AI transcription not yet implemented" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
