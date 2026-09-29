import { WHOLESALE_MIN_GRAMS } from "./config.js";
import { createCart } from "./commerce/cart.js";
import { setupCartDrawer } from "./ui/cart-drawer.js";
import { renderCatalogue, setupFilters } from "./ui/catalogue.js";
import { setupNavigation } from "./ui/navigation.js";
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
  renderCatalogue(list, products);
  setupFilters(list);
  const cart = createCart(products);
  setupCartDrawer({ cart, products, minimumGrams: WHOLESALE_MIN_GRAMS });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add]");
    if (!button) return;
    cart.add(button.dataset.add);
    document.querySelector("#status").textContent = "Producto agregado a la bolsa.";
  });
}

start().catch((error) => {
  console.error(error);
  document.querySelector("#product-list").innerHTML =
    '<p class="catalogue-error">No pudimos cargar el catálogo de muestra. Volvé a intentar en unos minutos.</p>';
});

