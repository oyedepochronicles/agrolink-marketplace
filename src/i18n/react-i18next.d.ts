import "react-i18next";

import type en from "./locales/en.json";

/**
 * Binds react-i18next's `t()` to the English resource shape so translation keys
 * are checked at compile time. `en.json` is the authoritative key set; adding a
 * key here (by adding it to en.json) makes it available and type-safe everywhere.
 */
declare module "react-i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
    returnNull: false;
  }
}
