import { useState, useEffect, useRef } from "react";
import { LANGUAGE_STORAGE_KEY, type SupportedLanguage } from "@/i18n";
import { useLanguageContext } from "@/contexts/LanguageContext";

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

function hasStoredLanguage(): boolean {
  try {
    return !!localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return false;
  }
}

export function LanguageGate({ children }: { children: React.ReactNode }) {
  const [needsSelection, setNeedsSelection] = useState(() => !hasStoredLanguage());
  const [visible, setVisible] = useState(true);
  const { setLanguage } = useLanguageContext();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleSelect(code: SupportedLanguage) {
    setLanguage(code);
    setVisible(false);
    timerRef.current = setTimeout(() => {
      setNeedsSelection(false);
    }, 360);
  }

  if (!needsSelection) {
    return <>{children}</>;
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
        background: "#fff",
        zIndex: 9999,
        padding: "32px 24px calc(32px + env(safe-area-inset-bottom, 0px))",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.36s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#111827",
              letterSpacing: "-0.03em",
              margin: "0 0 10px",
              lineHeight: 1.15,
            }}
          >
            Operon
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#6b7280",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Choose your language · Kies uw taal
          </p>
        </div>

        {LANGUAGE_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            onClick={() => handleSelect(opt.code)}
            style={{
              width: "100%",
              padding: "18px 20px",
              borderRadius: 18,
              fontSize: 18,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              cursor: "pointer",
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#111827",
              fontFamily: "inherit",
              textAlign: "left",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
