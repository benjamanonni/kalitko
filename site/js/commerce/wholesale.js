import { safeQuantity } from "./pricing.js";
import { formatMoney, formatWeight } from "../utils/format.js";

export const YUYOS_WHOLESALE_MIN_UNITS = 100;

const categoryOrder = ["yerbas", "hierbas", "blends"];
const categoryLabels = {
  yerbas: "Yerbas",
  hierbas: "Yuyos",
  blends: "Blends"
};

function positivePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function eligibleYerbaWeight(lines) {
  return lines.reduce((total, { product, quantity }) => {
    if (product.category !== "yerbas" || product.eligibleForWholesale !== true) return total;
    const weight = Number(product.weightGrams);
    return total + (Number.isFinite(weight) && weight > 0 ? weight * quantity : 0);
  }, 0);
}

export function wholesaleProductName(product) {
  return product.category === "blends" ? `Blend ${product.name}` : product.name;
}

export function createWholesaleOrder(products) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const quantities = new Map();
  const listeners = new Set();

  function lines() {
    return [...quantities].map(([id, quantity]) => ({
      product: productsById.get(id),
      quantity,
      mode: "wholesale"
    }));
  }

  function notify() {
    const currentLines = lines();
    listeners.forEach((listener) => listener(currentLines));
  }

  const api = {
    change(id, amount) {
      if (!productsById.has(id)) return 0;
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount)) return api.quantity(id);
      const next = safeQuantity((quantities.get(id) || 0) + numericAmount);
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
    quantity(id) {
      return quantities.get(id) || 0;
    },
    lines,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };

  return api;
}

export function wholesaleUnitPrice(product, conditions) {
  const price = positivePrice(product?.wholesalePrice);
  if (price === null) return null;
  if (product.category === "blends") return price;
  if (product.category === "hierbas") return conditions.yuyosQualified ? price : null;
  if (product.category === "yerbas") {
    return conditions.yerbasQualified && product.eligibleForWholesale === true ? price : null;
  }
  return null;
}

export function summarizeWholesale(lines, {
  yerbaMinimumGrams = 12_000,
  yuyoMinimumUnits = YUYOS_WHOLESALE_MIN_UNITS
} = {}) {
  const normalized = lines
    .map((line) => ({
      product: line.product,
      quantity: safeQuantity(line.quantity),
      mode: line.mode === "retail" ? "retail" : "wholesale"
    }))
    .filter((line) => line.product && line.quantity > 0 && line.mode === "wholesale");
  const categoryUnits = Object.fromEntries(categoryOrder.map((category) => [category, 0]));
  normalized.forEach(({ product, quantity }) => {
    if (product.category in categoryUnits) categoryUnits[product.category] += quantity;
  });

  const yuyoUnits = categoryUnits.hierbas;
  const yerbaWeightGrams = eligibleYerbaWeight(normalized);
  const conditions = {
    yuyosQualified: yuyoUnits >= yuyoMinimumUnits,
    yerbasQualified: yerbaWeightGrams >= yerbaMinimumGrams
  };
  const pricedLines = normalized.map((line) => ({
    ...line,
    unitPrice: wholesaleUnitPrice(line.product, conditions)
  }));
  const subtotal = pricedLines.reduce(
    (total, line) => total + (line.unitPrice === null ? 0 : line.unitPrice * line.quantity),
    0
  );

  return {
    lines: pricedLines,
    itemCount: normalized.reduce((total, line) => total + line.quantity, 0),
    categoryUnits,
    yuyoUnits,
    yuyoMinimumUnits,
    yuyosQualified: conditions.yuyosQualified,
    yerbaWeightGrams,
    yerbaMinimumGrams,
    yerbasQualified: conditions.yerbasQualified,
    pricedLineCount: pricedLines.filter((line) => line.unitPrice !== null).length,
    quotedLineCount: pricedLines.filter((line) => line.unitPrice === null).length,
    subtotal
  };
}

function messageLine({ product, quantity, unitPrice }) {
  const price = unitPrice === null
    ? "precio mayorista a confirmar"
    : formatMoney(unitPrice * quantity);
  return `• ${quantity} × ${wholesaleProductName(product)} — ${price}`;
}

export function buildWholesaleMessage(summary) {
  const sections = categoryOrder.flatMap((category) => {
    const lines = summary.lines.filter((line) => line.product.category === category);
    if (!lines.length) return [];
    const extra = category === "hierbas"
      ? [
          `Total Yuyos: ${summary.yuyoUnits} unidades`,
          `Condición mayorista de Yuyos: ${summary.yuyosQualified ? "alcanzada" : "no alcanzada"}`
        ]
      : category === "yerbas"
        ? [
            `Peso de Yerbas elegibles: ${formatWeight(summary.yerbaWeightGrams)}`,
            `Condición mayorista de Yerbas: ${summary.yerbasQualified ? "alcanzada" : "no alcanzada"}`
          ]
        : [];
    return [categoryLabels[category], ...lines.map(messageLine), ...extra, ""];
  });

  return [
    "PEDIDO MAYORISTA KALITKO",
    "",
    ...sections,
    ...(summary.subtotal > 0
      ? [`Subtotal de productos con precio: ${formatMoney(summary.subtotal)}`, ""]
      : []),
    "Quisiera coordinar disponibilidad, envío, datos del pedido y forma de pago."
  ].join("\n").trim();
}
