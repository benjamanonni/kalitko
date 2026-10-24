import { WHOLESALE_MIN_GRAMS } from "./config.js";
import { createCart } from "./commerce/cart.js";
import { setupCartDrawer } from "./ui/cart-drawer.js";
import { setupCatalogue } from "./ui/catalogue.js";
import { setupImageLightbox } from "./ui/image-lightbox.js";
import { setupNavigation } from "./ui/navigation.js";
import { setupProductDialog } from "./ui/product-dialog.js";
import { setupTimeline } from "./ui/timeline.js";

async function loadProducts() {
  const response = await fetch("data/products.json");
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
  return response.json();
}

async function start() {
  setupNavigation();
  setupTimeline();
  const products = await loadProducts();
  const list = document.querySelector("#product-list");
  const cart = createCart(products);
  const status = document.querySelector("#status");
  const addProduct = (id) => {
    if (cart.add(id) > 0) status.textContent = "Producto agregado a la bolsa.";
  };
  const lightbox = setupImageLightbox();
  const productDialog = setupProductDialog({
    onAdd: addProduct,
    onOpenImage: lightbox.open
  });

  setupCatalogue({
    container: list,
    products,
    onShowDetail: productDialog.open,
    onOpenImage: lightbox.open
  });
  setupCartDrawer({ cart, products, minimumGrams: WHOLESALE_MIN_GRAMS });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    addProduct(button.dataset.add);
  });
}

start().catch((error) => {
  console.error(error);
  document.querySelector("#product-list").innerHTML =
    '<p class="catalogue-error">No pudimos cargar el catálogo de muestra. Volvé a intentar en unos minutos.</p>';
});

