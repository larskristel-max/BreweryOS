import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { Card, Button, Divider } from "@/components/ui";

export default function SignInPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { enterDemoMode } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      navigate("/");
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

  function handleTryDemo() {
    enterDemoMode();
    navigate("/");
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-y-auto bg-page
                    px-5 pt-6 pb-[calc(24px+env(safe-area-inset-bottom,0px))]">
      <div className="w-full max-w-[400px] flex flex-col gap-4">

        {/* Header */}
        <div className="text-center mb-2">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-primary m-0 mb-1.5">
            {t("auth.welcome")}
          </h1>
          <p className="text-subhead text-secondary m-0">Operon BrewOS</p>
        </div>

        {/* Sign-in card */}
        <Card padding="p-5" className="flex flex-col gap-3.5">
          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-footnote font-medium text-secondary">
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brewery.com"
                autoComplete="email"
                required
                className="w-full px-3.5 py-3 rounded-[10px] border border-hairline
                           text-[16px] font-[inherit] text-primary bg-page outline-none
                           focus:border-amber transition-colors"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-footnote font-medium text-secondary">
                  {t("auth.password")}
                </label>
                <span className="text-footnote text-amber cursor-default">
                  {t("auth.forgotPassword")}
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-3.5 py-3 rounded-[10px] border border-hairline
                           text-[16px] font-[inherit] text-primary bg-page outline-none
                           focus:border-amber transition-colors"
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-[10px] bg-danger-tint text-danger-text text-footnote">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? t("common.loading") : t("auth.signIn")}
            </Button>
          </form>

          <Divider />

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 rounded-button border border-hairline bg-surface text-primary
                       text-headline font-medium font-[inherit] cursor-pointer
                       flex items-center justify-center gap-2.5
                       interactive [WebkitTapHighlightColor:transparent]
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {googleLoading ? t("common.loading") : "Continue with Google"}
          </button>
        </Card>

        {/* Try demo */}
        <Card padding="p-1">
          <Button variant="secondary" onClick={handleTryDemo}>
            <span className="flex flex-col items-center gap-0.5">
              <span className="font-semibold">Try demo</span>
              <span className="text-footnote font-normal opacity-70">
                Explore with Hopsburg Brewing Co. — no sign-up needed
              </span>
            </span>
          </Button>
        </Card>

        {/* Sign up link */}
        <button
          onClick={() => navigate("/signup")}
          className="bg-transparent border-0 text-secondary text-subhead cursor-pointer
                     font-[inherit] text-center"
        >
          No account?{" "}
          <span className="text-amber font-medium">{t("auth.createAccount")}</span>
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.859-3.048.859-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
