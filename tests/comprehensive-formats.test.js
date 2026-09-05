const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

// Load app.js parser functions in isolated context with browser mocks
const source = fs.readFileSync("js/app.js", "utf8");
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

const storage = new Map();
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
  alert() {},
  confirm: () => true,
  setTimeout: cb => cb(),
  clearTimeout() {}
};

vm.runInNewContext(source, context);

// Test 1: Combined dimensions parsing
console.log("--- Test 1: findPdfDimensions variations ---");
const dimsCases = [
  { input: "40x30x20", expected: { L: 0.40, W: 0.30, H: 0.20 } },
  { input: "40*30*20 cm", expected: { L: 0.40, W: 0.30, H: 0.20 } },
  { input: "0.40 x 0.30 x 0.20 m", expected: { L: 0.40, W: 0.30, H: 0.20 } },
  { input: "400 x 300 x 200 mm", expected: { L: 0.40, W: 0.30, H: 0.20 } },
  { input: "38*28*19cm/外箱", expected: { L: 0.38, W: 0.28, H: 0.19 } },
  { input: "00042x17x17", expected: { L: 0.42, W: 0.17, H: 0.17 } },
  { input: "27X27X22", expected: { L: 0.27, W: 0.27, H: 0.22 } }
];

dimsCases.forEach(({ input, expected }) => {
  const d = context.findPdfDimensions(input);
  assert.ok(d, `Debe parsear dimensiones para: ${input}`);
  const unit = d.unit || (input.includes("m") && !input.includes("cm") && !input.includes("mm") ? "m" : "cm");
  const L = context.convertPdfMeasurement({ value: d.L, unit }, "cm");
  const W = context.convertPdfMeasurement({ value: d.W, unit }, "cm");
  const H = context.convertPdfMeasurement({ value: d.H, unit }, "cm");
  assert.ok(Math.abs(L - expected.L) < 0.001, `L mismatch en ${input}: ${L} vs ${expected.L}`);
  assert.ok(Math.abs(W - expected.W) < 0.001, `W mismatch en ${input}: ${W} vs ${expected.W}`);
  assert.ok(Math.abs(H - expected.H) < 0.001, `H mismatch en ${input}: ${H} vs ${expected.H}`);
});
console.log("✅ findPdfDimensions pasó todas las pruebas!");

console.log("--- Test 2: Multi-page Table Extraction ---");
// Simulate multi-page items
const columns = [
  ["CODIGO", 10], ["Ctn No", 50], ["REFERENCIA N°", 100], ["Description", 180], ["Qty (Pcs)", 340],
  ["Pcs/Ctn", 380], ["Ctns", 420], ["NW (Kgs)", 460], ["Total NW (Kgs)", 500],
  ["GW (Kgs)", 540], ["Total GW (Kgs)", 580], ["Size/CBM", 640]
];

const items = [];
columns.forEach(([str, x]) => items.push({ str, transform: [1, 0, 0, 1, x, 750] }));

// Page 1: 10 items
for (let i = 0; i < 10; i++) {
  const y = 700 - i * 20;
  const values = ["", `Ctn-${i+1}`, `REF-00${i+1}`, `Repuesto ${i+1}`, "100", "10", "10", "5,0", "50,0", "5,5", "55,0", "30x20x10 cm"];
  values.forEach((str, idx) => items.push({ str, transform: [1, 0, 0, 1, columns[idx][1], y] }));
}

// Page 2: 10 items with -2000 offset
for (let i = 10; i < 20; i++) {
  const y = 700 - (i - 10) * 20 - 2000;
  const values = ["", `Ctn-${i+1}`, `REF-00${i+1}`, `Repuesto ${i+1}`, "100", "10", "10", "5,0", "50,0", "5,5", "55,0", "30x20x10 cm"];
  values.forEach((str, idx) => items.push({ str, transform: [1, 0, 0, 1, columns[idx][1], y] }));
}

// Total line on page 2
[["TOTAL", 100], ["2000", 340], ["200", 420], ["1000,0", 500], ["1100,0", 580], ["1,20", 640]].forEach(([str, x]) => {
  items.push({ str, transform: [1, 0, 0, 1, x, 100 - 2000] });
});

const res = context.pdfTableRecords(items);
assert.equal(res.records.length, 20, "Debe extraer exactamente 20 referencias");

const totalCalc = res.records.reduce((acc, r) => {
  acc.q += r.q;
  acc.boxes += r.boxes;
  acc.gwTotalKg += r.gw * r.q * 1000;
  acc.volM3 += r.volume;
  return acc;
}, { q: 0, boxes: 0, gwTotalKg: 0, volM3: 0 });

assert.equal(totalCalc.q, 2000);
assert.equal(totalCalc.boxes, 200);
assert.equal(totalCalc.gwTotalKg, 1100);
assert.equal(totalCalc.volM3.toFixed(2), "1.20");

console.log("✅ Multi-page Table Extraction pasó todas las pruebas!");

console.log("--- Test 3: Prioridad de Total GW sobre GW unitario ---");
assert.equal(context.findBestHeaderValue({"GW (Kgs)": 5.5, "Total GW (Kgs)": 55, "Ctns": 10}, ["total gw", "gross weight", "gw", "peso bruto total", "peso bruto"], { preferTotal: true }), 55);
assert.equal(context.findBestHeaderValue({"1/2": "", "GW (Kgs)": 5.5, "Total GW (Kgs)": 55, "Ctns": 10}, ["total gw", "gross weight", "gw", "peso bruto total", "peso bruto"], { preferTotal: true }), 55);
console.log("✅ Prioridad de Total GW sobre GW unitario pasó!");

console.log("--- Test 3b: Desambiguación robusta de encabezados GW vs Total GW ---");
const ambiguousHeaderRow = {
  items: [
    { text: "GW", x: 130, width: 48 },
    { text: "Total GW", x: 310, width: 92 },
    { text: "(Kgs)", x: 130, width: 48 },
    { text: "(Kgs)", x: 310, width: 92 }
  ]
};
const ambiguousCols = context.detectPdfTableColumns([ambiguousHeaderRow]);
assert.ok(ambiguousCols, "Debe detectar ambas columnas del encabezado ambiguo");
const keys = ambiguousCols.map(col => col.key);
assert.ok(keys.includes("gwUnit"), "Debe reconocer la columna GW unitario como gwUnit");
assert.ok(keys.includes("totalGw"), "Debe reconocer la columna Total GW como totalGw");
assert.equal(keys.filter(key => key === "totalGw").length, 1, "No debe colapsar ambas columnas en totalGw");
console.log("✅ Desambiguación robusta de GW vs Total GW pasó!");

console.log("--- Test 4: Fixture 82 renglones - Total GW real 3299.8 kg ---");
const q3Rows = 41;
const q4Rows = 82 - q3Rows;
const unit3 = 296.36 / q3Rows;
const unit4 = 602.68 / q4Rows;
const fixtureRows = Array.from({ length: 82 }, (_, index) => {
  const ctns = index < q3Rows ? 3 : 4;
  const gwUnit = index < q3Rows ? unit3 : unit4;
  const totalGw = Number((gwUnit * ctns).toFixed(4));
  return { gwUnit, totalGw, ctns };
});
const unitWeightSum = fixtureRows.reduce((sum, row) => sum + row.gwUnit, 0);
const totalWeightSum = fixtureRows.reduce((sum, row) => sum + row.totalGw, 0);
const selectedTotal = fixtureRows.reduce((sum, row) => sum + context.findBestHeaderValue({
  "GW (Kgs)": row.gwUnit,
  "Total GW (Kgs)": row.totalGw,
  "Ctns": row.ctns
}, ["total gw", "gross weight", "gw", "peso bruto total", "peso bruto"], { preferTotal: true }), 0);
assert.equal(fixtureRows.length, 82, "Debe haber exactamente 82 renglones");
assert.ok(Math.abs(unitWeightSum - 899.04) < 0.01, `La suma unitario debe ser 899.04 kg: ${unitWeightSum}`);
assert.ok(Math.abs(totalWeightSum - 3299.8) < 0.01, `La suma total debe ser 3299.8 kg: ${totalWeightSum}`);
assert.ok(Math.abs(selectedTotal - 3299.8) < 0.01, `El parser debe seleccionar el Total GW del renglón y no el peso unitario: ${selectedTotal}`);
console.log(`✅ Fixture 82 renglones: suma unitaria ${unitWeightSum.toFixed(2)} kg; suma total ${totalWeightSum.toFixed(2)} kg; parser ${selectedTotal.toFixed(2)} kg`);

console.log("--- Test 5: Fixture PDF realista con columnas del PDF y marcador 1/2 ---");
const pageMarker = "1/2";
const pdfLikeColumns = [
  ["REF", 10], ["Qty (Pcs)", 140], ["Pcs/Ctns", 220], ["Ctns", 300], ["NW (Kgs)", 420], ["Total NW (Kgs)", 500],
  ["GW (Kgs)", 580], ["Total GW (Kgs)", 660], ["Size/CBM", 760]
];
const pdfLikeItems = [];
pdfLikeColumns.forEach(([str, x]) => pdfLikeItems.push({ str, transform: [1, 0, 0, 1, x, 760] }));

for (let index = 0; index < 82; index++) {
  const y = 720 - (index % 41) * 14;
  const pageOffset = index >= 41 ? 2000 : 0;
  const isSecondGroup = index >= 41;
  const ctns = isSecondGroup ? 4 : 3;
  const gwUnit = isSecondGroup ? (index === 81 ? 12.65 : 12.62) : 10;
  const totalGw = isSecondGroup ? (index === 81 ? 50.60 : 50.48) : 30;
  const values = [
    `REF-${String(index + 1).padStart(3, "0")}`,
    "1",
    "1",
    String(ctns),
    `${gwUnit.toFixed(2).replace(".", ",")}`,
    `${totalGw.toFixed(2).replace(".", ",")}`,
    `${gwUnit.toFixed(2).replace(".", ",")}`,
    `${totalGw.toFixed(2).replace(".", ",")}`,
    "30x20x10 cm"
  ];

  if (index === 41) {
    pdfLikeItems.push({ str: pageMarker, transform: [1, 0, 0, 1, 10, 700 - pageOffset] });
  }

  values.forEach((str, idx) => {
    pdfLikeItems.push({ str, transform: [1, 0, 0, 1, pdfLikeColumns[idx][1], y - pageOffset] });
  });
}

const pdfLikeResult = context.pdfTableRecords(pdfLikeItems);
assert.equal(pdfLikeResult.records.length, 82, "Debe extraer 82 renglones del PDF realista");
const pdfLikeWeightKg = pdfLikeResult.records.reduce((sum, row) => sum + ((Number(row.gw) || 0) * (Number(row.q) || 1) * 1000), 0);
assert.ok(Math.abs(pdfLikeWeightKg - 3299.8) < 0.1, `El peso bruto calculado desde el PDF realista debe ser 3299.8 kg, pero fue ${pdfLikeWeightKg} kg`);
assert.ok(Math.abs(pdfLikeResult.records.reduce((sum, row) => sum + Number(row.q || 0), 0) - 82) < 1e-9, "La cantidad total debe coincidir con 82 referencias");
console.log(`✅ PDF realista validado: ${pdfLikeResult.records.length} renglones, peso bruto ${pdfLikeWeightKg.toFixed(2)} kg`);
