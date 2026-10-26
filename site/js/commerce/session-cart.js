import { safeQuantity } from "./pricing.js";

export const CART_SESSION_KEY = "kalitko-cart";

export function cartSessionPayload(lines) {
  return lines
    .map(({ product, quantity }) => ({
      id: typeof product?.id === "string" ? product.id : "",
      quantity: safeQuantity(quantity)
    }))
    .filter(({ id, quantity }) => id && quantity > 0);
}

export function restoreCartLines(storedValue, products) {
  let entries;
  try {
    entries = typeof storedValue === "string" ? JSON.parse(storedValue) : storedValue;
  } catch {
    return [];
  }
  if (!Array.isArray(entries)) return [];

  const productsById = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map();
  entries.forEach((entry) => {
    const id = typeof entry?.id === "string" ? entry.id : "";
    const product = productsById.get(id);
    const quantity = safeQuantity(entry?.quantity);
    if (product && quantity > 0) quantities.set(id, (quantities.get(id) || 0) + quantity);
  });

  return [...quantities].map(([id, quantity]) => ({
    product: productsById.get(id),
    quantity
  }));
}
