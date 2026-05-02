import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ChartPoint {
  [key: string]: string | number;
}

export interface DashboardAnalytics {
  role: string;
  cards: Record<string, number>;
  charts: Record<string, ChartPoint[]>;
  maps?: Record<string, Record<string, number>>;
  recentOrders?: Array<Record<string, string | number>>;
  recentDeliveries?: Array<Record<string, string | number>>;
}

export const useDashboardAnalytics = () =>
  useQuery({
    queryKey: ["dashboard-analytics"],
    queryFn: async (): Promise<DashboardAnalytics> => {
      const { data } = await api.get<DashboardAnalytics>("/insights/dashboard");
      return data;
    },
  });
