import { api } from "@/lib/api";
import type {
  ExportAdminOverview,
  ExportApplication,
  ExportApplicationStatus,
  ExportPartnerOverview,
  ExportRequest,
  ExportShipment,
  ExportShipmentStatus,
} from "@/types/exports";
import type { User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type List<T> = { items?: T[] } | T[];
const unwrap = <T,>(d: List<T>): T[] =>
  Array.isArray(d) ? d : ((d as { items?: T[] }).items ?? []);

/* -------- Public marketplace -------- */
export interface ExportListQuery {
  product?: string;
  destinationCountry?: string;
  deadline?: string;
  minQuantity?: number;
  q?: string;
}

export const useExportOpportunities = (q: ExportListQuery = {}) =>
  useQuery({
    queryKey: ["exports", q],
    queryFn: async () =>
      unwrap(
        (await api.get<List<ExportRequest>>("/exports", { params: q })).data,
      ),
  });

export const useExportRequest = (id?: string) =>
  useQuery({
    queryKey: ["export-request", id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<ExportRequest>(`/exports/requests/${id}`)).data,
  });

/* -------- Partner registration -------- */
export const useRegisterExportPartner = () =>
  useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post<{ message: string; user: User }>(
        "/exports/partners/register",
        input,
      );
      return data;
    },
  });

/* -------- Partner dashboard -------- */
export const useExportPartnerOverview = () =>
  useQuery({
    queryKey: ["export-partner-overview"],
    queryFn: async () =>
      (await api.get<ExportPartnerOverview>("/exports/dashboard/overview"))
        .data,
  });

export const useMyExportRequests = () =>
  useQuery({
    queryKey: ["export-requests-mine"],
    queryFn: async () =>
      unwrap(
        (await api.get<List<ExportRequest>>("/exports/requests/mine")).data,
      ),
  });

export const useCreateExportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await api.post<ExportRequest>(
        "/exports/requests",
        input,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-requests-mine"] });
      qc.invalidateQueries({ queryKey: ["export-partner-overview"] });
    },
  });
};

export const useUpdateExportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Record<string, unknown>;
    }) => {
      const { data } = await api.patch<ExportRequest>(
        `/exports/requests/${id}`,
        patch,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-requests-mine"] });
      qc.invalidateQueries({ queryKey: ["export-admin-requests"] });
    },
  });
};

export const useUpdateExportRequestStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status?: ExportRequest["status"];
      moderationStatus?: ExportRequest["moderationStatus"];
    }) => {
      const { data } = await api.patch<ExportRequest>(
        `/exports/requests/${id}/status`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-requests-mine"] });
      qc.invalidateQueries({ queryKey: ["export-admin-requests"] });
      qc.invalidateQueries({ queryKey: ["exports"] });
    },
  });
};

export const useDeleteExportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/exports/requests/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-requests-mine"] });
      qc.invalidateQueries({ queryKey: ["export-admin-requests"] });
    },
  });
};

/* -------- Farmer applications -------- */
export const useApplyToExportRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      quantityAvailable: number;
      proposedPrice: number;
      currency?: string;
      harvestDetails: string;
      qualityNotes?: string;
      packagingReadiness?: string;
      productImages?: { url: string; name: string }[];
      documents?: { url: string; name: string }[];
    }) => {
      const { data } = await api.post<ExportApplication>(
        `/exports/requests/${id}/applications`,
        body,
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["export-applications-mine"] });
      qc.invalidateQueries({ queryKey: ["export-request", vars.id] });
      qc.invalidateQueries({ queryKey: ["exports"] });
    },
  });
};

export const useMyExportApplications = () =>
  useQuery({
    queryKey: ["export-applications-mine"],
    queryFn: async () =>
      unwrap(
        (await api.get<List<ExportApplication>>("/exports/applications/mine"))
          .data,
      ),
  });

/* -------- Partner application review -------- */
export const usePartnerExportApplications = () =>
  useQuery({
    queryKey: ["export-applications-partner"],
    queryFn: async () =>
      unwrap(
        (await api.get<List<ExportApplication>>("/exports/applications")).data,
      ),
  });

export const useReviewExportApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: ExportApplicationStatus;
      reviewNote?: string;
    }) => {
      const { data } = await api.patch<ExportApplication>(
        `/exports/applications/${id}/review`,
        { status, reviewNote },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-applications-partner"] });
      qc.invalidateQueries({ queryKey: ["export-partner-overview"] });
      qc.invalidateQueries({ queryKey: ["export-shipments"] });
    },
  });
};

export const useStartExportConversation = () =>
  useMutation({
    mutationFn: async (applicationId: string) => {
      const { data } = await api.post<{ _id: string }>(
        `/exports/applications/${applicationId}/conversation`,
      );
      return data;
    },
  });

/* -------- Shipments -------- */
export const useExportShipments = () =>
  useQuery({
    queryKey: ["export-shipments"],
    queryFn: async () =>
      unwrap(
        (await api.get<List<ExportShipment>>("/exports/shipments")).data,
      ),
  });

export const useUpdateExportShipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status?: ExportShipmentStatus;
      note?: string;
      location?: string;
      pickupDate?: string;
      pickupLocation?: string;
      carrier?: string;
      trackingReference?: string;
      documents?: { url: string; name: string }[];
    }) => {
      const { data } = await api.patch<ExportShipment>(
        `/exports/shipments/${id}`,
        body,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-shipments"] });
      qc.invalidateQueries({ queryKey: ["export-partner-overview"] });
    },
  });
};

/* -------- Admin -------- */
export const useAdminExportOverview = () =>
  useQuery({
    queryKey: ["export-admin-overview"],
    queryFn: async () =>
      (await api.get<ExportAdminOverview>("/exports/admin/overview")).data,
  });

export const useAdminExportPartners = (status?: string) =>
  useQuery({
    queryKey: ["export-admin-partners", status],
    queryFn: async () =>
      unwrap(
        (
          await api.get<List<User>>("/exports/admin/partners", {
            params: status ? { status } : undefined,
          })
        ).data,
      ),
  });

export const useAdminExportRequests = (params: {
  status?: string;
  moderationStatus?: string;
} = {}) =>
  useQuery({
    queryKey: ["export-admin-requests", params],
    queryFn: async () =>
      unwrap(
        (
          await api.get<List<ExportRequest>>("/exports/admin/requests", {
            params,
          })
        ).data,
      ),
  });

export const useReviewExportPartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: "approve" | "reject";
      reason?: string;
    }) => {
      const { data } = await api.patch<{ message: string; user: User }>(
        `/exports/admin/partners/${id}/${decision}`,
        reason ? { reason } : undefined,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-admin-partners"] });
      qc.invalidateQueries({ queryKey: ["export-admin-overview"] });
    },
  });
};
