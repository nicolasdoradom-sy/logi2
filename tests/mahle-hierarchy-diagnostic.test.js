const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const elements = new Map();
const element = () => ({ value: "", innerHTML: "", textContent: "", disabled: false, checked: false, style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, setAttribute() {}, focus() {}, scrollIntoView() {} });
const context = {
  console, Math, Number, String, Object, Array, RegExp, Set, Map, Infinity, NaN, parseFloat, parseInt, isFinite: Number.isFinite,
  document: { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, querySelectorAll() { return []; }, addEventListener() {} },
  window: { scrollTo() {}, print() {} }, localStorage: { getItem() { return null; }, setItem() {} }, alert() {}, confirm() { return true; }, setTimeout(callback) { callback(); }, clearTimeout() {}, pdfjsLib
};

pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.js");
vm.runInNewContext(`${source}\nthis.runImport = importarPDF;`, context);

(async () => {
  const fileName = "LIM0609E26_-_PL.PDF";
  const data = new Uint8Array(fs.readFileSync(path.join(__dirname, "fixtures", "packing-lists", fileName)));
  await context.runImport({ name: fileName, arrayBuffer: async () => data.buffer });
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});