import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || undefined },
      },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px",
          background: "#fff",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em" }}>
            Check your email
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.5 }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <button
            onClick={() => navigate("/signin")}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              background: "#111827",
              color: "#fff",
              fontFamily: "inherit",
              marginTop: 8,
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 0px))",
        background: "#fff",
        overflowY: "auto",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#111827",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            {t("auth.createAccount")}
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>Set up your brewery on Operon</p>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 500,
            cursor: googleLoading ? "default" : "pointer",
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#111827",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <GoogleIcon />
          {googleLoading ? t("common.loading") : "Continue with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
          <span style={{ fontSize: 13, color: "#9ca3af" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
        </div>

        <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
              Name <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jan De Brouwer"
              autoComplete="name"
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                fontFamily: "inherit",
                color: "#111827",
                background: "#f9fafb",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@brewery.com"
              autoComplete="email"
              required
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                fontFamily: "inherit",
                color: "#111827",
                background: "#f9fafb",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                fontFamily: "inherit",
                color: "#111827",
                background: "#f9fafb",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              border: "none",
              background: loading ? "#9ca3af" : "#111827",
              color: "#fff",
              fontFamily: "inherit",
              marginTop: 4,
            }}
          >
            {loading ? t("common.loading") : t("auth.signUp")}
          </button>
        </form>

        <button
          onClick={() => navigate("/signin")}
          style={{
            background: "none",
            border: "none",
            color: "#6b7280",
            fontSize: 15,
            cursor: "pointer",
            marginTop: 4,
            fontFamily: "inherit",
            textAlign: "center",
          }}
        >
          Already have an account?{" "}
          <span style={{ color: "#111827", fontWeight: 500 }}>{t("auth.signIn")}</span>
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
