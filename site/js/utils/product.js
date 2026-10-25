import { formatMeasure } from "./format.js";

export function hasMeasure(product) {
  return Number.isFinite(Number(product?.weightGrams))
    && Number(product.weightGrams) > 0;
}

export function measureText(product) {
  return hasMeasure(product) ? formatMeasure(product.weightGrams) : "";
}
