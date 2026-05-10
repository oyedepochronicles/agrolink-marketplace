import { api, getToken } from "@/lib/api";
import type { Product } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  unit?: string;
  image?: string;
  farmerId?: string;
  farmerName?: string;
  quantity: number;
}

const KEY = "phyhan.cart";

const read = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const write = (items: CartItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("phyhan:cart"));
};

const fromRemote = (
  items: Array<{ productId?: Product | string; quantity: number }>,
): CartItem[] =>
  items
    .map((item) => {
      console.log("item from remote: ", item);
      const product = item.productId;
      if (!product || typeof product === "string") return null;
      return {
        productId: product._id,
        title: product.title || product.name,
        price: product.price,
        unit: product.unit,
        image: product.images?.[0],
        farmerId: product.farmerId,
        farmerName: product.farmer?.name,
        quantity: item.quantity,
      };
    })
    .filter(Boolean) as CartItem[];

export const useCart = () => {
  const qc = useQueryClient();
  const [items, setItems] = useState<CartItem[]>(() => read());
  const isAuthed = Boolean(getToken());

  const remote = useQuery({
    queryKey: ["cart"],
    enabled: isAuthed,
    queryFn: async () => {
      const { data } = await api.get<{
        items?: Array<{ productId?: Product | string; quantity: number }>;
      }>("/users/me/cart");
      return fromRemote(data.items ?? []);
    },
  });

  const saveRemote = useMutation({
    mutationFn: async (next: CartItem[]) => {
      const { data } = await api.put("/users/me/cart", {
        items: next.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      return fromRemote(data.items ?? []);
    },
    onSuccess: (next) => {
      write(next);
      setItems(next);
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  useEffect(() => {
    if (remote.data) {
      write(remote.data);
      setItems(remote.data);
    }
  }, [remote.data]);

  const persist = useCallback(
    (next: CartItem[]) => {
      write(next);
      if (isAuthed) saveRemote.mutate(next);
    },
    [isAuthed, saveRemote],
  );

  useEffect(() => {
    const sync = () => setItems(read());
    window.addEventListener("phyhan:cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("phyhan:cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback(
    (product: Product, quantity = 1) => {
      const id = product._id ?? product.id ?? "";
      if (!id) return;
      const current = read();
      const idx = current.findIndex((i) => i.productId === id);
      if (idx >= 0) {
        current[idx].quantity += quantity;
      } else {
        current.push({
          productId: id,
          title: product.title,
          price: product.price,
          unit: product.unit,
          image: product.images?.[0],
          farmerId: product.farmerId,
          farmerName: product.farmer?.name,
          quantity,
        });
      }
      persist(current);
    },
    [persist],
  );

  const update = useCallback(
    (productId: string, quantity: number) => {
      const current = read()
        .map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, quantity) }
            : i,
        )
        .filter((i) => i.quantity > 0);
      persist(current);
    },
    [persist],
  );

  const remove = useCallback(
    (productId: string) => {
      persist(read().filter((i) => i.productId !== productId));
    },
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, add, update, remove, clear, subtotal, count };
};
