const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

const fixtureDirectory = path.join(__dirname, "fixtures", "packing-lists");
const source = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const expectedFiles = fs.readdirSync(fixtureDirectory)
  .filter(fileName => fileName.endsWith(".expected.json"))
  .sort();

function createContext() {
  const elements = new Map();
  const element = () => ({ value: "", innerHTML: "", textContent: "", disabled: false, checked: false, style: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {}, setAttribute() {}, focus() {}, scrollIntoView() {} });
  const context = {
    console: { log() {}, warn() {}, error() {}, group() {}, groupEnd() {}, table() {} },
    Math, Number, String, Object, Array, RegExp, Set, Map, Infinity, NaN, parseFloat, parseInt, isFinite: Number.isFinite,
    document: { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, querySelectorAll() { return []; }, addEventListener() {} },
    window: { scrollTo() {}, print() {} }, localStorage: { getItem() { return null; }, setItem() {} },
    alert() {}, confirm() { return true; }, setTimeout(callback) { callback(); }, clearTimeout() {}, pdfjsLib
  };
  vm.runInNewContext(`${source}\nthis.runImport = importarPDF; this.getTotals = () => totals(); this.getAnalysisTotals = () => analyzeSet().t; this.getRenderedTotals = () => ({ dashboard: { weight: document.getElementById("dashTon").textContent, volume: document.getElementById("dashM3").textContent, refs: document.getElementById("dashRefs").textContent }, summary: { weight: document.getElementById("totalTon").textContent, volume: document.getElementById("totalM3").textContent, area: document.getElementById("totalArea").textContent, refs: document.getElementById("totalRefs").textContent } });`, context);
  return context;
}

function isClose(actual, expected, tolerance) {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

function matchesDeclaredPrecision(actual, expected) {
  const decimals = String(expected).split(".")[1]?.length || 0;
  return Number.isFinite(actual) && Number(actual.toFixed(decimals)) === expected;
}

(async () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/legacy/build/pdf.worker.js");
  const results = [];

  for (const expectedFile of expectedFiles) {
    const expected = JSON.parse(fs.readFileSync(path.join(fixtureDirectory, expectedFile), "utf8"));
    const fixturePath = path.join(fixtureDirectory, expected.file);
    if (!fs.existsSync(fixturePath)) {
      results.push({ fixture: expected.file, status: "MISSING", expected: `${expected.peso_bruto_kg} kg | ${expected.volumen_m3} m³ | ${expected.area_m2} m² | ${expected.referencias} ref`, actual: "archivo no disponible" });
      continue;
    }

    try {
      const data = new Uint8Array(fs.readFileSync(fixturePath));
      const context = createContext();
      await context.runImport({ name: expected.file, arrayBuffer: async () => data.buffer });
      const totals = context.getTotals();
      const analysisTotals = context.getAnalysisTotals();
      const actual = { peso_bruto_kg: totals.weight * 1000, volumen_m3: totals.volume, area_m2: totals.area, referencias: totals.refs };
      const rendered = context.getRenderedTotals();
      const displayedTotalsConsistent = rendered.dashboard.weight === `${totals.weight.toFixed(5)} t`
        && rendered.dashboard.volume === `${totals.volume.toFixed(3)} m³`
        && rendered.dashboard.refs === totals.refs
        && rendered.summary.weight === `${totals.weight.toFixed(5)} t (${(totals.weight * 1000).toFixed(2)} kg)`
        && rendered.summary.volume === `${totals.volume.toFixed(3)} m³`
        && rendered.summary.area === `${totals.area.toFixed(3)} m²`
        && rendered.summary.refs === totals.refs;
      const quoteTotalsConsistent = analysisTotals.weight === totals.weight
        && analysisTotals.volume === totals.volume
        && analysisTotals.area === totals.area
        && analysisTotals.refs === totals.refs;
      const passed = isClose(actual.peso_bruto_kg, expected.peso_bruto_kg, 0.01)
        && matchesDeclaredPrecision(actual.volumen_m3, expected.volumen_m3)
        && matchesDeclaredPrecision(actual.area_m2, expected.area_m2)
        && actual.referencias === expected.referencias
        && displayedTotalsConsistent
        && quoteTotalsConsistent;
      results.push({ fixture: expected.file, status: passed ? "PASS" : "FAIL", expected: `${expected.peso_bruto_kg} kg | ${expected.volumen_m3} m³ | ${expected.area_m2} m² | ${expected.referencias} ref`, actual: `${actual.peso_bruto_kg.toFixed(3)} kg | ${actual.volumen_m3.toFixed(3)} m³ | ${actual.area_m2.toFixed(3)} m² | ${actual.referencias} ref` });
    } catch (error) {
      results.push({ fixture: expected.file, status: "ERROR", expected: "importación correcta", actual: error.message });
    }
  }

  console.table(results);
  const failures = results.filter(result => result.status !== "PASS");
  if (failures.length) {
    throw new Error(`Master regression bloqueada: ${failures.length}/${results.length} fixtures no pasaron.`);
  }
})().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});