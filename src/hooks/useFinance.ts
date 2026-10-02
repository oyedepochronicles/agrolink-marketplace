import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FinanceTransaction {
  id: string;
  kind: "order" | "parent" | "payout";
  transactionType: "payment" | "settlement";
  reference?: string;
  orderId?: string;
  user?: { _id: string; name: string; email: string };
  amount: number;
  currency: string;
  paymentMethod?: string;
  provider?: string;
  status: string;
  reconciliationStatus: string;
  providerReference?: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionResponse { items?: FinanceTransaction[]; meta?: { total: number } }

export const useFinanceTransactions = (filters: Record<string, string | undefined> = {}) =>
  useQuery({
    queryKey: ["finance-transactions", filters],
    queryFn: async () => {
      const { data } = await api.get<TransactionResponse>("/admin/finance/transactions", { params: filters });
      return data.items ?? [];
    },
  });

export const useRevalidateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: FinanceTransaction) => {
      const { data } = await api.post<{ item: FinanceTransaction; outcome: string }>(
        `/admin/finance/transactions/${transaction.kind}/${transaction.id.split(":")[1]}/revalidate`,
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["finance-transactions"] }),
  });
};
