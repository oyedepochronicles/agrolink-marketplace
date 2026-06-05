import { useCart, type CartItem } from "@/hooks/useCart";
import type { GroupedCart } from "@/types/batch";
import { useMemo } from "react";

export const useGroupedCart = () => {
  const cart = useCart();
  const groups = useMemo<GroupedCart[]>(() => {
    const map = new Map<string, GroupedCart>();
    for (const item of cart.items as CartItem[]) {
      const fid = item.farmerId || "unknown";
      if (!map.has(fid)) {
        map.set(fid, {
          farmerId: fid,
          farmerName: item.farmerName,
          items: [],
          subtotal: 0,
        });
      }
      const g = map.get(fid)!;
      g.items.push({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit,
        image: item.image,
      });
      g.subtotal += item.price * item.quantity;
    }
    return Array.from(map.values());
  }, [cart.items]);

  return { ...cart, groups };
};
