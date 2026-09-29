import test from "node:test";
import assert from "node:assert/strict";
import { createCart } from "../site/js/commerce/cart.js";
import { summarizeCart } from "../site/js/commerce/pricing.js";

const minimum = 12_000;
const products = [
  { id: "yerba", name: "Yerba", weightGrams: 500, retailPrice: 8500, wholesalePrice: 6900, eligibleForWholesale: true },
  { id: "hierba", name: "Hierba", weightGrams: 20, retailPrice: 2500, wholesalePrice: 2000, eligibleForWholesale: false }
];

test("el carrito vacío y las cantidades inválidas permanecen en cero", () => {
  const cart = createCart(products);
  assert.deepEqual(cart.lines(), []);
  assert.equal(cart.set("yerba", -3), 0);
  assert.equal(cart.set("yerba", Number.NaN), 0);
  assert.equal(summarizeCart(cart.lines(), minimum).total, 0);
});

test("sumar, restar y quitar mantienen una sola cantidad válida", () => {
  const cart = createCart(products);
  cart.add("yerba");
  cart.add("yerba", 2);
  assert.equal(cart.quantity("yerba"), 3);
  cart.change("yerba", -1);
  assert.equal(cart.quantity("yerba"), 2);
  assert.equal(cart.remove("yerba"), true);
  assert.equal(cart.quantity("yerba"), 0);
});

test("23 paquetes son 11.500 g, 24 activan 12.000 g y volver a 23 desactiva", () => {
  const cart = createCart(products);
  cart.set("yerba", 23);
  let summary = summarizeCart(cart.lines(), minimum);
  assert.equal(summary.weightGrams, 11_500);
  assert.equal(summary.wholesaleActive, false);
  assert.equal(summary.total, 23 * 8500);
  cart.add("yerba");
  summary = summarizeCart(cart.lines(), minimum);
  assert.equal(summary.weightGrams, 12_000);
  assert.equal(summary.wholesaleActive, true);
  assert.equal(summary.total, 24 * 6900);
  cart.change("yerba", -1);
  assert.equal(summarizeCart(cart.lines(), minimum).wholesaleActive, false);
});

test("un producto no elegible no suma al mínimo ni cambia de precio", () => {
  const summary = summarizeCart([
    { product: products[0], quantity: 24 },
    { product: products[1], quantity: 100 }
  ], minimum);
  assert.equal(summary.weightGrams, 12_000);
  assert.equal(summary.wholesaleActive, true);
  assert.equal(summary.total, 24 * 6900 + 100 * 2500);
});

test("subtotales, ahorro y total son correctos al cruzar el umbral", () => {
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

