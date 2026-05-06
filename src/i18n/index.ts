import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import yo from "./locales/yo.json";
import ha from "./locales/ha.json";
import ig from "./locales/ig.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "yo", label: "Yoruba", native: "Yorùbá" },
  { code: "ha", label: "Hausa", native: "Hausa" },
  { code: "ig", label: "Igbo", native: "Igbo" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

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
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "phyhan.lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
