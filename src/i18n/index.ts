import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ha from "./locales/ha.json";
import ig from "./locales/ig.json";
import yo from "./locales/yo.json";

/**
 * Supported UI languages.
 *
 * English is the complete, authoritative locale. Yoruba/Hausa/Igbo are marked
 * `beta: true` — they are partially translated and NOT professionally verified,
 * so the UI labels them as Beta and never presents them as reviewed. Any key
 * missing from a locale safely falls back to English (`fallbackLng`).
 *
 * To add a language (e.g. Nigerian Pidgin, `pcm`): add a `locales/<code>.json`,
 * import it into `resources`, and append an entry here. No other changes needed.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English", beta: false },
  { code: "yo", label: "Yoruba", native: "Yorùbá", beta: true },
  { code: "ha", label: "Hausa", native: "Hausa", beta: true },
  { code: "ig", label: "Igbo", native: "Igbo", beta: true },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

/**
 * Maps an app language code to a BCP-47 locale for `Intl` date/number
 * formatting. Nigerian English/French-style grouping stays consistent via the
 * `-NG` region; unsupported locales degrade gracefully in `Intl`.
 */
export const BCP47_BY_LANGUAGE: Record<LanguageCode, string> = {
  en: "en-NG",
  yo: "yo-NG",
  ha: "ha-NG",
  ig: "ig-NG",
};

export const resolveBcp47 = (code?: string): string =>
  BCP47_BY_LANGUAGE[(code as LanguageCode) ?? "en"] ?? "en-NG";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      yo: { translation: yo },
      ha: { translation: ha },
      ig: { translation: ig },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    // Precedence: an authenticated account preference is applied explicitly in
    // AuthContext (via i18n.changeLanguage), which overrides the detector below.
    // So the effective order is: account → localStorage → navigator → en.
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "phyhan.lang",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
    // Never return null for a missing/empty key — fall through to the English
    // fallback so the UI never renders an empty node or a raw key.
    returnNull: false,
    returnEmptyString: false,
    // Dev-only diagnostics: surface missing keys in the console so untranslated
    // strings are caught during development. Disabled in production builds.
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: import.meta.env.DEV
      ? (lngs, ns, key) => {
          console.warn(
            `[i18n] missing key "${key}" (ns: ${ns}) for ${lngs.join(", ")}`,
          );
        }
      : undefined,
  });

// Keep <html lang> in sync for accessibility and SEO on every language change.
if (typeof document !== "undefined") {
  const applyHtmlLang = (lng: string) => {
    document.documentElement.setAttribute("lang", lng || "en");
  };
  applyHtmlLang(i18n.resolvedLanguage || "en");
  i18n.on("languageChanged", applyHtmlLang);
}

export default i18n;
