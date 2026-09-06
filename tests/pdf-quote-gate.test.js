const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/app.js", "utf8");
const elements = new Map();
const element = () => ({ value: "", textContent: "", innerHTML: "", disabled: false, style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, setAttribute() {}, focus() {}, scrollIntoView() {} });
const context = {
  console: { log() {}, warn() {}, error() {} }, Math, Number, String, Object, Array, RegExp, Set, Map, Infinity, NaN, parseFloat, parseInt, isFinite: Number.isFinite,
  document: { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, querySelectorAll() { return []; }, addEventListener() {} },
  window: { scrollTo() {}, print() {} }, localStorage: { getItem() { return null; }, setItem() {} }, alert() {}, confirm() { return true; }, setTimeout(callback) { callback(); }, clearTimeout() {}
};
vm.runInNewContext(`${source}\nthis.api={needsReview:pdfNeedsReview,setMeta(value){pdfImportMeta=value;},updateButton:updateQuoteButton};`, context);

context.api.setMeta({ validation: { status: "review", confirmed: false } });
assert.equal(context.api.needsReview(), true);
context.api.updateButton();
assert.equal(elements.get("quoteGenerateBtn").disabled, true);

context.api.setMeta({ validation: { status: "review", confirmed: true } });
assert.equal(context.api.needsReview(), false);
console.log("PDF quote gate tests passed");