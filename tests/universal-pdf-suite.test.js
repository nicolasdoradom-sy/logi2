const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

// Mock browser environment
const storage = new Map();
const elements = new Map();
function makeElement() {
  return {
    value: "",
    textContent: "",
    innerHTML: "",
    disabled: false,
    checked: false,
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    setAttribute() {},
    focus() {},
    scrollIntoView() {}
  };
}

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
  isFinite: Number.isFinite,
  parseFloat,
  parseInt,
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (k, v) => storage.set(k, v),
    removeItem: k => storage.delete(k)
  },
  document: {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement());
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    addEventListener() {}
  },
  window: { scrollTo() {}, print() {} },
  alert(msg) { console.log("[ALERT]", msg); },
  confirm: () => true,
  setTimeout: cb => cb(),
  clearTimeout() {}
};

const appSource = fs.readFileSync("js/app.js", "utf8");
vm.runInNewContext(appSource, context);

console.log("=== Running Universal PDF Suite against app.js ===");

// -------------------------------------------------------------
// TEST CASE 1: Original International Packing List (2 Pages, 60 Items)
// -------------------------------------------------------------
console.log("\n--- Test 1: Original International Packing List ---");
const cols1 = [
  ["CODIGO", 10], ["Ctn No", 50], ["REFERENCIA N°", 100], ["Description", 180], ["Qty (Pcs)", 340],
  ["Pcs/Ctn", 380], ["Ctns", 420], ["NW (Kgs)", 460], ["Total NW (Kgs)", 500],
  ["GW (Kgs)", 540], ["Total GW (Kgs)", 580], ["Size/CBM", 640]
];
const items1 = [];
cols1.forEach(([str, x]) => items1.push({ str, transform: [1, 0, 0, 1, x, 750] }));
for (let i = 0; i < 30; i++) {
  const y = 700 - i * 15;
  const vals = ["", `Ctn-${i+1}`, `REF-${i+1}`, `Part Item ${i+1}`, "100", "20", "5", "8.0", "40.0", "8.5", "42.5", "32x26x12 cm"];
  vals.forEach((str, idx) => items1.push({ str, transform: [1, 0, 0, 1, cols1[idx][1], y] }));
}
cols1.forEach(([str, x]) => items1.push({ str, transform: [1, 0, 0, 1, x, 750 - 2000] }));
for (let i = 30; i < 60; i++) {
  const y = 700 - (i - 30) * 15 - 2000;
  const vals = ["", `Ctn-${i+1}`, `REF-${i+1}`, `Part Item ${i+1}`, "100", "20", "5", "8.0", "40.0", "8.5", "42.5", "32x26x12 cm"];
  vals.forEach((str, idx) => items1.push({ str, transform: [1, 0, 0, 1, cols1[idx][1], y] }));
}
const res1 = context.pdfTableRecords(items1);
assert.equal(res1.records.length, 60);
console.log("✅ Test 1 Passed: 60 records extracted successfully!");

// -------------------------------------------------------------
// TEST CASE 2: Spanish Domestic Transport Remisión (Separate L, W, H Columns)
// -------------------------------------------------------------
console.log("\n--- Test 2: Spanish Domestic Remisión (Separate L, W, H Columns) ---");
const cols2 = [
  ["Ítem", 10], ["Descripción de la Mercancía", 60], ["Bultos", 220], ["Unidades", 280],
  ["Largo (cm)", 340], ["Ancho (cm)", 400], ["Alto (cm)", 460], ["Peso Total (kg)", 530]
];
const items2 = [];
cols2.forEach(([str, x]) => items2.push({ str, transform: [1, 0, 0, 1, x, 750] }));
const rows2Data = [
  ["1", "Cajas de Alimentos No Perecederos", "12", "120", "50", "40", "30", "240"],
  ["2", "Envases Plásticos Industriales", "8", "80", "60", "40", "40", "160"],
  ["3", "Bobinas de Papel Kraft", "4", "4", "100", "80", "80", "600"],
  ["4", "Cajas de Repuestos Automotrices", "15", "150", "40", "30", "25", "300"]
];
rows2Data.forEach((row, rIdx) => {
  const y = 700 - rIdx * 25;
  row.forEach((str, cIdx) => items2.push({ str, transform: [1, 0, 0, 1, cols2[cIdx][1], y] }));
});
const res2 = context.pdfTableRecords(items2);
assert.equal(res2.records.length, 4);
assert.equal(res2.records[0].L, 0.50);
assert.equal(res2.records[0].W, 0.40);
assert.equal(res2.records[0].H, 0.30);
assert.equal(res2.records[0].wt * res2.records[0].q * 1000, 240);
console.log("✅ Test 2 Passed: Domestic remisión with separate L, W, H extracted perfectly!");

// -------------------------------------------------------------
// TEST CASE 3: Heavy Machinery Dispatch (Dimensions in Meters and Weight in Tons)
// -------------------------------------------------------------
console.log("\n--- Test 3: Heavy Machinery Dispatch (Meters & Tonnes) ---");
const cols3 = [
  ["Pos", 10], ["Equipo / Carga", 60], ["Cant", 220],
  ["Largo (m)", 280], ["Ancho (m)", 340], ["Alto (m)", 400], ["Peso (t)", 470]
];
const items3 = [];
cols3.forEach(([str, x]) => items3.push({ str, transform: [1, 0, 0, 1, x, 750] }));
const rows3Data = [
  ["1", "Generador Diésel Trifásico", "1", "3.20", "1.50", "1.80", "4.50"],
  ["2", "Compresor de Aire Industrial", "2", "2.10", "1.20", "1.40", "2.80"]
];
rows3Data.forEach((row, rIdx) => {
  const y = 700 - rIdx * 25;
  row.forEach((str, cIdx) => items3.push({ str, transform: [1, 0, 0, 1, cols3[cIdx][1], y] }));
});
const res3 = context.pdfTableRecords(items3);
assert.equal(res3.records.length, 2);
assert.equal(res3.records[0].L, 3.20);
assert.equal(res3.records[0].wt, 4.50);
console.log("✅ Test 3 Passed: Machinery in meters and tonnes extracted perfectly!");

// -------------------------------------------------------------
// TEST CASE 4: Air Freight Manifest (AWB Item, Dimensions LxWxH cm, Volume m3)
// -------------------------------------------------------------
console.log("\n--- Test 4: Air Freight Manifest (AWB) ---");
const cols4 = [
  ["AWB Item", 10], ["Commodity Description", 80], ["Pieces", 240],
  ["Dimensions (LxWxH cm)", 300], ["Weight (kg)", 450], ["Volume (m3)", 530]
];
const items4 = [];
cols4.forEach(([str, x]) => items4.push({ str, transform: [1, 0, 0, 1, x, 750] }));
const rows4Data = [
  ["01", "Electronic Components", "10", "45x35x25", "125.5", "0.39"],
  ["02", "Medical Equipment Parts", "5", "60x40x30", "80.0", "0.36"]
];
rows4Data.forEach((row, rIdx) => {
  const y = 700 - rIdx * 25;
  row.forEach((str, cIdx) => items4.push({ str, transform: [1, 0, 0, 1, cols4[cIdx][1], y] }));
});
const res4 = context.pdfTableRecords(items4);
assert.equal(res4.records.length, 2);
assert.equal(res4.records[0].q, 10);
assert.equal(res4.records[0].L, 0.45);
assert.equal(res4.records[0].volume, 0.39);
console.log("✅ Test 4 Passed: Air freight manifest extracted perfectly!");

// -------------------------------------------------------------
// TEST CASE 5: Pattern-based unstructured line parsing
// -------------------------------------------------------------
console.log("\n--- Test 5: Pattern-based unstructured line parsing ---");
const unstructLines = [
  "Item 1 - Pallet Quimicos 10 cajas 120x100x150 cm Peso: 2500 kg",
  "Item 2 - Maquinaria Textil 2 und 200x150x180 cm Peso: 1800 kg",
  "Item 3 - Cajas Repuestos 50 und 40x30x25 cm Peso: 400 kg"
];
const res5 = context.pdfPatternRecords(unstructLines);
assert.equal(res5.length, 3);
assert.equal(res5[0].q, 10);
assert.equal(res5[0].L, 1.20);
assert.equal(res5[0].wt * res5[0].q * 1000, 2500);
console.log("✅ Test 5 Passed: Unstructured lines parsed successfully!");

// -------------------------------------------------------------
// TEST CASE 6: Key-Value Document Slip Parsing
// -------------------------------------------------------------
console.log("\n--- Test 6: Key-Value Document Slip Parsing ---");
const docText = "ORDEN DE CARGUE Y TRANSPORTE\nCliente: Industrias Quimicas del Norte\nDescripcion de la carga: Tanque Reactor de Acero Inoxidable\nCantidad: 1 Equipo\nLargo: 4.50 m\nAncho: 2.30 m\nAlto: 2.60 m\nPeso Bruto: 6.80 Toneladas";
const res6 = context.pdfKeyValueRecord(docText);
assert.ok(res6);
assert.equal(res6.L, 4.50);
assert.equal(res6.W, 2.30);
assert.equal(res6.H, 2.60);
assert.equal(res6.wt, 6.80);
console.log("✅ Test 6 Passed: Key-Value document slip parsed successfully!");

console.log("\n🎉 ALL 6 UNIVERSAL PDF ENGINE TESTS PASSED 100%!");
