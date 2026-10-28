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
const yerbaDescriptions = {
  tradicional: "Suave · equilibrada",
  despalada: "Suave · menos palo",
  barbacua: "Intensa · ahumada"
};

function normalized(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function wholesalePriceLabel(product) {
  const price = Number(product.wholesalePrice);
  return Number.isFinite(price) && price > 0 ? `${formatMoney(price)} c/u` : "A confirmar";
}

function searchText(product) {
  return normalized([
    wholesaleProductName(product),
    categoryLabels[product.category],
    yerbaDescriptions[product.id]
  ].filter(Boolean).join(" "));
}

function visibleProducts(products, filter, query) {
  const needle = normalized(query).trim();
  return products.filter((product) => {
    const matchesCategory = filter === "all" || product.category === filter;
    return matchesCategory && (!needle || searchText(product).includes(needle));
  });
}

function productRow(product, order) {
  const name = wholesaleProductName(product);
  const description = yerbaDescriptions[product.id];
  return `
    <div class="wholesale-sheet-row" data-wholesale-product="${escapeHtml(product.id)}">
      <span class="wholesale-family" data-label="Familia">${escapeHtml(categoryLabels[product.category])}</span>
      <figure class="wholesale-thumb" data-label="Imagen">
        <img src="${escapeHtml(product.image)}" width="${Number(product.imageWidth) || 1}" height="${Number(product.imageHeight) || 1}"
          loading="lazy" decoding="async" alt="">
      </figure>
      <div class="wholesale-product-name" data-label="Producto">
        <strong>${escapeHtml(name)}</strong>
        ${description ? `<small>${escapeHtml(description)}</small>` : ""}
      </div>
      <span class="wholesale-measure" data-label="Presentación">${hasMeasure(product) ? formatMeasure(product.weightGrams) : "—"}</span>
      <span class="wholesale-price" data-label="Precio mayorista">${wholesalePriceLabel(product)}</span>
      <div class="wholesale-quantity" data-label="Cantidad">
        <button type="button" data-wholesale-step="-1" data-product-id="${escapeHtml(product.id)}"
          aria-label="Quitar una unidad de ${escapeHtml(name)}">−</button>
        <output aria-label="Cantidad de ${escapeHtml(name)}">${order.quantity(product.id)}</output>
        <button type="button" data-wholesale-step="1" data-product-id="${escapeHtml(product.id)}"
          aria-label="Agregar una unidad de ${escapeHtml(name)}">+</button>
      </div>
    </div>`;
}

function renderRows(container, empty, products, order, filter, query) {
  const visible = visibleProducts(products, filter, query);
  container.innerHTML = categoryOrder.flatMap((category) => {
    const group = visible.filter((product) => product.category === category);
    if (!group.length) return [];
    return [
      `<h3 class="wholesale-group-title">${categoryLabels[category]}</h3>`,
      ...group.map((product) => productRow(product, order))
    ];
  }).join("");
  empty.hidden = visible.length > 0;
}

function countLabel(value) {
  return `${value} ${value === 1 ? "unidad" : "unidades"}`;
}

function updateSummary(summary) {
  document.querySelector("#wholesale-yerbas-count").textContent = countLabel(summary.categoryUnits.yerbas);
  document.querySelector("#wholesale-yuyos-count").textContent = countLabel(summary.yuyoUnits);
  document.querySelector("#wholesale-blends-count").textContent = countLabel(summary.categoryUnits.blends);
  document.querySelector("[data-wholesale-count]").textContent = summary.itemCount;

  const progressValue = Math.min(summary.yuyoUnits, summary.yuyoMinimumUnits);
  const progress = document.querySelector("#wholesale-yuyos-progress");
  progress.value = progressValue;
  progress.setAttribute("aria-valuenow", String(progressValue));
  document.querySelector("#wholesale-yuyos-ratio").textContent = `${summary.yuyoUnits} / ${summary.yuyoMinimumUnits}`;
  document.querySelector("#wholesale-yuyos-status").textContent = summary.yuyosQualified
    ? "Condición mayorista de Yuyos alcanzada."
    : `Faltan ${summary.yuyoMinimumUnits - summary.yuyoUnits} unidades para la condición mayorista.`;
  document.querySelector("#wholesale-yerbas-status").textContent = summary.yerbasQualified
    ? "Condición mayorista de Yerbas alcanzada."
    : `${formatWeight(summary.yerbaWeightGrams)} / ${formatWeight(summary.yerbaMinimumGrams)} elegibles.`;
  document.querySelector("#wholesale-subtotal").textContent = summary.subtotal > 0
    ? formatMoney(summary.subtotal)
    : "Sin subtotal confirmado";
  document.querySelector("#wholesale-quoted").textContent = `${summary.quotedLineCount} ${summary.quotedLineCount === 1 ? "línea" : "líneas"} a cotizar`;
}

export function setupWholesalePage({ products }) {
  const list = document.querySelector("#wholesale-page-list");
  const empty = document.querySelector("#wholesale-empty");
  const search = document.querySelector("#wholesale-search");
  const filters = document.querySelector(".wholesale-filters");
  const sendButton = document.querySelector("#wholesale-whatsapp");
  const note = document.querySelector("#wholesale-whatsapp-note");
  const order = createWholesaleOrder(products);
  let filter = "all";
  let query = "";
  let latestSummary = summarizeWholesale([], {
    yerbaMinimumGrams: WHOLESALE_MIN_GRAMS,
    yuyoMinimumUnits: YUYOS_WHOLESALE_MIN_UNITS
  });

  const render = () => renderRows(list, empty, products, order, filter, query);
  render();

  order.subscribe((lines) => {
    latestSummary = summarizeWholesale(lines, {
      yerbaMinimumGrams: WHOLESALE_MIN_GRAMS,
      yuyoMinimumUnits: YUYOS_WHOLESALE_MIN_UNITS
    });
    list.querySelectorAll("[data-wholesale-product]").forEach((row) => {
      row.querySelector("output").textContent = order.quantity(row.dataset.wholesaleProduct);
    });
    updateSummary(latestSummary);
    const hasNumber = Boolean(String(WHATSAPP_NUMBER).replace(/\D/g, ""));
    sendButton.disabled = latestSummary.itemCount === 0 || !hasNumber;
    note.textContent = !hasNumber
      ? "Falta configurar el número oficial de WhatsApp de Kalitko."
      : latestSummary.itemCount === 0
        ? "Elegí al menos un producto para preparar la consulta."
        : "WhatsApp abrirá con el resumen listo para coordinar los datos restantes.";
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wholesale-step]");
    if (!button) return;
    order.change(button.dataset.productId, Number(button.dataset.wholesaleStep));
  });

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-wholesale-filter]");
    if (!button) return;
    filter = button.dataset.wholesaleFilter;
    filters.querySelectorAll("[data-wholesale-filter]").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    render();
  });

  search.addEventListener("input", () => {
    query = search.value;
    render();
  });

  sendButton.addEventListener("click", () => {
    if (!latestSummary.itemCount) return;
    const url = buildWhatsAppUrl(WHATSAPP_NUMBER, buildWholesaleMessage(latestSummary));
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  });

  updateSummary(latestSummary);
  note.textContent = String(WHATSAPP_NUMBER).replace(/\D/g, "")
    ? "Elegí al menos un producto para preparar la consulta."
    : "Falta configurar el número oficial de WhatsApp de Kalitko.";

  return { order, get summary() { return latestSummary; } };
}
