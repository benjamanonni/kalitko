import { formatMeasure, formatMoney, formatWeight } from "../utils/format.js";
import { unitPrice } from "./pricing.js";

export function buildPreview(summary) {
  const productLines = summary.lines.map(({ product, quantity }) => {
    const price = unitPrice(product, summary.wholesaleActive);
    return `• ${product.name} (${formatMeasure(product.weightGrams)}): ${quantity} × ${formatMoney(price)} = ${formatMoney(price * quantity)}`;
  });

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
    `Total ilustrativo de productos: ${formatMoney(summary.total)}`,
    "",
    "Envío, disponibilidad, importe final y transferencia a confirmar con Kalitko."
  ].join("\n");
}

