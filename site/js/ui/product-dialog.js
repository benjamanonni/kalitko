import { canAddToCart, hasValidPrice } from "../commerce/pricing.js";
import { escapeHtml, formatMoney } from "../utils/format.js";
import { measureText } from "../utils/product.js";

const technicalSections = [
  ["description", "Descripción"],
  ["details", "Información técnica"],
  ["usage", "Preparación y uso"],
  ["additionalInfo", "Información adicional"]
];

function validGallery(product) {
  const gallery = Array.isArray(product.gallery)
    ? product.gallery.filter((image) => image?.src && image?.alt)
    : [];
  if (gallery.length) return gallery;
  return [{
    src: product.image,
    alt: product.alt,
    type: "front",
    width: product.imageWidth,
    height: product.imageHeight
  }];
}

function renderTechnicalSections(product) {
  return technicalSections
    .filter(([field]) => typeof product[field] === "string" && product[field].trim())
    .map(([field, title]) => `<section class="detail-section">
      <h3>${title}</h3>
      <p>${escapeHtml(product[field])}</p>
    </section>`)
    .join("");
}

function renderProperties(container, product) {
  container.replaceChildren();
  const properties = Array.isArray(product.properties)
    ? product.properties.filter((property) => typeof property === "string" && property.trim())
    : [];
  container.hidden = properties.length === 0;
  if (!properties.length) return;

  const section = document.createElement("section");
  section.className = "detail-section detail-properties";
  const heading = document.createElement("h3");
  heading.textContent = "Propiedades";
  const list = document.createElement("ul");
  properties.forEach((property) => {
    const item = document.createElement("li");
    item.textContent = property;
    list.append(item);
  });
  section.append(heading, list);
  container.append(section);
}

function thumbnailLabel(image) {
  if (image.type === "back") return "Ver etiqueta trasera";
  if (image.type === "front") return "Ver imagen frontal";
  return "Ver imagen del producto";
}

export function setupProductDialog({ onAdd, onOpenImage }) {
  const dialog = document.querySelector("#product-dialog");
  const closeButton = dialog.querySelector("[data-close-product]");
  const title = dialog.querySelector("#product-dialog-title");
  const meta = dialog.querySelector("[data-detail-meta]");
  const price = dialog.querySelector("[data-detail-price]");
  const sections = dialog.querySelector("[data-detail-sections]");
  const properties = dialog.querySelector("[data-detail-properties]");
  const mainButton = dialog.querySelector("[data-detail-main-button]");
  const mainImage = dialog.querySelector("[data-detail-main-image]");
  const thumbnails = dialog.querySelector("[data-detail-thumbnails]");
  const addButton = dialog.querySelector("[data-detail-add]");
  let activeProduct = null;
  let activeGallery = [];
  let activeImage = null;
  let trigger = null;

  function selectImage(index) {
    const image = activeGallery[index];
    if (!image) return;
    activeImage = image;
    mainImage.src = image.src;
    mainImage.alt = image.alt;
    mainImage.width = image.width;
    mainImage.height = image.height;
    mainButton.setAttribute("aria-label", `Ampliar: ${image.alt}`);
    thumbnails.querySelectorAll("button").forEach((button, buttonIndex) => {
      button.setAttribute("aria-pressed", String(buttonIndex === index));
    });
  }

  function renderGallery() {
    thumbnails.innerHTML = activeGallery.length > 1
      ? activeGallery.map((image, index) => `<button type="button" data-gallery-index="${index}"
          aria-label="${escapeHtml(thumbnailLabel(image))}" aria-pressed="${index === 0}">
          <img src="${escapeHtml(image.src)}" width="${image.width}" height="${image.height}"
            loading="lazy" decoding="async" alt="">
        </button>`).join("")
      : "";
    thumbnails.hidden = activeGallery.length < 2;
    selectImage(0);
  }

  function close() {
    dialog.close();
  }

  function open(product, sourceButton) {
    activeProduct = product;
    activeGallery = validGallery(product);
    trigger = sourceButton || document.activeElement;
    title.textContent = product.name;
    meta.textContent = measureText(product);
    price.innerHTML = hasValidPrice(product)
      ? `${formatMoney(product.retailPrice)} <small>muestra</small>`
      : "Precio a confirmar";
    price.classList.toggle("product-price--pending", !hasValidPrice(product));
    sections.innerHTML = renderTechnicalSections(product);
    renderProperties(properties, product);
    addButton.hidden = !canAddToCart(product);
    renderGallery();
    dialog.showModal();
    closeButton.focus();
  }

  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  dialog.addEventListener("close", () => {
    if (trigger instanceof HTMLElement) trigger.focus();
  });
  thumbnails.addEventListener("click", (event) => {
    const button = event.target.closest("[data-gallery-index]");
    if (button) selectImage(Number(button.dataset.galleryIndex));
  });
  mainButton.addEventListener("click", () => {
    if (activeImage) onOpenImage(activeImage, mainButton);
  });
  addButton.addEventListener("click", () => {
    if (activeProduct && canAddToCart(activeProduct)) onAdd(activeProduct.id);
  });

  return { open };
}
