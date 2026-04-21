import { useLanguageContext } from "@/contexts/LanguageContext";
import { bundles } from "@/i18n";
import type { TranslationKeys } from "@/i18n";

type PathsToLeaves<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: T[K] extends string
        ? `${Prefix}${Prefix extends "" ? "" : "."}${K}`
        : PathsToLeaves<T[K], `${Prefix}${Prefix extends "" ? "" : "."}${K}`>;
    }[keyof T & string];

export type TranslationKey = PathsToLeaves<TranslationKeys>;

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function useTranslation() {
  const { language, bundle, setLanguage } = useLanguageContext();

  function t(key: TranslationKey): string {
    const value = getNestedValue(bundle as unknown as Record<string, unknown>, key);
    if (value !== undefined) return value;
    const fallback = getNestedValue(bundles.en as unknown as Record<string, unknown>, key);
    return fallback ?? key;
  }

  return { t, language, setLanguage };
}
