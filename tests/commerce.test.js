import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createCart } from "../site/js/commerce/cart.js";
import { summarizeCart } from "../site/js/commerce/pricing.js";
import { buildPreview } from "../site/js/commerce/preview.js";

const minimum = 12_000;
const products = [
  { id: "despalada", name: "Yerba Despalada", weightGrams: 500, retailPrice: 8500, wholesalePrice: 6900, eligibleForWholesale: true },
  { id: "barbacua", name: "Yerba Barbacua", weightGrams: 500, retailPrice: 9000, wholesalePrice: 7200, eligibleForWholesale: true },
  { id: "cedron", name: "Cedrón", weightGrams: 20, retailPrice: 2500, wholesalePrice: null, eligibleForWholesale: false }
];

test("el carrito vacío y las cantidades inválidas permanecen seguras", () => {
  const cart = createCart(products);
  assert.deepEqual(cart.lines(), []);
  assert.equal(cart.set("despalada", -3), 0);
  assert.equal(cart.set("despalada", Number.NaN), 0);
  assert.equal(cart.set("despalada", Number.POSITIVE_INFINITY), 0);
  assert.equal(cart.add("desconocido"), 0);
  assert.deepEqual(cart.lines(), []);
  assert.equal(summarizeCart(cart.lines(), minimum).total, 0);
});

test("sumar, restar, quitar y limpiar mantienen un estado válido", () => {
  const cart = createCart(products);
  cart.add("despalada");
  cart.add("despalada", 2);
  assert.equal(cart.quantity("despalada"), 3);
  assert.equal(cart.change("despalada", Number.NaN), 3);
  assert.equal(cart.change("despalada", Number.POSITIVE_INFINITY), 3);
  cart.change("despalada", -1);
  assert.equal(cart.quantity("despalada"), 2);
  assert.equal(cart.remove("despalada"), true);
  assert.equal(cart.remove("desconocido"), false);
  cart.add("barbacua", 4);
  cart.clear();
  assert.deepEqual(cart.lines(), []);
});

test("23 paquetes son 11.500 g, 24 activan 12.000 g y volver a 23 desactiva", () => {
  const cart = createCart(products);
  cart.set("despalada", 23);
  let summary = summarizeCart(cart.lines(), minimum);
  assert.equal(summary.weightGrams, 11_500);
  assert.equal(summary.wholesaleActive, false);
  assert.equal(summary.total, 23 * 8500);
  cart.add("despalada");
  summary = summarizeCart(cart.lines(), minimum);
  assert.equal(summary.weightGrams, 12_000);
  assert.equal(summary.wholesaleActive, true);
  assert.equal(summary.total, 24 * 6900);
  cart.change("despalada", -1);
  assert.equal(summarizeCart(cart.lines(), minimum).wholesaleActive, false);
});

test("dos variedades elegibles combinan peso y conservan precios mayoristas individuales", () => {
  // Hipótesis de la demo; la combinación todavía requiere confirmación comercial.
  const summary = summarizeCart([
    { product: products[0], quantity: 12 },
    { product: products[1], quantity: 12 }
  ], minimum);
  assert.equal(summary.weightGrams, 12_000);
  assert.equal(summary.wholesaleActive, true);
  assert.equal(summary.total, 12 * 6900 + 12 * 7200);
  assert.equal(summary.retailTotal, 12 * 8500 + 12 * 9000);
  assert.equal(summary.savings, 12 * (8500 - 6900) + 12 * (9000 - 7200));
});

test("el carrito mixto excluye hierbas del mínimo y mantiene su precio minorista", () => {
  // Hipótesis de la demo; hierbas y blends siguen pendientes de confirmación.
  const summary = summarizeCart([
    { product: products[0], quantity: 24 },
    { product: products[2], quantity: 100 }
  ], minimum);
  assert.equal(summary.weightGrams, 12_000);
  assert.equal(summary.wholesaleActive, true);
  assert.equal(summary.total, 24 * 6900 + 100 * 2500);
});

test("subtotales, ahorro y total son finitos y no negativos", () => {
  const below = summarizeCart([{ product: products[0], quantity: 23 }], minimum);
  const active = summarizeCart([{ product: products[0], quantity: 24 }], minimum);
  assert.equal(below.savings, 0);
  assert.equal(active.retailTotal, 24 * 8500);
  assert.equal(active.total, 24 * 6900);
  assert.equal(active.savings, 24 * (8500 - 6900));
  for (const value of Object.values(active).filter((item) => typeof item === "number")) {
    assert.equal(Number.isFinite(value), true);
    assert.equal(value >= 0, true);
  }
});

test("la vista previa describe el pedido sin habilitar un envío real", () => {
  const summary = summarizeCart([
    { product: products[0], quantity: 12 },
    { product: products[1], quantity: 12 },
    { product: products[2], quantity: 1 }
  ], minimum);
  const preview = buildPreview(summary);
  assert.match(preview, /^VISTA PREVIA — NO SE ENVÍA/);
  assert.match(preview, /Yerba Despalada \(500 g\): 12/);
  assert.match(preview, /Yerba Barbacua \(500 g\): 12/);
  assert.match(preview, /Cedrón \(20 g\): 1/);
  assert.match(preview, /Peso de yerba elegible: 12 kg \/ 12 kg/);
  assert.match(preview, /Ahorro ilustrativo por volumen/);
  assert.match(preview, /Total ilustrativo de productos/);
  assert.doesNotMatch(preview, /https?:\/\/|wa\.me|api\.whatsapp/i);
});

test("products.json mantiene identificadores, valores y rutas válidas", () => {
  const catalogueUrl = new URL("../site/data/products.json", import.meta.url);
  const catalogue = JSON.parse(readFileSync(catalogueUrl, "utf8"));
  const ids = new Set();

  assert.ok(catalogue.length > 0);
  for (const product of catalogue) {
    assert.equal(typeof product.id, "string");
    assert.ok(product.id.length > 0);
    assert.equal(ids.has(product.id), false, `ID duplicado: ${product.id}`);
    ids.add(product.id);
    assert.ok(Number.isFinite(product.weightGrams) && product.weightGrams > 0);
    assert.ok(Number.isFinite(product.retailPrice) && product.retailPrice >= 0);
    assert.ok(product.wholesalePrice === null || (Number.isFinite(product.wholesalePrice) && product.wholesalePrice >= 0));
    assert.equal(typeof product.image, "string");
    assert.equal(existsSync(new URL(`../site/${product.image}`, import.meta.url)), true, product.image);
  }
});
