import { formatMoney } from "../utils/format.js";
import { isPriceOnRequest, unitPrice } from "./pricing.js";

function clean(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function productLine({ product, quantity }, wholesaleActive) {
  if (isPriceOnRequest(product)) {
    return `• ${quantity} × ${product.name} — precio a confirmar`;
  }
  const price = unitPrice(product, wholesaleActive);
  return `• ${quantity} × ${product.name} — ${formatMoney(price * quantity)}`;
}

function totalsLines(summary) {
  if (!summary.hasQuotedProducts) return [`Total: ${formatMoney(summary.total)}`];
  if (summary.pricedItemCount > 0) {
    return [
      `Subtotal de productos con precio: ${formatMoney(summary.total)}`,
      "Algunos precios están pendientes de confirmación."
    ];
  }
  return ["Precio a confirmar.", "Los precios están pendientes de confirmación."];
}

export function normalizeOrderData(values = {}) {
  return Object.fromEntries([
    "fullName", "email", "phone", "deliveryMethod", "province", "city",
    "postalCode", "street", "streetNumber", "floor", "apartment",
    "reference", "branch"
  ].map((field) => [field, clean(values[field])]));
}

export function buildOrderMessage(summary, values) {
  const data = normalizeOrderData(values);
  const deliveryLines = data.deliveryMethod === "branch"
    ? [
        "Modalidad: Retiro en sucursal de Correo Argentino",
        `Provincia: ${data.province}`,
        `Localidad: ${data.city}`,
        `Sucursal preferida: ${data.branch}`
      ]
    : [
        "Modalidad: Envío a domicilio",
        `Provincia: ${data.province}`,
        `Localidad: ${data.city}`,
        `CP: ${data.postalCode}`,
        `Dirección: ${data.street} ${data.streetNumber}`,
        ...(data.floor || data.apartment
          ? [`Piso/Depto: ${[data.floor, data.apartment].filter(Boolean).join(" / ")}`]
          : []),
        ...(data.reference ? [`Referencia: ${data.reference}`] : [])
      ];

  return [
    "Hola Kalitko, quiero realizar este pedido:",
    "",
    "PEDIDO",
    ...summary.lines.map((line) => productLine(line, summary.wholesaleActive)),
    "",
    ...totalsLines(summary),
    "",
    "DATOS DE ENVÍO",
    `Nombre: ${data.fullName}`,
    `Celular: ${data.phone}`,
    `Email: ${data.email}`,
    "",
    ...deliveryLines,
    "",
    "Quedo a la espera de la confirmación del envío y total final."
  ].join("\n");
}

export function buildWhatsAppUrl(number, message) {
  const normalizedNumber = String(number || "").replace(/\D/g, "");
  if (!normalizedNumber) return null;
  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}
