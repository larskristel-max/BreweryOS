import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { bundles, LANGUAGE_STORAGE_KEY, type SupportedLanguage, type TranslationKeys } from "@/i18n";

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  bundle: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLanguage(): SupportedLanguage | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "fr" || stored === "nl" || stored === "de") {
      return stored;
    }
  } catch {
  }
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(
    () => getStoredLanguage() ?? "en"
  );

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
    }
    setLanguageState(lang);
  }, []);

  const bundle = bundles[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, bundle }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguageContext must be used within a LanguageProvider");
  }
  return ctx;
}
