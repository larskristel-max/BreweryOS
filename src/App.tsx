import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function App() {
  const { session, breweryContext, isLoading, isDemoMode, enterDemoMode, exitDemoMode } = useApp();
  const { language, setLanguage } = useLanguage();

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Operon Core Foundation</h1>
      <p>Auth and data layers are wired for Supabase + Cloudflare semantic endpoints.</p>
      <p>Session: {session ? "authenticated" : "not authenticated"}</p>
      <p>Brewery: {breweryContext?.name ?? "not resolved"}</p>
      <p>Language: {language}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setLanguage("en")}>EN</button>
        <button onClick={() => setLanguage("fr")}>FR</button>
        <button onClick={() => (isDemoMode ? exitDemoMode() : enterDemoMode())}>
          {isDemoMode ? "Exit demo mode" : "Enter demo mode"}
        </button>
      </div>
      {isLoading && <p>Loading session…</p>}
    </main>
  );
}
