import { formatMeasure, formatMoney, formatWeight } from "../utils/format.js";
import { isPriceOnRequest, unitPrice } from "./pricing.js";

export function buildPreview(summary) {
  const productLines = summary.lines.map(({ product, quantity }) => {
    if (isPriceOnRequest(product)) {
      return `• ${quantity} × ${product.name} (${formatMeasure(product.weightGrams)}) — precio a confirmar`;
    }
    const price = unitPrice(product, summary.wholesaleActive);
    return `• ${product.name} (${formatMeasure(product.weightGrams)}): ${quantity} × ${formatMoney(price)} = ${formatMoney(price * quantity)}`;
  });

  const totalLine = summary.hasQuotedProducts
    ? summary.pricedItemCount > 0
      ? `Subtotal de productos con precio: ${formatMoney(summary.total)}`
      : "Productos del pedido: precio a confirmar"
    : `Total ilustrativo de productos: ${formatMoney(summary.total)}`;

  return [
    "VISTA PREVIA — NO SE ENVÍA",
    "",
    "Hola Kalitko, quisiera consultar este pedido:",
    "",
    ...productLines,
    "",
    `Peso de yerba elegible: ${formatWeight(summary.weightGrams)} / 12 kg`,
    summary.wholesaleActive
      ? `Ahorro ilustrativo por volumen: ${formatMoney(summary.savings)}`
      : "Beneficio por volumen: todavía no alcanzado.",
    totalLine,
    ...(summary.hasQuotedProducts
      ? ["El pedido incluye productos cuyo valor debe confirmarse con Kalitko."]
      : []),
    "",
    "Envío, disponibilidad, importe final y transferencia a confirmar con Kalitko."
  ].join("\n");
}

