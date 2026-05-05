import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FaqItem, SupportTicket, SupportTicketStatus } from "@/types";

interface TicketsResp { items?: SupportTicket[]; data?: SupportTicket[]; tickets?: SupportTicket[] }
interface FaqResp { items?: FaqItem[]; data?: FaqItem[]; faqs?: FaqItem[] }

const unwrapTickets = (data: TicketsResp | SupportTicket[]): SupportTicket[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.tickets ?? [];
};
const unwrapFaqs = (data: FaqResp | FaqItem[]): FaqItem[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.faqs ?? [];
};

export const useFaqs = () =>
  useQuery({
    queryKey: ["faqs"],
    queryFn: async () => unwrapFaqs((await api.get<FaqResp | FaqItem[]>("/support/faqs")).data),
  });

export const useMyTickets = () =>
  useQuery({
    queryKey: ["support-tickets-mine"],
    queryFn: async () => unwrapTickets((await api.get<TicketsResp | SupportTicket[]>("/support/tickets")).data),
  });

export const useTicket = (id?: string) =>
  useQuery({
    queryKey: ["support-ticket", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<SupportTicket | { data: SupportTicket }>(`/support/tickets/${id}`);
      const d = data as { data?: SupportTicket };
      return (d.data ?? data) as SupportTicket;
    },
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { subject: string; body: string; category?: string }) => {
      const { data } = await api.post<SupportTicket>("/support/tickets", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-tickets-mine"] }),
  });
};

export const useReplyTicket = (id?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post<SupportTicket>(`/support/tickets/${id}/replies`, { body });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
      qc.invalidateQueries({ queryKey: ["support-tickets-mine"] });
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });
};

/* Admin */

export const useAdminTickets = (status?: SupportTicketStatus) =>
  useQuery({
    queryKey: ["admin-support-tickets", status ?? "all"],
    queryFn: async () => {
      const { data } = await api.get<TicketsResp | SupportTicket[]>("/admin/support/tickets", {
        params: status ? { status } : undefined,
      });
      return unwrapTickets(data);
    },
  });

export const useUpdateTicketStatus = (id?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: SupportTicketStatus) => {
      const { data } = await api.patch<SupportTicket>(`/admin/support/tickets/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      qc.invalidateQueries({ queryKey: ["support-ticket", id] });
    },
  });
};
