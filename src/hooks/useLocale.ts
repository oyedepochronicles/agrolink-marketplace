import {
  formatDate,
  formatNaira,
  formatNumber,
  getActiveLocale,
} from "@/lib/format";
import { useTranslation } from "react-i18next";

/**
 * Subscribes to the active language and returns locale-bound formatters.
 *
 * Calling `useTranslation()` re-renders the component when the language changes,
 * so the returned `formatNaira`/`formatDate`/`formatNumber` always reflect the
 * current locale. Currency stays NGN (see `formatNaira`). Use this in components
 * that display money/dates but don't otherwise call `t()`.
 */
export const useLocale = () => {
  // Subscribe to language changes (return value intentionally unused).
  useTranslation();
  const locale = getActiveLocale();
  return {
    locale,
    formatNaira: (amount: number) => formatNaira(amount, locale),
    formatDate: (iso?: string) => formatDate(iso, locale),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, locale, options),
  };
};
