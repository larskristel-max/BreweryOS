import en from "./en";
import fr from "./fr";
import nl from "./nl";
import de from "./de";
import type { TranslationKeys } from "./types";

export type SupportedLanguage = "en" | "fr" | "nl" | "de";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["en", "fr", "nl", "de"];

export const LANGUAGE_STORAGE_KEY = "operon_language";

export const bundles: Record<SupportedLanguage, TranslationKeys> = {
  en,
  fr,
  nl,
  de,
};

export { en, fr, nl, de };
export type { TranslationKeys };
