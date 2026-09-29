export function safeQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function safePrice(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

export function eligibleWeight(lines) {
  return lines.reduce((total, line) => {
    const weight = Number.isFinite(Number(line.product?.weightGrams))
      ? Math.max(0, Number(line.product.weightGrams))
      : 0;
    return total + (line.product?.eligibleForWholesale ? weight * safeQuantity(line.quantity) : 0);
  }, 0);
}

export function qualifiesForWholesale(lines, minimumGrams) {
  return eligibleWeight(lines) >= Math.max(0, Number(minimumGrams) || 0);
}

export function unitPrice(product, wholesaleActive) {
  const wholesale = product?.wholesalePrice;
  if (
    wholesaleActive &&
    product?.eligibleForWholesale &&
    wholesale !== null &&
    Number.isFinite(Number(wholesale))
  ) {
    return safePrice(wholesale);
  }
  return safePrice(product?.retailPrice);
}

export function lineSubtotal(product, quantity, wholesaleActive) {
  return unitPrice(product, wholesaleActive) * safeQuantity(quantity);
}

export function summarizeCart(lines, minimumGrams) {
  const normalized = lines
    .map((line) => ({ product: line.product, quantity: safeQuantity(line.quantity) }))
    .filter((line) => line.product && line.quantity > 0);
  const weightGrams = eligibleWeight(normalized);
  const wholesaleActive = weightGrams >= Math.max(0, Number(minimumGrams) || 0);
  const retailTotal = normalized.reduce(
    (total, line) => total + safePrice(line.product.retailPrice) * line.quantity,
    0
  );
  const total = normalized.reduce(
    (sum, line) => sum + lineSubtotal(line.product, line.quantity, wholesaleActive),
    0
  );

  return {
    lines: normalized,
    itemCount: normalized.reduce((sum, line) => sum + line.quantity, 0),
    weightGrams,
    wholesaleActive,
    retailTotal,
    total,
    savings: Math.max(0, retailTotal - total)
  };
}

