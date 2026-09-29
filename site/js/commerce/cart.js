import { safeQuantity } from "./pricing.js";

export function createCart(products) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map();
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(api.lines()));
  }

  const api = {
    add(id, amount = 1) {
      return api.change(id, amount);
    },
    change(id, amount) {
      if (!productsById.has(id)) return 0;
      const next = safeQuantity((quantities.get(id) || 0) + Number(amount || 0));
      if (next > 0) quantities.set(id, next);
      else quantities.delete(id);
      notify();
      return next;
    },
    set(id, quantity) {
      if (!productsById.has(id)) return 0;
      const next = safeQuantity(quantity);
      if (next > 0) quantities.set(id, next);
      else quantities.delete(id);
      notify();
      return next;
    },
    remove(id) {
      const removed = quantities.delete(id);
      if (removed) notify();
      return removed;
    },
    clear() {
      quantities.clear();
      notify();
    },
    quantity(id) {
      return quantities.get(id) || 0;
    },
    lines() {
      return [...quantities.entries()].map(([id, quantity]) => ({
        product: productsById.get(id),
        quantity
      }));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };

  return api;
}

