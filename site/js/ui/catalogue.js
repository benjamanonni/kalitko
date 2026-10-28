import { canAddToCart, hasValidPrice } from "../commerce/pricing.js";
import { escapeHtml, formatMeasure, formatMoney } from "../utils/format.js";
import { hasMeasure } from "../utils/product.js";

const ALL_VIEW_ORDER = ["yerbas", "blends", "hierbas"];
const ALL_YUYOS_LIMIT = 6;
const MOBILE_YUYOS_PAGE_SIZE = 8;

const categoryMeta = {
  yerbas: { title: "Yerbas", label: "Yerbas" },
  blends: { title: "Blends", label: "Blends" },
  hierbas: { title: "Yuyos", label: "Yuyos" }
};

function supportsDetail(product) {
  return product.category === "hierbas";
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
          aria-label="Ver parte trasera de ${escapeHtml(product.name)}">
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

function renderCards(products, total = products.length) {
  return products.map((product, index) => renderProductCard(product, index + 1, total)).join("");
}

function renderProductRail(products, total, label) {
  return `<div class="product-rail" data-product-rail>
    <button class="rail-nav rail-nav--prev" type="button" data-scroll-products="prev"
      aria-label="Ver productos anteriores de ${escapeHtml(label)}">←</button>
    <div class="products" tabindex="0" aria-label="Productos de ${escapeHtml(label)}">
      ${renderCards(products, total)}
    </div>
    <button class="rail-nav rail-nav--next" type="button" data-scroll-products="next"
      aria-label="Ver productos siguientes de ${escapeHtml(label)}">→</button>
  </div>`;
}

function categoryAction(category, count) {
  if (category === "yerbas") return "Ver todas las yerbas";
  if (category === "blends") return "Ver todos los blends";
  return "Ver todos los yuyos";
}

function renderAllView(container, products) {
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
        ${renderProductRail(visibleProducts, allInCategory.length, meta.label)}
        <button class="category-link" type="button" data-view-category="${category}">
          ${categoryAction(category, allInCategory.length)} <span aria-hidden="true">→</span>
        </button>
      </section>`;
    }).join("")}
  </div>`;
}

function renderCategoryView(container, products, category, visibleYuyos = Number.POSITIVE_INFINITY) {
  const allInCategory = products.filter((product) => product.category === category);
  const visibleProducts = category === "hierbas"
    ? allInCategory.slice(0, visibleYuyos)
    : allInCategory;
  const hasMoreYuyos = category === "hierbas" && visibleProducts.length < allInCategory.length;
  const meta = categoryMeta[category];

  container.innerHTML = `<section class="catalogue-category" aria-labelledby="catalogue-category-heading">
    <header class="catalogue-category-head">
      <div>
        <p class="intro-label">${String(allInCategory.length).padStart(2, "0")} productos</p>
        <h3 id="catalogue-category-heading">${meta.title}</h3>
      </div>
    </header>
    ${renderProductRail(visibleProducts, allInCategory.length, meta.label)}
    ${hasMoreYuyos
      ? '<button class="load-more" type="button" data-load-more-yuyos>Ver más yuyos</button>'
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
  const filters = [...document.querySelectorAll("[data-filter]")];
  const layoutButtons = [...document.querySelectorAll("[data-catalogue-layout]")];
  const mobileYuyosQuery = window.matchMedia("(max-width: 720px)");
  let activeView = "all";
  let activeLayout = "grid";
  let visibleMobileYuyos = MOBILE_YUYOS_PAGE_SIZE;

  function syncFilters() {
    filters.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.filter === activeView));
    });
  }
  function syncLayout() {
    container.classList.toggle("is-compact", activeLayout === "compact");
    container.classList.toggle("is-yuyos-view", activeView === "hierbas");
    layoutButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.catalogueLayout === activeLayout));
    });
  }
  function updateRail(rail) {
    const productsElement = rail.querySelector(".products");
    const previous = rail.querySelector('[data-scroll-products="prev"]');
    const next = rail.querySelector('[data-scroll-products="next"]');
    if (!productsElement || !previous || !next) return;
    const maximum = productsElement.scrollWidth - productsElement.clientWidth;
    const scrollable = maximum > 2;
    rail.classList.toggle("is-scrollable", scrollable);
    previous.disabled = !scrollable || productsElement.scrollLeft <= 2;
    next.disabled = !scrollable || productsElement.scrollLeft >= maximum - 2;
  }
  function updateRails() {
    container.querySelectorAll("[data-product-rail]").forEach(updateRail);
  }
  function observeRails() {
    container.querySelectorAll(".products").forEach((productsElement) => {
      productsElement.addEventListener("scroll", () => {
        const rail = productsElement.closest("[data-product-rail]");
        if (rail) updateRail(rail);
      }, { passive: true });
    });
    requestAnimationFrame(updateRails);
  }
  function render() {
    if (activeView === "all") renderAllView(container, products);
    else {
      const visibleYuyos = activeView === "hierbas" && mobileYuyosQuery.matches
        ? visibleMobileYuyos
        : Number.POSITIVE_INFINITY;
      renderCategoryView(container, products, activeView, visibleYuyos);
    }
    syncLayout();
    observeRails();
  }
  function setView(view, { scroll = false } = {}) {
    if (view !== "all" && !categoryMeta[view]) return;
    activeView = view === "all" ? "all" : view;
    if (activeView === "hierbas") visibleMobileYuyos = MOBILE_YUYOS_PAGE_SIZE;
    syncFilters();
    render();
    if (scroll) requestAnimationFrame(scrollToCatalogue);
  }
  filters.forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.filter));
  });
  layoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const layout = button.dataset.catalogueLayout;
      if (layout !== "grid" && layout !== "compact") return;
      activeLayout = layout;
      syncLayout();
      requestAnimationFrame(updateRails);
    });
  });
  container.addEventListener("click", (event) => {
    const categoryButton = event.target.closest("[data-view-category]");
    const loadMoreButton = event.target.closest("[data-load-more-yuyos]");
    const detailButton = event.target.closest("[data-detail]");
    const backButton = event.target.closest("[data-card-back]");
    const scrollButton = event.target.closest("[data-scroll-products]");
    if (scrollButton) {
      const productsElement = scrollButton.closest("[data-product-rail]")?.querySelector(".products");
      if (productsElement) {
        const direction = scrollButton.dataset.scrollProducts === "prev" ? -1 : 1;
        productsElement.scrollBy({ left: productsElement.clientWidth * .82 * direction, behavior: "smooth" });
      }
    }
    if (categoryButton) setView(categoryButton.dataset.viewCategory, { scroll: true });
    if (loadMoreButton && activeView === "hierbas" && mobileYuyosQuery.matches) {
      const yuyos = products.filter((product) => product.category === "hierbas");
      const firstNewProduct = yuyos[visibleMobileYuyos];
      const scrollPosition = window.scrollY;
      visibleMobileYuyos = Math.min(visibleMobileYuyos + MOBILE_YUYOS_PAGE_SIZE, yuyos.length);
      render();
      if (firstNewProduct) requestAnimationFrame(() => {
        window.scrollTo({ top: scrollPosition, behavior: "auto" });
        const productCard = container.querySelector(`[data-product-id="${firstNewProduct.id}"]`);
        if (!(productCard instanceof HTMLElement)) return;
        productCard.setAttribute("tabindex", "-1");
        productCard.focus({ preventScroll: true });
        productCard.addEventListener("blur", () => productCard.removeAttribute("tabindex"), { once: true });
      });
    }
    if (detailButton) {
      const product = productsById.get(detailButton.dataset.detail);
      if (product) onShowDetail(product, detailButton);
    }
    if (backButton) {
      const product = productsById.get(backButton.dataset.cardBack);
      const image = backImage(product);
      if (image) onOpenImage(image, backButton, { compact: true });
    }
  });
  window.addEventListener("resize", updateRails, { passive: true });
  mobileYuyosQuery.addEventListener("change", () => {
    if (activeView !== "hierbas") return;
    visibleMobileYuyos = MOBILE_YUYOS_PAGE_SIZE;
    render();
  });
  setView("all");
  return {
    get activeView() { return activeView; },
    setView
  };
}
