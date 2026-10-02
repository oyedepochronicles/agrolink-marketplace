import i18n, { resolveBcp47 } from "@/i18n";

/**
 * Active BCP-47 locale derived from the current UI language. Used as the default
 * for the formatters below so dates/numbers follow the selected language.
 */
export const getActiveLocale = () => resolveBcp47(i18n.resolvedLanguage);

/**
 * Formats an amount as Nigerian Naira. The currency is ALWAYS NGN and amounts
 * are never converted — selecting a UI language changes only digit grouping and
 * symbol placement, never the stored/transaction value. `maximumFractionDigits`
 * stays 0 to match existing display behaviour.
 */
export const formatNaira = (amount: number, locale: string = getActiveLocale()) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatNumber = (
  value: number,
  locale: string = getActiveLocale(),
  options?: Intl.NumberFormatOptions,
) => new Intl.NumberFormat(locale, options).format(value || 0);

export const formatDate = (iso?: string, locale: string = getActiveLocale()) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const formatOrderAddress = (
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    lga?: string;
    fullAddress?: string;
    notes?: string;
  },
) => {
  if (!address) return "";
  if (typeof address === "string") return address;
  return address.fullAddress || [address.street, address.city, address.lga, address.state].filter(Boolean).join(", ");
};
