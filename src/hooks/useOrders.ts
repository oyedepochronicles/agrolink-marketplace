import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import type { DeliveryStatus, Order, OrderStatus, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface ListResp {
  items?: Order[];
  data?: Order[];
  orders?: Order[];
}

const unwrap = (data: ListResp | Order[]): Order[] => {
  if (Array.isArray(data)) return data;
  return data.items ?? data.data ?? data.orders ?? [];
};

export const useFarmerOrders = () =>
  useQuery({
    queryKey: ["farmer-orders"],
    queryFn: async () =>
      unwrap((await api.get<ListResp | Order[]>("/orders/farmer")).data),
  });

export const useBuyerOrders = () =>
  useQuery({
    queryKey: ["buyer-orders"],
    queryFn: async () =>
      unwrap((await api.get<ListResp | Order[]>("/orders/my")).data),
  });

export const useRiderDeliveries = () =>
  useQuery({
    queryKey: ["rider-deliveries"],
    queryFn: async () =>
      unwrap((await api.get<ListResp | Order[]>("/orders/rider")).data),
  });

const useBrowserLocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setCoords(null),
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 8000 },
    );
  }, []);

  return coords;
};

const distanceMeters = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const r = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

export const useRiderLiveLocation = (enabled = true) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !("geolocation" in navigator)) return;

    const socket = getSocket();
    let lastSentAt = 0;
    let lastCoords: { lat: number; lng: number } | null = null;

    const emitLocation = (position: GeolocationPosition) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      const now = Date.now();
      const movedEnough =
        !lastCoords || distanceMeters(lastCoords, coords) >= 50;
      const waitedEnough = now - lastSentAt >= 10000;

      if (!movedEnough && !waitedEnough) return;

      lastSentAt = now;
      lastCoords = coords;
      socket.emit("rider:update-location", coords);
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
    };

    const watchId = navigator.geolocation.watchPosition(
      emitLocation,
      () => undefined,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      },
    );

    const onNewOrder = () =>
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
    const onAccepted = () => {
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
    };
    socket.on("order:new", onNewOrder);
    socket.on("order:accepted", onAccepted);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.off("order:new", onNewOrder);
      socket.off("order:accepted", onAccepted);
    };
  }, [enabled, qc]);
};

export const useAvailableDeliveries = () => {
  const coords = useBrowserLocation();
  return useQuery({
    queryKey: ["available-deliveries", coords?.lat, coords?.lng],
    queryFn: async () =>
      unwrap(
        (
          await api.get<ListResp | Order[]>("/orders/available", {
            params: coords
              ? { nearLat: coords.lat, nearLng: coords.lng }
              : undefined,
          })
        ).data,
      ),
  });
};

/** Riders the farmer can assign — defaults to /users?role=rider */
const orderCoords = (order?: Order) => {
  const pickupGeo = order?.pickupAddress as
    | { geo?: { coordinates?: number[] } }
    | undefined;
  const deliveryGeo = order?.deliveryAddress as
    | { geo?: { coordinates?: number[] } }
    | undefined;
  const coordinates =
    pickupGeo?.geo?.coordinates ?? deliveryGeo?.geo?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return undefined;
  const [lng, lat] = coordinates.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? { lat, lng }
    : undefined;
};

export const useAvailableRiders = (order?: Order) =>
  useQuery({
    queryKey: ["available-riders", order?._id],
    queryFn: async () => {
      const coords = orderCoords(order);
      const { data } = await api.get<
        { items?: User[]; data?: User[]; users?: User[] } | User[]
      >("/orders/riders/available", {
        params: {
          state:
            typeof order?.deliveryAddress === "object"
              ? order.deliveryAddress.state
              : undefined,
          nearLat: coords?.lat,
          nearLng: coords?.lng,
        },
      });
      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.users ?? [];
    },
  });
export const useRiders = (order?: Order) =>
  useQuery({
    queryKey: ["available-riders", order?._id],
    queryFn: async () => {
      const { data } = await api.get<
        { items?: User[]; data?: User[]; users?: User[] } | User[]
      >("/orders/riders");
      if (Array.isArray(data)) return data;
      return data.items ?? data.data ?? data.users ?? [];
    },
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data } = await api.patch<Order>(`/orders/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
    },
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Order>(`/orders/${id}/status`, {
        status: "cancelled",
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["buyer-orders"] });
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
    },
  });
};

export const useOrderConversation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: string | { orderId: string; recipientId?: string },
    ) => {
      const orderId = typeof input === "string" ? input : input.orderId;
      const { data } = await api.get<{ _id?: string; id?: string }>(
        `/conversations/order/${orderId}`,
        {
          params:
            typeof input === "string"
              ? undefined
              : { recipientId: input.recipientId },
        },
      );
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
};

/** Farmer accepts/declines an incoming order so the buyer can proceed to pay. */
export const useRespondToOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: "accept" | "decline";
    }) => {
      const { data } = await api.post<Order>(`/orders/${id}/${action}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["farmer-orders"] }),
  });
};

/** Farmer records an offline (out-of-app) payment. Backend marks order paid and deducts platform fee. */
export const useRecordOfflinePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      amount: number;
      quantity: number;
      note?: string;
    }) => {
      const { data } = await api.post<Order>(
        `/orders/${input.id}/offline-payment`,
        {
          amount: input.amount,
          quantity: input.quantity,
          note: input.note,
        },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["wallet-summary"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
    },
  });
};

/** Farmer assigns a rider to an order. */
export const useAssignRider = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, riderId }: { id: string; riderId: string }) => {
      const { data } = await api.post<Order>(`/orders/${id}/assign-rider`, {
        riderId,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
    },
  });
};

export const useAcceptDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Order>(`/orders/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["available-deliveries"] });
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
    },
  });
};

export const useUpdateDeliveryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      deliveryStatus,
    }: {
      id: string;
      deliveryStatus: DeliveryStatus;
    }) => {
      const { data } = await api.patch<Order>(`/orders/${id}/delivery-status`, {
        deliveryStatus,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rider-deliveries"] });
      qc.invalidateQueries({ queryKey: ["buyer-orders"] });
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
    },
  });
};
