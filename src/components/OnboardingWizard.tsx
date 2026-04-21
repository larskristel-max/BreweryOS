import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { BreweryContext } from "@/context/AppContext";
import type { Role } from "@/types/permissions";

interface OnboardingWizardProps {
  onComplete: (ctx: BreweryContext) => void;
}

type Step = "brewery_info" | "provisioning" | "done";

const TIMEZONES = [
  "Europe/Brussels",
  "Europe/Amsterdam",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Prague",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
  "Asia/Tokyo",
  "UTC",
];

const COUNTRIES = [
  { code: "BE", label: "Belgium" },
  { code: "NL", label: "Netherlands" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "GB", label: "United Kingdom" },
  { code: "CZ", label: "Czech Republic" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "JP", label: "Japan" },
  { code: "OTHER", label: "Other" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<Step>("brewery_info");
  const [breweryName, setBreweryName] = useState("");
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Europe/Brussels");
  const [country, setCountry] = useState("BE");
  const [exciseEnabled, setExciseEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    if (!breweryName.trim()) return;
    setStep("provisioning");
    setProvisioning(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/provision-brewery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: breweryName.trim(),
          language,
          timezone,
          country,
          exciseEnabled,
          // notionSourceId is server-assigned only — not sent by client
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Provisioning failed (${res.status})`);
      }

      // Refresh the JWT so app_metadata.brewery_id is included in future requests.
      // This is required for RLS policies (auth_brewery_id() reads from app_metadata).
      await supabase.auth.refreshSession();

      const ctx: BreweryContext = {
        breweryId: data.breweryId,
        name: breweryName.trim(),
        language,
        timezone,
        country,
        exciseEnabled,
        // Use the server-returned notionSourceId (may differ if brewery already existed)
        notionSourceId: (data.notionSourceId as string | null) ?? null,
        role: "owner" as Role,
      };

      setStep("done");
      setTimeout(() => onComplete(ctx), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("brewery_info");
      setProvisioning(false);
    }
  }

  const inputStyle: React.CSSProperties = {
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
    appearance: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
  };

  if (step === "provisioning") {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <Spinner />
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>
                Setting up {breweryName}
              </h2>
              <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
                Creating your brewery and seeding starter data…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#f0fdf4",
                border: "2px solid #bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: "#16a34a",
              }}
            >
              ✓
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>
                {breweryName} is ready
              </h2>
              <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
                Opening your brewery dashboard…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...cardStyle, maxWidth: 480 }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Set up your brewery
          </h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: 0 }}>
            This takes about 30 seconds. You can change everything later.
          </p>
        </div>

        <form onSubmit={handleProvision} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>Brewery name</label>
            <input
              type="text"
              value={breweryName}
              onChange={(e) => setBreweryName(e.target.value)}
              placeholder="e.g. De Gouden Hop"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={inputStyle}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={inputStyle}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={labelStyle}>Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={inputStyle}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              cursor: "pointer",
            }}
            onClick={() => setExciseEnabled(!exciseEnabled)}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#111827" }}>Excise duty tracking</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                Enable if your brewery is subject to excise (accijns / accises)
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                background: exciseEnabled ? "#111827" : "#d1d5db",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: exciseEnabled ? 21 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </div>
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
            disabled={provisioning || !breweryName.trim()}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 600,
              cursor: provisioning || !breweryName.trim() ? "default" : "pointer",
              border: "none",
              background: !breweryName.trim() ? "#e5e7eb" : "#111827",
              color: !breweryName.trim() ? "#9ca3af" : "#fff",
              fontFamily: "inherit",
              marginTop: 6,
            }}
          >
            Create my brewery
          </button>
        </form>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#fff",
  padding: "24px 20px calc(24px + env(safe-area-inset-bottom, 0px))",
  overflowY: "auto",
  zIndex: 9000,
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 400,
};

function Spinner() {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "3px solid #e5e7eb",
        borderTopColor: "#111827",
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
