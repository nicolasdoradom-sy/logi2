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
vm.runInNewContext(`${source}\nthis.api={parseNumber,pdfRows,pdfTableRecords,summarizePdfRecords,validatePdfTotals,pdfMismatchMessage,pdfLayoutMetrics};`, context);

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
assert.match(context.api.pdfMismatchMessage(mismatch), /Peso bruto calculado: 1000\.00 kg; el documento declara 900\.00 kg \(diferencia 11\.11%\)/);
assert.equal(context.api.pdfLayoutMetrics([{y:100},{y:88},{y:76},{y:0}]).rowGap, 12);
assert.equal(context.api.pdfRows([{str:"A",height:8,transform:[1,0,0,1,0,100]},{str:"B",height:8,transform:[1,0,0,1,10,96]},{str:"C",height:8,transform:[1,0,0,1,0,84]}]).length, 2);

// Split column headers plus pallet metadata on adjacent lines are parsed as one hierarchy.
const palletColumns = [["No.", 32], ["ITEM CODE", 125], ["N. Vol.", 560], ["G. Vol.", 596], ["N.W.", 643], ["G.W.", 683], ["QTY", 735]];
const palletItems = palletColumns.map(([str, x]) => ({ str, transform: [1, 0, 0, 1, x, 800] }));
[
  ["(m3)", 564, 794], ["(Kg)", 647, 794],
  ["1 Large: 120", 48, 760], ["Pallet Width: 100", 42, 748], ["CAJAS: 2 Height: 100", 24, 736],
  ["1", 94, 720], ["L-TEST-0001", 108, 720], ["0.5000", 565, 720], ["10", 652, 720], ["5", 744, 720],
  ["SubTotals:", 509, 700], ["0.5000", 565, 700], ["0.60", 611, 700], ["10", 647, 700], ["12", 703, 700], ["5", 744, 700],
  ["Totals:", 475, 680], ["0.5000", 565, 680], ["0.60", 601, 680], ["10", 649, 680], ["12", 694, 680], ["5", 740, 680]
].forEach(([str, x, y]) => palletItems.push({ str, transform: [1, 0, 0, 1, x, y] }));
const palletTable = context.api.pdfTableRecords(palletItems);
assert.equal(palletTable.hierarchical, true);
assert.equal(palletTable.records.length, 1);
assert.equal(palletTable.records[0].boxes, 2);
assert.equal(palletTable.records[0].volume, 0.5);
assert.equal(palletTable.totals.volume, 0.6);
assert.equal(palletTable.totals.gross, 12);

// Group-owned metrics: SKU detail rows are not shipping references.
const groupOwnedItems = [
  ["PKG-01 CAJA 270 KG 224 KG 1.272 M3", 700], ["120x100x106 cm", 688],
  ["BC0140272-40361020 2 JG", 670], ["COJINETE DE BANCADA", 658], ["____________________", 646],
  ["PKG-02 PALET 377 KG 331 KG 1.920 M3", 630], ["120x100x160 cm", 618],
  ["BC0140452-10361020 12 JG", 600], ["COJINETE DE BANCADA", 588], ["____________________", 576],
  ["647 KG 555 KG 3.192 M3", 560]
].map(([str, y]) => ({ str, transform: [1, 0, 0, 1, 10, y] }));
const groupOwnedTable = context.api.pdfTableRecords(groupOwnedItems);
assert.equal(groupOwnedTable.groupOwnedMetrics, true);
assert.equal(groupOwnedTable.records.length, 2);
assert.equal(groupOwnedTable.records[0].detailRows.length, 1);
assert.equal(context.api.summarizePdfRecords(groupOwnedTable.records).weight, 0.647);
assert.equal(groupOwnedTable.totals.boxes, 2);

console.log("PDF parser numeric context tests passed");
