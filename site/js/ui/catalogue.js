import { escapeHtml, formatMeasure, formatMoney } from "../utils/format.js";

export function renderCatalogue(container, products) {
  container.innerHTML = products.map((product, index) => `
    <article class="product" data-category="${escapeHtml(product.category)}" aria-label="${escapeHtml(product.name)}">
      <div class="product-photo">
        <img src="${escapeHtml(product.image)}" width="${product.imageWidth}" height="${product.imageHeight}"
          loading="lazy" decoding="async" alt="${escapeHtml(product.alt)}">
        <span class="photo-index">${String(index + 1).padStart(2, "0")} / ${String(products.length).padStart(2, "0")}</span>
      </div>
      <div class="product-desc">
        <div>
          <p class="product-type">${escapeHtml(product.category)} <span>·</span> ${formatMeasure(product.weightGrams)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-price" data-price="${escapeHtml(product.id)}">${formatMoney(product.retailPrice)} <small>muestra</small></p>
        </div>
        <button class="add-product" type="button" data-add="${escapeHtml(product.id)}"
          aria-label="Agregar ${escapeHtml(product.name)} a la bolsa">Agregar <span aria-hidden="true">+</span></button>
      </div>
    </article>
  `).join("");
}

export function setupFilters(container) {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((candidate) => {
        candidate.setAttribute("aria-pressed", String(candidate === button));
      });
      container.querySelectorAll(".product").forEach((product) => {
        product.hidden = button.dataset.filter !== "all" && product.dataset.category !== button.dataset.filter;
      });
    });
  });
}

