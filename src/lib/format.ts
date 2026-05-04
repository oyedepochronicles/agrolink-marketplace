export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

export const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const formatOrderAddress = (
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    lga?: string;
    fullAddress?: string;
    notes?: string;
  },
) => {
  if (!address) return "";
  if (typeof address === "string") return address;
  return address.fullAddress || [address.street, address.city, address.lga, address.state].filter(Boolean).join(", ");
};
