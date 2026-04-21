import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, BreweryProfile, UserRole, PermissionMap, Permission } from "@/types/domain";
import type { Session } from "@supabase/supabase-js";

function derivePermissions(role: UserRole): PermissionMap {
  const all: Permission[] = [
    "batches:read", "batches:write",
    "recipes:read", "recipes:write",
    "inventory:read", "inventory:write",
    "sales:read", "sales:write",
    "declarations:read", "declarations:write",
    "settings:read", "settings:write",
    "users:read", "users:write",
  ];

  const readOnly: Permission[] = [
    "batches:read", "recipes:read", "inventory:read",
    "sales:read", "declarations:read",
  ];

  if (role === "owner" || role === "brewmaster_admin") {
    return Object.fromEntries(all.map((p) => [p, true])) as PermissionMap;
  }
  if (role === "brewer" || role === "assistant") {
    const allowed = new Set<Permission>([
      "batches:read", "batches:write",
      "recipes:read",
      "inventory:read", "inventory:write",
      "sales:read",
      "declarations:read",
    ]);
    return Object.fromEntries(all.map((p) => [p, allowed.has(p)])) as PermissionMap;
  }
  // viewer
  return Object.fromEntries(all.map((p) => [p, readOnly.includes(p)])) as PermissionMap;
}

interface AppContextValue {
  session: Session | null;
  user: User | null;
  brewery: BreweryProfile | null;
  role: UserRole;
  permissions: PermissionMap;
  isLoading: boolean;
  setBrewery: (brewery: BreweryProfile | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [brewery, setBrewery] = useState<BreweryProfile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Placeholder role — will be resolved from DB in Auth task
  const role: UserRole = "owner";
  const permissions = derivePermissions(role);

  // Derive a lightweight User object from Supabase session
  const user: User | null = session?.user
    ? {
        id: session.user.id,
        breweryId: brewery?.id ?? "",
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
      value={{ session, user, brewery, role, permissions, isLoading, setBrewery }}
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
