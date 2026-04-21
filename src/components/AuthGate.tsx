import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import type { BreweryContext } from "@/context/AppContext";

interface AuthGateProps {
  children: React.ReactNode;
}

const AUTH_ROUTES = ["/signin", "/signup"];

export function AuthGate({ children }: AuthGateProps) {
  const {
    session,
    isLoading,
    isResolvingBrewery,
    hasNoBrewery,
    breweryContext,
    setBreweryContext,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    if (isLoading || isResolvingBrewery) return;

    if (!session) {
      // Unauthenticated: send to /signin unless already there
      if (!isAuthRoute) navigate("/signin", { replace: true });
      return;
    }

    // Authenticated: redirect away from auth routes
    if (isAuthRoute) {
      navigate("/", { replace: true });
    }
  }, [session, isLoading, isResolvingBrewery, isAuthRoute, navigate]);

  // While auth state or brewery context is loading
  if (isLoading || isResolvingBrewery) {
    return <LoadingScreen message="Loading…" />;
  }

  // No session: render auth pages directly, all others get a redirect spinner
  if (!session) {
    if (isAuthRoute) return <>{children}</>;
    return <LoadingScreen message="Redirecting…" />;
  }

  // Session exists but on auth route: brief redirect indicator
  if (isAuthRoute) {
    return <LoadingScreen message="Loading…" />;
  }

  // Session exists, not on an auth route, but no brewery linked → show onboarding
  if (hasNoBrewery) {
    function handleOnboardingComplete(ctx: BreweryContext) {
      setBreweryContext(ctx);
    }
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // Fully resolved — brewery context present, render app
  return <>{children}</>;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "2.5px solid #e5e7eb",
          borderTopColor: "#111827",
          animation: "spin 0.8s linear infinite",
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <span style={{ fontSize: 15, color: "#6b7280" }}>{message}</span>
    </div>
  );
}
