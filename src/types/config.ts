// System configuration types — backend is source of truth.
export type ConfigCategory =
  | "platform"
  | "delivery"
  | "payment"
  | "verification"
  | "notifications"
  | "security";

export type ConfigType = "string" | "number" | "boolean" | "json" | "array";

export interface ConfigItem {
  _id?: string;
  key: string;
  value: unknown;
  category: ConfigCategory;
  type: ConfigType;
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
