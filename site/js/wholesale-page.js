import { setupNavigation } from "./ui/navigation.js";
import { setupWholesalePage } from "./ui/wholesale-page.js";

async function loadProducts() {
  const response = await fetch("data/products.json");
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
  return response.json();
}

async function start() {
  setupNavigation();
  setupWholesalePage({ products: await loadProducts() });
}

start().catch((error) => {
  console.error(error);
  const list = document.querySelector("#wholesale-page-list");
  if (list) list.innerHTML = '<p class="wholesale-load-error">No pudimos cargar el listado. Volvé a intentar en unos minutos.</p>';
});
