// System configuration types — backend is source of truth.
// Categories match the server's centralized list (config/configCategories.js),
// which stores them UPPERCASE.
export type ConfigCategory =
  | "DELIVERY"
  | "PAYMENTS"
  | "LOGISTICS"
  | "MARKETPLACE"
  | "FARMING"
  | "VERIFICATION"
  | "NOTIFICATIONS"
  | "SECURITY"
  | "ACCESS"
  | "SYSTEM";

export const CONFIG_CATEGORIES: ConfigCategory[] = [
  "DELIVERY",
  "PAYMENTS",
  "LOGISTICS",
  "MARKETPLACE",
  "FARMING",
  "VERIFICATION",
  "NOTIFICATIONS",
  "SECURITY",
  "ACCESS",
  "SYSTEM",
];

export type ConfigType = "string" | "number" | "boolean" | "json" | "array";

export const CONFIG_VALUE_TYPES: ConfigType[] = [
  "string",
  "number",
  "boolean",
  "json",
  "array",
];

export interface ConfigItem {
  _id?: string;
  key: string;
  value: unknown;
  category: ConfigCategory;
  /** Declared value type from the backend — drives control rendering + coercion. */
  valueType?: ConfigType;
  /** Exposed via the public /system-config endpoint when true. */
  public?: boolean;
  /** System-managed key (e.g. the RBAC matrix) — not editable via the generic editor. */
  protected?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// Well-known keys consumed by the UI. Always read via useConfig with a fallback.
export type KnownConfigKey =
  | "DELIVERY_BASE_FEE"
  | "DELIVERY_PER_KM"
  | "DELIVERY_EXPRESS_MULTIPLIER"
  | "FARMER_FEE_PERCENT"
  | "RIDER_FEE_PERCENT"
  | "SERVICE_FEE_PERCENT"
  | "TAX_PERCENT"
  | "PHONE_VERIFICATION_ENABLED"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "MAX_FAILED_VERIFICATIONS"
  | "ORDER_AUTO_CANCEL_HOURS"
  | "RIDER_MATCH_RADIUS_KM"
  | "MAINTENANCE_MODE"
  | "MAINTENANCE_MESSAGE";

export type SystemConfig = Partial<Record<KnownConfigKey, unknown>> &
  Record<string, unknown>;
