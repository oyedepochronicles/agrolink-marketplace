import { api } from "@/lib/api";
import type {
  ConfigItem,
  KnownConfigKey,
  SystemConfig,
} from "@/types/config";
import { useQuery } from "@tanstack/react-query";

// Reasonable last-resort fallbacks so the UI never crashes if backend is unreachable.
// These should be treated as "unknown" and avoided whenever possible.
const HARD_FALLBACKS: SystemConfig = {
  DELIVERY_BASE_FEE: 0,
  DELIVERY_PER_KM: 0,
  DELIVERY_EXPRESS_MULTIPLIER: 2,
  FARMER_FEE_PERCENT: 0,
  RIDER_FEE_PERCENT: 0,
  SERVICE_FEE_PERCENT: 0,
  TAX_PERCENT: 0,
  PHONE_VERIFICATION_ENABLED: false,
  EMAIL_VERIFICATION_REQUIRED: false,
  MAX_FAILED_VERIFICATIONS: 3,
  ORDER_AUTO_CANCEL_HOURS: 48,
  RIDER_MATCH_RADIUS_KM: 25,
  MAINTENANCE_MODE: false,
  MAINTENANCE_MESSAGE: "",
};

const toMap = (items: ConfigItem[] | undefined): SystemConfig => {
  const map: SystemConfig = { ...HARD_FALLBACKS };
  for (const it of items ?? []) map[it.key] = it.value;
  return map;
};

export const useSystemConfig = () =>
  useQuery({
    queryKey: ["system-config"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SystemConfig> => {
      try {
        const { data } = await api.get<
          { items?: ConfigItem[] } | ConfigItem[] | SystemConfig
        >("/system-config");
        if (Array.isArray(data)) return toMap(data);
        if ((data as { items?: ConfigItem[] }).items)
          return toMap((data as { items?: ConfigItem[] }).items);
        return { ...HARD_FALLBACKS, ...(data as SystemConfig) };
      } catch {
        return { ...HARD_FALLBACKS };
      }
    },
  });

export function useConfig<T = unknown>(
  key: KnownConfigKey | string,
  fallback?: T,
): T {
  const { data } = useSystemConfig();
  const v = data?.[key as string];
  if (v === undefined || v === null) return fallback as T;
  return v as T;
}
