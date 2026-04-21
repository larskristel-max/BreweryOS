import { supabase } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";
import { ROLE_LABELS } from "@/types/permissions";
import { CanDo } from "@/components/PermissionGuard";

export default function SettingsPage() {
  const { breweryContext, role } = useApp();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/signin";
  }

  return (
    <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827", margin: 0 }}>
          Settings
        </h1>
        {breweryContext && (
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            {breweryContext.name} · {ROLE_LABELS[role]}
          </p>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {breweryContext && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              color: "#374151",
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Brewery details</div>
            <div style={{ color: "#6b7280", lineHeight: 1.6 }}>
              <div>Country: {breweryContext.country}</div>
              <div>Language: {breweryContext.language}</div>
              <div>Timezone: {breweryContext.timezone}</div>
              <div>Excise duty: {breweryContext.exciseEnabled ? "Enabled" : "Disabled"}</div>
              {breweryContext.notionSourceId && (
                <div>Notion source: {breweryContext.notionSourceId}</div>
              )}
            </div>
          </div>
        )}

        <CanDo action="canManageSettings">
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              color: "#374151",
              fontWeight: 500,
            }}
          >
            Brewery settings
          </div>
        </CanDo>

        <CanDo action="canManageUsers">
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              fontSize: 14,
              color: "#374151",
              fontWeight: 500,
            }}
          >
            Manage team members
          </div>
        </CanDo>
      </div>

      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <button
          onClick={handleSignOut}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid #fecaca",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: 15,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "center",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
