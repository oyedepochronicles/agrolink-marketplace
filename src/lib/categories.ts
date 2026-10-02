// Canonical product categories — MUST match the server Product enum
// (server/src/models/Product.js `PRODUCT_CATEGORIES`). Values are stable tokens
// sent to the API; labels are display-only and can be reworded freely.
//
// The taxonomy spans the whole farm economy so nothing is wasted: crops &
// produce, livestock & animal products, and the "circular" streams where one
// farmer's byproduct is another's input (crop residue/bran -> Feed, animal
// dung -> Manure, organic waste -> Compost).

export interface ProductCategory {
  value: string;
  label: string;
}

export interface ProductCategoryGroup {
  group: string;
  options: ProductCategory[];
}

export const PRODUCT_CATEGORY_GROUPS: ProductCategoryGroup[] = [
  {
    group: "Crops & produce",
    options: [
      { value: "Vegetable", label: "Vegetables" },
      { value: "Fruit", label: "Fruits" },
      { value: "Grain", label: "Grains & cereals" },
      { value: "Tuber", label: "Tubers & roots" },
      { value: "Legume", label: "Legumes, beans & nuts" },
      { value: "Spice", label: "Herbs & spices" },
    ],
  },
  {
    group: "Livestock & animal products",
    options: [
      { value: "Livestock", label: "Livestock (cattle, goat, sheep, pig)" },
      { value: "Poultry", label: "Poultry (chicken, turkey, duck)" },
      { value: "Fish", label: "Fish & seafood" },
      { value: "Dairy", label: "Dairy (milk, cheese, yoghurt)" },
      { value: "Egg", label: "Eggs" },
    ],
  },
  {
    group: "Byproducts & circular economy",
    options: [
      { value: "Feed", label: "Animal feed & crop byproducts" },
      { value: "Manure", label: "Manure & organic fertilizer" },
      { value: "Compost", label: "Compost & organic waste" },
    ],
  },
  {
    group: "Farm inputs",
    options: [{ value: "Seedling", label: "Seeds & seedlings" }],
  },
  {
    group: "General",
    options: [{ value: "Other", label: "Other" }],
  },
];

/** Flat list of every category (value + label), groups discarded. */
export const PRODUCT_CATEGORIES: ProductCategory[] =
  PRODUCT_CATEGORY_GROUPS.flatMap((g) => g.options);

/** Human label for a stored category token, falling back to the raw value. */
export const categoryLabel = (value?: string): string =>
  PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value ?? "";
