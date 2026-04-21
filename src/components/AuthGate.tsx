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
    isDemoMode,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

  useEffect(() => {
    // Demo mode bypasses all auth checks
    if (isDemoMode) return;
    if (isLoading || isResolvingBrewery) return;

    if (!session) {
      if (!isAuthRoute) navigate("/signin", { replace: true });
      return;
    }

    if (isAuthRoute) {
      navigate("/", { replace: true });
    }
  }, [session, isLoading, isResolvingBrewery, isAuthRoute, navigate, isDemoMode]);

  // Demo mode: always render children normally
  if (isDemoMode) {
    return <>{children}</>;
  }

  if (isLoading || isResolvingBrewery) {
    return <LoadingScreen message="Loading…" />;
  }

  if (!session) {
    if (isAuthRoute) return <>{children}</>;
    return <LoadingScreen message="Redirecting…" />;
  }

  if (isAuthRoute) {
    return <LoadingScreen message="Loading…" />;
  }

  if (hasNoBrewery) {
    function handleOnboardingComplete(ctx: BreweryContext) {
      setBreweryContext(ctx);
    }
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return <>{children}</>;
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-page">
      <div className="spinner" />
      <span className="text-subhead text-secondary">{message}</span>
    </div>
  );
}
