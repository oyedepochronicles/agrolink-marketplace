import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getToken } from "@/lib/api";

export interface Address {
  id: string;
  _id?: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  lga?: string;
  notes?: string;
  isDefault?: boolean;
}

const KEY = "phyhan.addresses";

const read = (): Address[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Address[]) : [];
  } catch {
    return [];
  }
};

const write = (list: Address[]) => {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("phyhan:addresses"));
};

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `addr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

const normalize = (address: Address): Address => ({
  ...address,
  id: address.id || address._id || uid(),
});

export const useAddresses = () => {
  const qc = useQueryClient();
  const [addresses, setAddresses] = useState<Address[]>(() => read());
  const isAuthed = Boolean(getToken());

  const remote = useQuery({
    queryKey: ["delivery-addresses"],
    enabled: isAuthed,
    queryFn: async () => {
      const { data } = await api.get<{ items?: Address[] }>("/users/me/addresses");
      return (data.items ?? []).map(normalize);
    },
  });

  useEffect(() => {
    if (remote.data) {
      write(remote.data);
      setAddresses(remote.data);
    }
  }, [remote.data]);

  const saveRemote = useMutation({
    mutationFn: async (input: { mode: "create" | "update" | "delete"; id?: string; data?: Partial<Address> }) => {
      if (input.mode === "create") return (await api.post("/users/me/addresses", input.data)).data;
      if (input.mode === "update") return (await api.put(`/users/me/addresses/${input.id}`, input.data)).data;
      return (await api.delete(`/users/me/addresses/${input.id}`)).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-addresses"] }),
  });

  useEffect(() => {
    const sync = () => setAddresses(read());
    window.addEventListener("phyhan:addresses", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("phyhan:addresses", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const create = useCallback((input: Omit<Address, "id">) => {
    const list = read();
    const isFirst = list.length === 0;
    const next: Address = { ...input, id: uid(), isDefault: input.isDefault ?? isFirst };
    const updated = next.isDefault ? [next, ...list.map((a) => ({ ...a, isDefault: false }))] : [...list, next];
    write(updated);
    if (isAuthed) saveRemote.mutate({ mode: "create", data: next });
    return next;
  }, [isAuthed, saveRemote]);

  const update = useCallback((id: string, patch: Partial<Omit<Address, "id">>) => {
    let list = read().map((a) => (a.id === id ? { ...a, ...patch } : a));
    if (patch.isDefault) list = list.map((a) => ({ ...a, isDefault: a.id === id }));
    write(list);
    if (isAuthed) saveRemote.mutate({ mode: "update", id, data: patch });
  }, [isAuthed, saveRemote]);

  const remove = useCallback((id: string) => {
    const list = read().filter((a) => a.id !== id);
    if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
    write(list);
    if (isAuthed) saveRemote.mutate({ mode: "delete", id });
  }, [isAuthed, saveRemote]);

  const setDefault = useCallback((id: string) => {
    write(read().map((a) => ({ ...a, isDefault: a.id === id })));
    if (isAuthed) saveRemote.mutate({ mode: "update", id, data: { isDefault: true } });
  }, [isAuthed, saveRemote]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return { addresses, defaultAddress, create, update, remove, setDefault };
};

export const formatAddress = (a: Address) =>
  `${a.street}, ${a.city}, ${a.state}`;
