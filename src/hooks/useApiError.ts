import { classifyError, type SecurityErrorKind } from "@/lib/api";
import type { AxiosError } from "axios";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Localised, user-facing error text.
 *
 * `classifyError` (in lib/api.ts) returns a STABLE `SecurityErrorKind` — that
 * classification is program logic and is never translated. This hook only
 * localises the *presentation* of that kind via the `errors.<kind>` i18n keys.
 *
 * Security-sensitive kinds (forbidden / network_restricted / server /
 * unauthenticated) always use the generic localised message so backend internals
 * are never leaked. Other kinds prefer a specific server-provided message when
 * present, falling back to the localised generic.
 */
export const useApiError = () => {
  const { t } = useTranslation();

  return useCallback(
    (err: unknown): string => {
      const kind: SecurityErrorKind = classifyError(err);
      const generic = t(`errors.${kind}` as const);

      if (
        kind === "forbidden" ||
        kind === "network_restricted" ||
        kind === "server" ||
        kind === "unauthenticated"
      ) {
        return generic;
      }

      const e = err as AxiosError<{ message?: string; error?: string }>;
      return (
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        generic ||
        t("errors.unknown")
      );
    },
    [t],
  );
};
