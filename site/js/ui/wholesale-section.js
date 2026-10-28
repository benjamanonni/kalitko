import { WHOLESALE_MIN_GRAMS, WHATSAPP_NUMBER } from "../config.js";
import { buildWhatsAppUrl } from "../commerce/order-message.js";
import {
  buildWholesaleMessage,
  createWholesaleOrder,
  summarizeWholesale,
  wholesaleProductName,
  YUYOS_WHOLESALE_MIN_UNITS
} from "../commerce/wholesale.js";
import { escapeHtml, formatMeasure, formatMoney, formatWeight } from "../utils/format.js";
import { hasMeasure } from "../utils/product.js";

const categoryOrder = ["yerbas", "hierbas", "blends"];
const categoryLabels = { yerbas: "Yerbas", hierbas: "Yuyos", blends: "Blends" };

function wholesalePriceLabel(product) {
  const price = Number(product.wholesalePrice);
  return Number.isFinite(price) && price > 0 ? `${formatMoney(price)} c/u` : "Precio mayorista a confirmar";
}

function renderRows(container, products, order) {
  container.innerHTML = categoryOrder.map((category) => {
    const rows = products.filter((product) => product.category === category).map((product) => `
      <div class="wholesale-row" data-wholesale-product="${escapeHtml(product.id)}">
        <div class="wholesale-product">
          <strong>${escapeHtml(wholesaleProductName(product))}</strong>
        </div>
        <span class="wholesale-measure">${hasMeasure(product) ? formatMeasure(product.weightGrams) : ""}</span>
        <span class="wholesale-price">${wholesalePriceLabel(product)}</span>
        <div class="wholesale-quantity">
          <button type="button" data-wholesale-step="-1" data-product-id="${escapeHtml(product.id)}"
            aria-label="Quitar una unidad de ${escapeHtml(wholesaleProductName(product))}">−</button>
          <output aria-label="Cantidad de ${escapeHtml(wholesaleProductName(product))}">${order.quantity(product.id)}</output>
          <button type="button" data-wholesale-step="1" data-product-id="${escapeHtml(product.id)}"
            aria-label="Agregar una unidad de ${escapeHtml(wholesaleProductName(product))}">+</button>
        </div>
      </div>`).join("");
    return `<div class="wholesale-group-label" role="heading" aria-level="3">${categoryLabels[category]}</div>${rows}`;
  }).join("");
}

function updateSummary(summary) {
  document.querySelector("#wholesale-yerbas-count").textContent = `${summary.categoryUnits.yerbas} unidades`;
  document.querySelector("#wholesale-yuyos-count").textContent = `${summary.yuyoUnits} unidades`;
  document.querySelector("#wholesale-blends-count").textContent = `${summary.categoryUnits.blends} unidades`;

  const yuyosStatus = document.querySelector("#wholesale-yuyos-status");
  yuyosStatus.textContent = summary.yuyosQualified
    ? "Precio mayorista de Yuyos activado"
    : `Faltan ${summary.yuyoMinimumUnits - summary.yuyoUnits} unidades para la condición mayorista`;
  const yuyosProgress = document.querySelector("#wholesale-yuyos-progress");
  yuyosProgress.value = Math.min(summary.yuyoUnits, summary.yuyoMinimumUnits);
  yuyosProgress.setAttribute("aria-valuenow", String(Math.min(summary.yuyoUnits, summary.yuyoMinimumUnits)));

  const yerbasStatus = document.querySelector("#wholesale-yerbas-status");
  yerbasStatus.textContent = summary.yerbasQualified
    ? "Condición mayorista de Yerbas alcanzada"
    : `${formatWeight(summary.yerbaWeightGrams)} / ${formatWeight(summary.yerbaMinimumGrams)} elegibles`;

  const subtotal = document.querySelector("#wholesale-subtotal");
  subtotal.textContent = summary.subtotal > 0 ? formatMoney(summary.subtotal) : "Sin subtotal confirmado";
  document.querySelector("#wholesale-quoted").textContent = `${summary.quotedLineCount} productos a cotizar`;
}

export function setupWholesaleSection({ products }) {
  const list = document.querySelector("#wholesale-list");
  const sendButton = document.querySelector("#wholesale-whatsapp");
  const note = document.querySelector("#wholesale-whatsapp-note");
  const order = createWholesaleOrder(products);
  let latestSummary = summarizeWholesale([], {
    yerbaMinimumGrams: WHOLESALE_MIN_GRAMS,
    yuyoMinimumUnits: YUYOS_WHOLESALE_MIN_UNITS
  });

  renderRows(list, products, order);

  order.subscribe((lines) => {
    latestSummary = summarizeWholesale(lines, {
      yerbaMinimumGrams: WHOLESALE_MIN_GRAMS,
      yuyoMinimumUnits: YUYOS_WHOLESALE_MIN_UNITS
    });
    lines.forEach(({ product, quantity }) => {
      const output = list.querySelector(`[data-wholesale-product="${product.id}"] output`);
      if (output) output.textContent = quantity;
    });
    list.querySelectorAll("[data-wholesale-product]").forEach((row) => {
      if (!lines.some((line) => line.product.id === row.dataset.wholesaleProduct)) {
        row.querySelector("output").textContent = "0";
      }
    });
    updateSummary(latestSummary);
    sendButton.disabled = latestSummary.itemCount === 0 || !String(WHATSAPP_NUMBER).replace(/\D/g, "");
    note.textContent = !String(WHATSAPP_NUMBER).replace(/\D/g, "")
      ? "Falta configurar el número oficial de WhatsApp de Kalitko."
      : latestSummary.itemCount === 0
        ? "Agregá al menos un producto para preparar la consulta."
        : "Se abrirá WhatsApp con el pedido mayorista para coordinar los datos restantes.";
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wholesale-step]");
    if (!button) return;
    order.change(button.dataset.productId, Number(button.dataset.wholesaleStep));
  });

  sendButton.addEventListener("click", () => {
    if (!latestSummary.itemCount) return;
    const url = buildWhatsAppUrl(WHATSAPP_NUMBER, buildWholesaleMessage(latestSummary));
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });

  updateSummary(latestSummary);
  sendButton.disabled = true;
  note.textContent = String(WHATSAPP_NUMBER).replace(/\D/g, "")
    ? "Agregá al menos un producto para preparar la consulta."
    : "Falta configurar el número oficial de WhatsApp de Kalitko.";

  return { order, get summary() { return latestSummary; } };
}
