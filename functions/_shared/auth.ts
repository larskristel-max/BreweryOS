export interface AuthEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export interface VerifiedUser {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
}

export async function verifySupabaseJwt(
  authHeader: string | null,
  env: AuthEnv
): Promise<VerifiedUser | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    return null;
  }

  const user = (await res.json()) as VerifiedUser;
  return user?.id ? user : null;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function unauthorizedResponse(): Response {
  return jsonResponse({ error: "Unauthorized", detail: "Valid Supabase session required" }, 401);
}
