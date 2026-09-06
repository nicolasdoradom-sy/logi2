const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/app.js", "utf8");
const element = () => ({ value: "", addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} }, style: {}, setAttribute() {}, focus() {}, scrollIntoView() {} });
const context = {
  console,
  Math,
  Number,
  String,
  Object,
  Array,
  RegExp,
  Set,
  Map,
  Infinity,
  NaN,
  parseFloat,
  parseInt,
  isFinite: Number.isFinite,
  document: { getElementById() { return element(); }, querySelectorAll() { return []; }, addEventListener() {} },
  window: {},
  localStorage: { getItem() { return null; }, setItem() {} }
};
vm.runInNewContext(`${source}\nthis.api={parseNumber,pdfTableRecords,summarizePdfRecords,validatePdfTotals};`, context);

assert.equal(context.api.parseNumber("1,260", { kind: "quantity" }), 1260);
assert.equal(context.api.parseNumber("1,85", { kind: "volume" }), 1.85);
assert.equal(context.api.parseNumber("1.4100", { kind: "weight" }), 1.41);
assert.equal(context.api.parseNumber("1.234,56", { kind: "weight" }), 1234.56);
assert.equal(context.api.parseNumber("1,234.56", { kind: "quantity" }), 1234.56);
assert.ok(Number.isNaN(context.api.parseNumber("not-a-number", { kind: "weight" })));

// Synthetic mixed separators: integer columns and decimal load columns coexist.
assert.equal(context.api.parseNumber("1,260", { kind: "quantity" }), 1260);
assert.equal(context.api.parseNumber("1,85", { kind: "volume" }), 1.85);

// A corrupt row remains visible as incomplete, but cannot poison aggregate totals.
const corruptRecords = [
  { q: 2, boxes: 2, gw: 0.5, nw: 0.4, volume: 1 },
  { q: NaN, boxes: 1, gw: NaN, nw: NaN, volume: NaN, incomplete: true }
];
const corruptTotals = context.api.summarizePdfRecords(corruptRecords);
assert.equal(corruptTotals.weight, 1);
assert.equal(corruptTotals.excludedRows, 1);

// Synthetic group -> products: shared dimensions remain on products while group gross is counted once.
const groupedRecords = [
  { desc: "Producto A", q: 4, boxes: 1, L: 1.2, W: 1, H: 1, gw: null, nw: null, volume: null, groupId: "pallet-1", groupGrossT: 0.75, groupNetT: 0.6, groupVolume: 1.2 },
  { desc: "Producto B", q: 6, boxes: 0, L: 1.2, W: 1, H: 1, gw: null, nw: null, volume: null, groupId: "pallet-1" }
];
const groupedTotals = context.api.summarizePdfRecords(groupedRecords);
assert.equal(groupedTotals.weight, 0.75);
assert.equal(groupedTotals.quantity, 10);
assert.equal(groupedTotals.volume, 1.2);

const hierarchyItems = [
  ["Pallet 1 750 KG 600 KG 1.20 CBM", 700],
  ["120x100x100 cm", 680],
  ["AB12 4 PCS Producto A", 660],
  ["CD34 6 PCS Producto B", 640],
  ["TOTAL 10 PCS 750 KG 1.20 CBM", 620]
].map(([str, y]) => ({ str, transform: [1, 0, 0, 1, 10, y] }));
const hierarchyTable = context.api.pdfTableRecords(hierarchyItems);
assert.equal(hierarchyTable.hierarchical, true);
assert.equal(hierarchyTable.records.length, 2);
assert.equal(context.api.summarizePdfRecords(hierarchyTable.records).weight, 0.75);

// Declared totals are checked, never silently substituted for the calculated values.
const totalTableColumns = [["Item", 10], ["Qty", 100], ["Total GW (kg)", 180], ["Volume (m3)", 280]];
const totalTableItems = totalTableColumns.map(([str, x]) => ({ str, transform: [1, 0, 0, 1, x, 800] }));
[["REF-A", "2", "1000", "1.00", 780], ["TOTAL", "2", "900", "1.00", 760]].forEach(([item, qty, gross, volume, y]) => {
  [[item, 10], [qty, 100], [gross, 180], [volume, 280]].forEach(([str, x]) => totalTableItems.push({ str, transform: [1, 0, 0, 1, x, y] }));
});
const mismatchTable = context.api.pdfTableRecords(totalTableItems);
assert.equal(mismatchTable.records.length, 1);
assert.equal(mismatchTable.totals.gross, 900);
const mismatch = context.api.validatePdfTotals(mismatchTable.totals, context.api.summarizePdfRecords(mismatchTable.records));
assert.equal(mismatch.find(check => check.name === "peso bruto").status, "review");

console.log("PDF parser numeric context tests passed");
