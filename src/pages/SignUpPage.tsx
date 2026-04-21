import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();
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
          Create your account
        </h1>
        <p style={{ textAlign: "center", fontSize: 14, color: "#6b7280" }}>
          Auth system coming soon.
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
            background: "transparent",
            color: "#111827",
            border: "1px solid #e5e7eb",
            fontFamily: "inherit",
          }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );
}
