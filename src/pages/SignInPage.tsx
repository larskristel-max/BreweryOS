import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

export default function SignInPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 16 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#111827",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 18,
          }}
        >
          {t("auth.welcome")}
        </h1>
        <button
          onClick={() => navigate("/")}
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
          }}
        >
          {t("auth.signIn")}
        </button>
        <button
          onClick={() => navigate("/signup")}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 16,
            fontSize: 17,
            fontWeight: 600,
            cursor: "pointer",
            background: "transparent",
            color: "#111827",
            border: "1px solid #e5e7eb",
            fontFamily: "inherit",
          }}
        >
          {t("auth.createAccount")}
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            color: "#9ca3af",
            fontSize: 15,
            cursor: "pointer",
            marginTop: 8,
            fontFamily: "inherit",
          }}
        >
          {t("auth.continueAsDemo")}
        </button>
      </div>
    </div>
  );
}
