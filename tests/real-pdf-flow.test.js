const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const cases = [
  { fixture: "texto-corrido-ingles.pdf", references: 5, complete: 4, incomplete: 1 },
  { fixture: "tabla-bordes-unidades-mixtas.pdf", references: 10, complete: 9, incomplete: 1 },
  { fixture: "tabla-bordes-peso-kg.pdf", references: 10, complete: 9, incomplete: 1 },
  { fixture: "tabla-columnas-orden-distinto.pdf", references: 5, complete: 4, incomplete: 1 }
];

function createContext(verbose = false) {
  const elements = new Map();
  const element = () => ({
    value: "",
    innerHTML: "",
    textContent: "",
    disabled: false,
    checked: false,
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    setAttribute() {},
    focus() {},
    scrollIntoView() {}
  });
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    addEventListener() {}
  };
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.js");
  const context = {
    console: verbose ? console : { log() {}, warn() {}, error() {}, group() {}, groupEnd() {}, table() {} },
    Math, Number, String, Object, Array, RegExp, Set, Map, Infinity, NaN,
    parseFloat, parseInt, isFinite: Number.isFinite,
    document,
    window: { scrollTo() {}, print() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    alert() {},
    confirm() { return true; },
    setTimeout(callback) { callback(); },
    clearTimeout() {},
    pdfjsLib
  };
  vm.runInNewContext(`${source}\nthis.runImport = importarPDF; this.getPieces = () => pieces; this.getTotals = () => totals(); this.getPdfTableRecords = pdfTableRecords;`, context);
  return context;
}

async function runFixture(fixture) {
  const filePath = path.join(__dirname, "fixtures", fixture);
  const data = new Uint8Array(fs.readFileSync(filePath));
  const context = createContext();
  await context.runImport({
    name: fixture,
    arrayBuffer: async () => data.buffer
  });
  return context.getPieces();
}

async function runTableWithFooter(fixture) {
  const filePath = path.join(__dirname, "fixtures", fixture);
  const data = new Uint8Array(fs.readFileSync(filePath));
  const documentPdf = await pdfjsLib.getDocument({ data }).promise;
  const items = [];
  for (let pageNumber = 1; pageNumber <= documentPdf.numPages; pageNumber++) {
    const page = await documentPdf.getPage(pageNumber);
    const content = await page.getTextContent();
    items.push(...(content.items || []).map(item => ({
      str: String(item.str || ""),
      transform: item.transform
    })));
  }
  const footerY = 50;
  ["Peso total: 999 kg", "Volumen total: 999 m3", "Área de piso total: 999 m2", "Referencias: 999"].forEach((str, index) => {
    items.push({ str, transform: [1, 0, 0, 1, 20, footerY - index * 12] });
  });
  return createContext().getPdfTableRecords(items);
}

async function runPackingList8112162020() {
  const filePath = path.join(__dirname, "..", "PACKING LIST 8112162020.pdf");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const documentPdf = await pdfjsLib.getDocument({ data }).promise;
  const items = [];
  for (let pageNumber = 1; pageNumber <= documentPdf.numPages; pageNumber++) {
    const page = await documentPdf.getPage(pageNumber);
    const content = await page.getTextContent();
    items.push(...(content.items || []).map(item => ({
      str: String(item.str || ""),
      transform: item.transform,
      width: item.width
    })));
  }
  const context = createContext(true);
  await context.runImport({
    name: "PACKING LIST 8112162020.pdf",
    arrayBuffer: async () => data.buffer
  });
  return { table: context.getPdfTableRecords(items), totals: context.getTotals() };
}

(async () => {
  for (const testCase of cases) {
    const pieces = await runFixture(testCase.fixture);
    const incomplete = pieces.filter(piece => piece.incomplete).length;
    assert.equal(pieces.length, testCase.references, `${testCase.fixture}: referencias`);
    assert.equal(incomplete, testCase.incomplete, `${testCase.fixture}: incompletas`);
    assert.equal(pieces.length - incomplete, testCase.complete, `${testCase.fixture}: completas`);
  }
  const footerResult = await runTableWithFooter("tabla-bordes-peso-kg.pdf");
  assert.equal(footerResult.records.length, 10, "El footer no debe convertirse en referencias");
  assert.equal(footerResult.records.some(record => /^(?:peso total|volumen total|area de piso total|referencias)\b/i.test(record.desc)), false, "El footer no debe aparecer como descripción");
  const packingList = await runPackingList8112162020();
  assert.equal(packingList.table.records.length, 1, "PACKING LIST 8112162020: referencias");
  const [packingRecord] = packingList.table.records;
  assert.equal(packingRecord.q, 100, "CUBAGEM no debe ocupar la cantidad");
  assert.equal(packingRecord.boxes, 1, "El embalaje declarado debe ser una caja");
  assert.equal(packingRecord.volume, 0.0346, "CUBAGEM debe mapearse a volumen");
  assert.equal(packingList.table.totals.net, 2.1, "El peso neto declarado debe ser 2.100 kg");
  assert.equal(packingList.table.totals.gross, 3.75, "El peso bruto declarado debe ser 3.750 kg");
  assert.equal(packingList.table.totals.volume, 0.035, "El Cubaje declarado debe ser 0.035 m³");
  assert.equal(Number((packingRecord.gw * packingRecord.q * 1000).toFixed(2)), 3.75, "El peso bruto debe conservar 3.750 kg");
  assert.equal(Number((packingRecord.L * packingRecord.W * packingRecord.boxes).toFixed(3)), 0.128, "El área debe usar una caja");
  assert.equal(packingList.totals.refs, 1, "La web debe mostrar una referencia");
  assert.equal(Number(packingList.totals.weight.toFixed(5)), 0.00375, "La web debe mostrar 0.00375 t");
  assert.equal(Number(packingList.totals.volume.toFixed(3)), 0.035, "La web debe mostrar 0.035 m³");
  assert.equal(Number(packingList.totals.area.toFixed(3)), 0.128, "La web debe mostrar 0.128 m²");
  console.log("✅ Caso real 8112162020 validado: CUBAGEM→volumen, QUANTITY→100 piezas, cajas 1, peso bruto 3.750 kg, volumen 0.03456 m³, área 0.128 m².");
  console.log(`✅ Flujo PDF end-to-end validado para ${cases.length} fixtures reales.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
