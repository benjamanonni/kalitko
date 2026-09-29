const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2
});

export function formatMoney(value) {
  const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
  return moneyFormatter.format(safeValue);
}

export function formatWeight(grams) {
  const safeGrams = Number.isFinite(Number(grams)) ? Math.max(0, Number(grams)) : 0;
  return `${numberFormatter.format(safeGrams / 1000)} kg`;
}

export function formatMeasure(grams) {
  return grams >= 1000 ? formatWeight(grams) : `${grams} g`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

