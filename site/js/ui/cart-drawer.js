import { buildPreview } from "../commerce/preview.js";
import { isPriceOnRequest, summarizeCart, unitPrice } from "../commerce/pricing.js";
import { escapeHtml, formatMoney, formatWeight } from "../utils/format.js";
import { measureText } from "../utils/product.js";

export function cartLineMeta(product, wholesaleActive) {
  const details = [];
  const measure = measureText(product);
  if (measure) details.push(measure);
  details.push(isPriceOnRequest(product)
    ? "Precio a confirmar"
    : `${formatMoney(unitPrice(product, wholesaleActive))} c/u · muestra`);
  return details.join(" · ");
}

export function setupCartDrawer({ cart, products, minimumGrams }) {
  const drawer = document.querySelector("#cart-dialog");
  const preview = document.querySelector("#preview-dialog");
  const cartItems = document.querySelector("#cart-items");
  const productById = new Map(products.map((product) => [product.id, product]));
  const dialogTriggers = new WeakMap();
  let latestSummary = summarizeCart([], minimumGrams);

  function openDialog(dialog, trigger) {
    dialogTriggers.set(dialog, trigger || document.activeElement);
    dialog.showModal();
  }

  function closeDialog(dialog) {
    const trigger = dialogTriggers.get(dialog);
    dialog.close();
    if (trigger instanceof HTMLElement) trigger.focus();
  }

  function render(lines) {
    latestSummary = summarizeCart(lines, minimumGrams);
    const summary = latestSummary;
    document.querySelectorAll("[data-count]").forEach((node) => {
      node.textContent = summary.itemCount;
    });
    const totalLabel = document.querySelector("#cart-total-label");
    const total = document.querySelector("#cart-total");
    totalLabel.textContent = summary.hasQuotedProducts
      ? summary.pricedItemCount > 0 ? "Subtotal de productos con precio" : "Productos a cotizar"
      : "Total ilustrativo";
    total.textContent = summary.hasQuotedProducts && summary.pricedItemCount === 0
      ? "Precio a confirmar"
      : formatMoney(summary.total);
    document.querySelector("#floating-total").textContent = summary.hasQuotedProducts && summary.pricedItemCount === 0
      ? "A confirmar ↗"
      : `${formatMoney(summary.total)} ↗`;
    document.querySelector(".floating-bag").classList.toggle("is-visible", summary.itemCount > 0);
    document.querySelector("#preview-order").disabled = summary.itemCount === 0;

    cartItems.innerHTML = summary.lines.length ? summary.lines.map(({ product, quantity }) => {
      const price = unitPrice(product, summary.wholesaleActive);
      const pending = isPriceOnRequest(product);
      return `<div class="cart-row">
        <div><h3>${escapeHtml(product.name)}</h3>
          <small>${cartLineMeta(product, summary.wholesaleActive)}</small>
          <div class="qty">
            <button type="button" data-qty="${escapeHtml(product.id)}" data-step="-1" aria-label="Quitar una unidad de ${escapeHtml(product.name)}">−</button>
            <output aria-label="Cantidad">${quantity}</output>
            <button type="button" data-qty="${escapeHtml(product.id)}" data-step="1" aria-label="Agregar una unidad de ${escapeHtml(product.name)}">+</button>
          </div>
          <button class="remove-line" type="button" data-remove="${escapeHtml(product.id)}">Quitar</button>
        </div>
        <strong>${pending ? "Precio a confirmar" : formatMoney(price * quantity)}</strong>
      </div>`;
    }).join("") : '<p class="cart-empty">La bolsa está vacía. Elegí algo del catálogo.</p>';

    const rail = document.querySelector("#bulk-rail");
    rail.hidden = summary.itemCount === 0;
    if (summary.itemCount > 0) {
      const missing = Math.max(0, minimumGrams - summary.weightGrams);
      document.querySelector("#bulk-text").textContent = summary.wholesaleActive
        ? `Llegaste a ${formatWeight(summary.weightGrams)}. Precios por volumen activados.`
        : `Llevás ${formatWeight(summary.weightGrams)} de yerba elegible. Te faltan ${formatWeight(missing)}.`;
      const progress = Math.min(100, Math.round(100 * summary.weightGrams / minimumGrams));
      document.querySelector("#bulk-progress").style.width = `${progress}%`;
      rail.querySelector("[role=progressbar]").setAttribute("aria-valuenow", String(progress));
    }
    document.querySelector("#cart-saving").textContent = summary.wholesaleActive
      ? `Ahorro ilustrativo por volumen: ${formatMoney(summary.savings)}`
      : "";
    document.querySelector("#cart-pricing-note").textContent = summary.hasQuotedProducts
      ? "Este pedido incluye productos cuyo precio se confirmará con Kalitko. El subtotal no representa el importe final completo."
      : "";
    document.querySelectorAll("[data-price]").forEach((node) => {
      const product = productById.get(node.dataset.price);
      node.innerHTML = `${formatMoney(unitPrice(product, summary.wholesaleActive))} <small>muestra</small>`;
    });
  }

  document.querySelectorAll("[data-open-cart]").forEach((button) => {
    button.addEventListener("click", () => openDialog(drawer, button));
  });
  document.querySelector("[data-close-cart]").addEventListener("click", () => closeDialog(drawer));
  document.querySelector("#preview-close").addEventListener("click", () => closeDialog(preview));
  document.querySelector("#preview-order").addEventListener("click", (event) => {
    document.querySelector("#preview-text").textContent = buildPreview(latestSummary);
    openDialog(preview, event.currentTarget);
  });
  cartItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-qty]");
    const removeButton = event.target.closest("[data-remove]");
    if (quantityButton) cart.change(quantityButton.dataset.qty, Number(quantityButton.dataset.step));
    if (removeButton) cart.remove(removeButton.dataset.remove);
  });
  [drawer, preview].forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });
  cart.subscribe(render);
  render(cart.lines());
  return { render };
}

