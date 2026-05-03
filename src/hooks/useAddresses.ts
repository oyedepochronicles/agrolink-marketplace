import { useCallback, useEffect, useState } from "react";

export interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  state: string;
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

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>(() => read());

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
    return next;
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<Address, "id">>) => {
    let list = read().map((a) => (a.id === id ? { ...a, ...patch } : a));
    if (patch.isDefault) list = list.map((a) => ({ ...a, isDefault: a.id === id }));
    write(list);
  }, []);

  const remove = useCallback((id: string) => {
    const list = read().filter((a) => a.id !== id);
    if (list.length && !list.some((a) => a.isDefault)) list[0].isDefault = true;
    write(list);
  }, []);

  const setDefault = useCallback((id: string) => {
    write(read().map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  return { addresses, defaultAddress, create, update, remove, setDefault };
};

export const formatAddress = (a: Address) =>
  `${a.street}, ${a.city}, ${a.state}`;
