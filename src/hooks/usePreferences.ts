import { useAuth } from "@/contexts/AuthContext";
import type { LanguageCode } from "@/i18n";
import { api } from "@/lib/api";
import { useTheme } from "next-themes";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export type ThemeChoice = "light" | "dark" | "system";

/**
 * Unified language + color-mode preference control.
 *
 * - Applies the change locally and IMMEDIATELY (no reload): `i18next` for
 *   language, `next-themes` for color mode. Both also cache to localStorage
 *   (`phyhan.lang` / `phyhan.theme`), which is the "saved local" tier of the
 *   precedence chain account → saved-local → browser → default.
 * - For an AUTHENTICATED user it additionally persists the choice to the
 *   account via `PATCH /users/me/preferences` (optimistic, fire-and-forget) so
 *   it follows the user across devices. A failed sync is non-fatal: the local
 *   change still stands and the user keeps seeing their selection — it simply
 *   isn't stored server-side (it will be re-attempted on the next change).
 * - Signed-out visitors use localStorage only (no network call).
 *
 * SECURITY: a user can only ever change THEIR OWN preferences. The endpoint
 * derives the target strictly from the auth token (`req.user._id`); there is no
 * user id in the path or body, so there is no cross-user (BOLA/IDOR) surface.
 */
export const usePreferences = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const { theme, resolvedTheme, setTheme: applyTheme } = useTheme();
  const isAuthenticated = !!user;

  const persist = useCallback(
    (patch: { language?: LanguageCode; theme?: ThemeChoice }) => {
      if (!isAuthenticated) return;
      // Fire-and-forget: the local change is already applied. We never await or
      // revert on failure — presentation preferences must never block the UI or
      // surface a scary error for a non-critical sync.
      void api.patch("/users/me/preferences", patch).catch(() => undefined);
    },
    [isAuthenticated],
  );

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      void i18n.changeLanguage(code);
      persist({ language: code });
    },
    [i18n, persist],
  );

  const setTheme = useCallback(
    (choice: ThemeChoice) => {
      applyTheme(choice);
      persist({ theme: choice });
    },
    [applyTheme, persist],
  );

  return {
    language: (i18n.resolvedLanguage as LanguageCode) ?? "en",
    theme: (theme as ThemeChoice) ?? "system",
    resolvedTheme,
    setLanguage,
    setTheme,
  };
};
