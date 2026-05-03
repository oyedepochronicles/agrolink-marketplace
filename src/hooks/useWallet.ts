import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BankAccount, PayoutRequest, WalletSummary, WalletTransaction } from "@/types";

interface TxResp { items?: WalletTransaction[]; data?: WalletTransaction[]; transactions?: WalletTransaction[] }
interface PayoutResp { items?: PayoutRequest[]; data?: PayoutRequest[]; payouts?: PayoutRequest[] }

const unwrapTx = (d: TxResp | WalletTransaction[]): WalletTransaction[] =>
  Array.isArray(d) ? d : d.items ?? d.data ?? d.transactions ?? [];
const unwrapPayouts = (d: PayoutResp | PayoutRequest[]): PayoutRequest[] =>
  Array.isArray(d) ? d : d.items ?? d.data ?? d.payouts ?? [];

export const useWalletSummary = () =>
  useQuery({
    queryKey: ["wallet-summary"],
    queryFn: async () => {
      const { data } = await api.get<WalletSummary>("/wallet/summary");
      return data ?? { balance: 0, pending: 0, lifetimeEarnings: 0, lifetimePayouts: 0 };
    },
  });

export const useWalletTransactions = () =>
  useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => unwrapTx((await api.get<TxResp | WalletTransaction[]>("/wallet/transactions")).data),
  });

export const useMyPayouts = () =>
  useQuery({
    queryKey: ["wallet-payouts"],
    queryFn: async () => unwrapPayouts((await api.get<PayoutResp | PayoutRequest[]>("/wallet/payouts")).data),
  });

export const useRequestPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; bankAccount: BankAccount; note?: string }) => {
      const { data } = await api.post<PayoutRequest>("/wallet/payouts", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet-summary"] });
      qc.invalidateQueries({ queryKey: ["wallet-payouts"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
};

export const useAdminPayouts = () =>
  useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => unwrapPayouts((await api.get<PayoutResp | PayoutRequest[]>("/admin/payouts")).data),
  });

export const useReviewPayout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "reject" | "mark_paid" }) => {
      const { data } = await api.post<PayoutRequest>(`/admin/payouts/${id}/${action}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payouts"] }),
  });
};
