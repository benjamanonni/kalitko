import { canAddToCart, hasValidPrice } from "../commerce/pricing.js";
import { escapeHtml, formatMeasure, formatMoney } from "../utils/format.js";

const ALL_VIEW_ORDER = ["yerbas", "blends", "hierbas"];
const ALL_YUYOS_LIMIT = 6;
const YUYOS_PAGE_SIZE = 8;

const categoryMeta = {
  yerbas: { title: "Yerbas", label: "Yerbas" },
  blends: { title: "Blends", label: "Blends" },
  hierbas: { title: "Yuyos", label: "Yuyos" }
};

function hasMeasure(product) {
  return Number.isFinite(Number(product.weightGrams)) && Number(product.weightGrams) > 0;
}

function supportsDetail(product) {
  return product.category === "hierbas" || product.category === "yerbas";
}

function backImage(product) {
  return Array.isArray(product.gallery)
    ? product.gallery.find((image) => image?.type === "back" && image?.src && image?.alt)
    : null;
}

function renderProductCard(product, position, total) {
  const priceAvailable = hasValidPrice(product);
  const orderAvailable = canAddToCart(product);
  const back = backImage(product);
  const measure = hasMeasure(product)
    ? ` <span>·</span> ${formatMeasure(product.weightGrams)}`
    : "";
  const categoryLabel = categoryMeta[product.category]?.label || product.category;

  return `
    <article class="product" data-category="${escapeHtml(product.category)}" data-product-id="${escapeHtml(product.id)}" aria-label="${escapeHtml(product.name)}">
      <div class="product-photo">
        <img src="${escapeHtml(product.image)}"${product.imageSrcset ? ` srcset="${escapeHtml(product.imageSrcset)}" sizes="${escapeHtml(product.imageSizes)}"` : ""} width="${product.imageWidth}" height="${product.imageHeight}"
          loading="lazy" decoding="async" alt="${escapeHtml(product.alt)}">
        <span class="photo-index">${String(position).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span>
        ${back ? `<button class="card-back-thumb" type="button" data-card-back="${escapeHtml(product.id)}"
          aria-label="Ampliar etiqueta trasera de ${escapeHtml(product.name)}">
          <img src="${escapeHtml(back.src)}" width="${back.width}" height="${back.height}" loading="lazy" decoding="async" alt="">
        </button>` : ""}
      </div>
      <div class="product-desc">
        <div>
          <p class="product-type">${escapeHtml(categoryLabel)}${measure}</p>
          <h3>${escapeHtml(product.name)}</h3>
          ${priceAvailable
            ? `<p class="product-price" data-price="${escapeHtml(product.id)}">${formatMoney(product.retailPrice)} <small>muestra</small></p>`
            : '<p class="product-price product-price--pending">Precio a confirmar</p>'}
        </div>
        <div class="product-actions">
          ${supportsDetail(product)
            ? `<button class="product-detail" type="button" data-detail="${escapeHtml(product.id)}">Ver detalle</button>`
            : ""}
          ${orderAvailable
            ? `<button class="add-product" type="button" data-add="${escapeHtml(product.id)}"
              aria-label="Agregar ${escapeHtml(product.name)} a la bolsa">Agregar <span aria-hidden="true">+</span></button>`
            : ""}
        </div>
      </div>
    </article>
  `;
}

function renderCards(products, positions, total) {
  return products.map((product) => renderProductCard(product, positions.get(product.id), total)).join("");
}

function categoryAction(category, count) {
  if (category === "yerbas") return "Ver todas las yerbas";
  if (category === "blends") return "Ver todos los blends";
  return `Ver los ${count} yuyos`;
}

function renderAllView(container, products, positions) {
  const total = products.length;
  container.innerHTML = `<div class="catalogue-groups">
    ${ALL_VIEW_ORDER.map((category) => {
      const allInCategory = products.filter((product) => product.category === category);
      const visibleProducts = category === "hierbas"
        ? allInCategory.slice(0, ALL_YUYOS_LIMIT)
        : allInCategory;
      const meta = categoryMeta[category];

      return `<section class="catalogue-group" aria-labelledby="catalogue-group-${category}">
        <header class="catalogue-group-head">
          <div>
            <p class="intro-label">${String(allInCategory.length).padStart(2, "0")} productos</p>
            <h3 id="catalogue-group-${category}">${meta.title}</h3>
          </div>
        </header>
        <div class="products">${renderCards(visibleProducts, positions, total)}</div>
        <button class="category-link" type="button" data-view-category="${category}">
          ${categoryAction(category, allInCategory.length)} <span aria-hidden="true">→</span>
        </button>
      </section>`;
    }).join("")}
  </div>`;
}

function renderCategoryView(container, products, positions, category, yuyosVisible) {
  const allInCategory = products.filter((product) => product.category === category);
  const visibleProducts = category === "hierbas"
    ? allInCategory.slice(0, yuyosVisible)
    : allInCategory;
  const meta = categoryMeta[category];
  const remaining = allInCategory.length - visibleProducts.length;

  container.innerHTML = `<section class="catalogue-category" aria-labelledby="catalogue-category-heading">
    <header class="catalogue-category-head">
      <p class="intro-label">${String(allInCategory.length).padStart(2, "0")} productos</p>
      <h3 id="catalogue-category-heading">${meta.title}</h3>
    </header>
    <div class="products">${renderCards(visibleProducts, positions, products.length)}</div>
    ${category === "hierbas" && remaining > 0
      ? `<button class="load-more" type="button" data-load-more-yuyos>
          Ver más yuyos <span aria-hidden="true">+${Math.min(YUYOS_PAGE_SIZE, remaining)}</span>
        </button>`
      : ""}
  </section>`;
}

function scrollToCatalogue() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelector("#catalogo")?.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start"
  });
}

export function setupCatalogue({ container, products, onShowDetail, onOpenImage }) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const positions = new Map(products.map((product, index) => [product.id, index + 1]));
  const filters = [...document.querySelectorAll("[data-filter]")];
  let activeView = "all";
  let yuyosVisible = YUYOS_PAGE_SIZE;

  function syncFilters() {
    filters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeView));
    });
  }

  function render() {
    if (activeView === "all") renderAllView(container, products, positions);
    else renderCategoryView(container, products, positions, activeView, yuyosVisible);
  }

  function setView(view, { scroll = false } = {}) {
    if (view !== "all" && !categoryMeta[view]) return;
    activeView = view;
    if (view === "hierbas") yuyosVisible = YUYOS_PAGE_SIZE;
    syncFilters();
    render();
    if (scroll) requestAnimationFrame(scrollToCatalogue);
  }

  filters.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.filter));
  });

  container.addEventListener("click", (event) => {
    const categoryButton = event.target.closest("[data-view-category]");
    const loadMoreButton = event.target.closest("[data-load-more-yuyos]");
    const detailButton = event.target.closest("[data-detail]");
    const backButton = event.target.closest("[data-card-back]");

    if (categoryButton) setView(categoryButton.dataset.viewCategory, { scroll: true });
    if (loadMoreButton) {
      yuyosVisible += YUYOS_PAGE_SIZE;
      render();
    }
    if (detailButton) {
      const product = productsById.get(detailButton.dataset.detail);
      if (product) onShowDetail(product, detailButton);
    }
    if (backButton) {
      const product = productsById.get(backButton.dataset.cardBack);
      const image = backImage(product);
      if (image) onOpenImage(image, backButton);
    }
  });

  setView("all");

  return {
    get activeView() { return activeView; },
    setView
  };
}
