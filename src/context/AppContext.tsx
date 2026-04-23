import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import type { User, BreweryProfile } from "@/types/domain";
import type { Role, Permissions } from "@/types/permissions";
import { resolvePermissions } from "@/types/permissions";

export interface BreweryContext {
  breweryId: string;
  name: string;
  language: string;
  timezone: string;
  country: string;
  exciseEnabled: boolean;
  notionSourceId: string | null;
  role: Role;
}

interface AppContextValue {
  session: Session | null;
  user: User | null;
  brewery: BreweryProfile | null;
  breweryContext: BreweryContext | null;
  role: Role;
  permissions: Permissions;
  isLoading: boolean;
  isResolvingBrewery: boolean;
  hasNoBrewery: boolean;
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  setBrewery: (brewery: BreweryProfile | null) => void;
  setBreweryContext: (ctx: BreweryContext | null) => void;
  refreshBreweryContext: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function resolveBreweryContext(userId: string): Promise<BreweryContext | null> {
  const { data: brewery, error: breweryError } = await supabase
    .from("brewery_profiles")
    .select("id, name, language, timezone, country, emcs_enabled, notion_source_id")
    .single();

  if (breweryError || !brewery) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return {
    breweryId: (brewery as { id: string }).id,
    name: (brewery as { name: string }).name,
    language: (brewery as { language: string }).language ?? "en",
    timezone: (brewery as { timezone: string }).timezone ?? "UTC",
    country: (brewery as { country: string }).country ?? "",
    exciseEnabled: (brewery as { emcs_enabled: boolean }).emcs_enabled ?? false,
    notionSourceId: (brewery as { notion_source_id: string | null }).notion_source_id ?? null,
    role: ((userRow as { role: string } | null)?.role as Role) ?? "viewer",
  };
}

const DEMO_MODE_KEY = "operon_demo_mode";

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolvingBrewery, setIsResolvingBrewery] = useState(false);
  const [brewery, setBrewery] = useState<BreweryProfile | null>(null);
  const [breweryContextState, setBreweryContextState] = useState<BreweryContext | null>(null);
  const [hasNoBrewery, setHasNoBrewery] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(
    () => sessionStorage.getItem(DEMO_MODE_KEY) === "1"
  );

  const setBreweryContext = useCallback((ctx: BreweryContext | null) => {
    setBreweryContextState(ctx);
    setHasNoBrewery(ctx === null);
  }, []);

  const enterDemoMode = useCallback(() => {
    sessionStorage.setItem(DEMO_MODE_KEY, "1");
    setIsDemoMode(true);
  }, []);

  const exitDemoMode = useCallback(() => {
    sessionStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
  }, []);

  const refreshBreweryContext = useCallback(async () => {
    const currentSession = (await supabase.auth.getSession()).data.session;
    if (!currentSession?.user) {
      setBreweryContext(null);
      return;
    }

    setIsResolvingBrewery(true);
    try {
      const ctx = await resolveBreweryContext(currentSession.user.id);
      setBreweryContext(ctx);
    } catch {
      setBreweryContext(null);
    } finally {
      setIsResolvingBrewery(false);
    }
  }, [setBreweryContext]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      const s = data.session;
      setSession(s);
      if (s?.user) {
        setIsResolvingBrewery(true);
        try {
          const ctx = await resolveBreweryContext(s.user.id);
          if (mounted) setBreweryContext(ctx);
        } catch {
          if (mounted) setBreweryContext(null);
        } finally {
          if (mounted) setIsResolvingBrewery(false);
        }
      }
      if (mounted) setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;

      setSession(s);
      if (s?.user) {
        setIsResolvingBrewery(true);
        try {
          const ctx = await resolveBreweryContext(s.user.id);
          if (mounted) setBreweryContext(ctx);
        } catch {
          if (mounted) setBreweryContext(null);
        } finally {
          if (mounted) setIsResolvingBrewery(false);
        }
      } else if (mounted) {
        setBreweryContext(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setBreweryContext]);

  const role: Role = isDemoMode ? "viewer" : (breweryContextState?.role ?? "viewer");
  const permissions = resolvePermissions(role);

  const user: User | null = session?.user
    ? {
        id: session.user.id,
        breweryId: breweryContextState?.breweryId ?? "",
        email: session.user.email ?? "",
        displayName: session.user.user_metadata?.display_name ?? null,
        role,
        isActive: true,
        lastSeenAt: null,
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at ?? session.user.created_at,
      }
    : null;

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        brewery,
        breweryContext: breweryContextState,
        role,
        permissions,
        isLoading,
        isResolvingBrewery,
        hasNoBrewery,
        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        setBrewery,
        setBreweryContext,
        refreshBreweryContext,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

export function usePermissions(): Permissions {
  const { permissions } = useApp();
  return permissions;
}
