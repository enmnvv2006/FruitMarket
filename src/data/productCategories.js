export const PRODUCT_CATEGORY_OPTIONS = [
  { value: "all", label: "Все категории" },
  { value: "fruits", label: "Фрукты" },
  { value: "vegetables", label: "Овощи" },
  { value: "berries", label: "Ягоды" },
  { value: "greens", label: "Зелень" },
  { value: "other", label: "Другое" },
];

export const DEFAULT_PRODUCT_CATEGORY = "fruits";

export function normalizeCategory(category) {
  const allowed = new Set(PRODUCT_CATEGORY_OPTIONS.map((item) => item.value));
  if (!category || !allowed.has(category) || category === "all") {
    return DEFAULT_PRODUCT_CATEGORY;
  }

  return category;
}

export const CATEGORY_LABELS = Object.fromEntries(
  PRODUCT_CATEGORY_OPTIONS.filter((item) => item.value !== "all").map((item) => [item.value, item.label])
);
