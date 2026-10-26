import { WHATSAPP_NUMBER, WHOLESALE_MIN_GRAMS } from "./config.js";
import { buildOrderMessage, buildWhatsAppUrl, normalizeOrderData } from "./commerce/order-message.js";
import { isPriceOnRequest, summarizeCart, unitPrice } from "./commerce/pricing.js";
import { CART_SESSION_KEY, restoreCartLines } from "./commerce/session-cart.js";
import { formatMoney } from "./utils/format.js";

const form = document.querySelector("#shipping-form");
const emptyState = document.querySelector("#checkout-empty");
const checkoutContent = document.querySelector("#checkout-content");
const formStatus = document.querySelector("#form-status");
const sendButton = document.querySelector("#send-whatsapp");
const whatsappNote = document.querySelector("#whatsapp-note");
let latestSummary = null;

function setConditionalFields(mode) {
  const home = mode === "home";
  const homeFields = document.querySelector("#home-fields");
  const branchFields = document.querySelector("#branch-fields");
  homeFields.hidden = !home;
  branchFields.hidden = home;

  homeFields.querySelectorAll("input, textarea").forEach((field) => {
    field.disabled = !home;
  });
  ["postalCode", "street", "streetNumber"].forEach((name) => {
    form.elements[name].required = home;
  });
  form.elements.branch.disabled = home;
  form.elements.branch.required = !home;
}

function fieldMessage(field) {
  if (field.validity.valueMissing) return "Este campo es obligatorio.";
  if (field.validity.typeMismatch && field.type === "email") return "Ingresá un email válido.";
  return "Revisá este dato.";
}

function clearFieldError(field) {
  field.removeAttribute("aria-invalid");
  const error = document.querySelector(`[data-error-for="${field.name}"]`);
  if (error) error.textContent = "";
}

function validateForm() {
  formStatus.textContent = "";
  const fields = [...form.elements].filter((field) =>
    field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
  );
  fields.forEach((field) => {
    if (field.type !== "radio" && !field.disabled) {
      field.value = field.value.trim().replace(/\s+/g, " ");
    }
    clearFieldError(field);
  });

  const invalidFields = fields.filter((field) => !field.disabled && !field.checkValidity());
  invalidFields.forEach((field) => {
    field.setAttribute("aria-invalid", "true");
    const error = document.querySelector(`[data-error-for="${field.name}"]`);
    if (error) error.textContent = fieldMessage(field);
  });
  if (!invalidFields.length) return true;

  formStatus.textContent = "Revisá los campos señalados antes de enviar el pedido.";
  invalidFields[0].focus();
  return false;
}

function formValues() {
  return normalizeOrderData(Object.fromEntries(new FormData(form)));
}

function renderSummary(summary) {
  const list = document.querySelector("#summary-items");
  list.replaceChildren(...summary.lines.map(({ product, quantity }) => {
    const item = document.createElement("li");
    item.className = "summary-item";
    const name = document.createElement("span");
    name.textContent = `${quantity} × ${product.name}`;
    const price = document.createElement("strong");
    price.textContent = isPriceOnRequest(product)
      ? "Precio a confirmar"
      : formatMoney(unitPrice(product, summary.wholesaleActive) * quantity);
    item.append(name, price);
    return item;
  }));

  const label = document.querySelector("#summary-total-label");
  const value = document.querySelector("#summary-total-value");
  const note = document.querySelector("#summary-pricing-note");
  if (!summary.hasQuotedProducts) {
    label.textContent = "Total";
    value.textContent = formatMoney(summary.total);
    note.textContent = "";
  } else if (summary.pricedItemCount > 0) {
    label.textContent = "Subtotal con precio";
    value.textContent = formatMoney(summary.total);
    note.textContent = "Algunos precios están pendientes de confirmación.";
  } else {
    label.textContent = "Importe";
    value.textContent = "Precio a confirmar";
    note.textContent = "Kalitko confirmará los precios junto con la disponibilidad y el envío.";
  }
}

async function start() {
  const response = await fetch("data/products.json");
  if (!response.ok) throw new Error(`No se pudo cargar el catálogo (${response.status}).`);
  const products = await response.json();
  const lines = restoreCartLines(sessionStorage.getItem(CART_SESSION_KEY), products);
  latestSummary = summarizeCart(lines, WHOLESALE_MIN_GRAMS);

  if (!latestSummary.itemCount) {
    emptyState.hidden = false;
    return;
  }

  checkoutContent.hidden = false;
  renderSummary(latestSummary);
  setConditionalFields(form.elements.deliveryMethod.value);

  const whatsappAvailable = Boolean(String(WHATSAPP_NUMBER).replace(/\D/g, ""));
  sendButton.disabled = !whatsappAvailable;
  whatsappNote.textContent = whatsappAvailable
    ? "Al continuar se abrirá WhatsApp con el pedido preparado. Revisalo antes de enviarlo."
    : "El envío por WhatsApp todavía no está disponible: falta configurar el número oficial de Kalitko.";
}

form.addEventListener("change", (event) => {
  if (event.target.name === "deliveryMethod") setConditionalFields(event.target.value);
});

form.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    clearFieldError(event.target);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!latestSummary || !validateForm()) return;
  const message = buildOrderMessage(latestSummary, formValues());
  const url = buildWhatsAppUrl(WHATSAPP_NUMBER, message);
  if (!url) {
    formStatus.textContent = "Falta configurar el número oficial de WhatsApp de Kalitko.";
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
});

start().catch((error) => {
  console.error(error);
  checkoutContent.hidden = true;
  emptyState.hidden = false;
  emptyState.querySelector("p").textContent = "No pudimos recuperar tu bolsa. Volvé al catálogo e intentá nuevamente.";
});
