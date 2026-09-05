const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/app.js", "utf8");
const parserSource = source.slice(source.indexOf("const PDF_HEADER_DEFINITIONS"), source.indexOf("function prepareIncompleteImport"));
const context = {};
vm.runInNewContext(`${parserSource}\nthis.api={parseNumber,pdfTableRecords};`, context);

const columns = [
  ["CODIGO", 10], ["REFERENCIA N°", 60], ["Description", 100], ["Qty (Pcs)", 200],
  ["Pcs/Ctn", 240], ["Ctns", 280], ["NW", 320], ["Total NW", 360],
  ["GW", 400], ["Total GW", 440], ["Size/CBM", 500]
];
const items = columns.map(([str, x]) => ({str, transform: [1, 0, 0, 1, x, 800]}));
for(let index = 0; index < 60; index++){
  const quantity = index === 59 ? 113 : 123;
  const cartons = index === 59 ? 44 : 5;
  const y = 780 - index * 10;
  const values = [
    `C${String(index + 1).padStart(3, "0")}`, `REF-${index + 1}`, `Producto ${index + 1}`,
    String(quantity), String(Math.round(quantity / cartons)), String(cartons),
    "53,8", "53,8", "54,996666", "54,996666", "40x30x16.519 cm"
  ];
  values.forEach((str, valueIndex) => items.push({str, transform: [1, 0, 0, 1, columns[valueIndex][1], y]}));
}
const totalY = 100;
[
  ["Cantidad total: 7370", 100], ["Total de cajas: 339", 260],
  ["Peso neto total: 3228,0 kg", 360], ["Peso bruto total: 3299,8 kg", 440],
  ["Volumen total: 6,72 CBM", 560]
].forEach(([str, x]) => items.push({str, transform: [1, 0, 0, 1, x, totalY]}));

const parsed = context.api.pdfTableRecords(items);
assert.equal(parsed.records.length, 60, "El parser debe agrupar 60 referencias");
const calculated = parsed.records.reduce((totals, record) => {
  totals.pieces += Number(record.q);
  totals.cartons += Number(record.boxes);
  totals.netWeightKg += Number(record.nw) * Number(record.q) * 1000;
  totals.grossWeightKg += Number(record.gw) * Number(record.q) * 1000;
  totals.volumeM3 += Number(record.volume);
  return totals;
}, {pieces: 0, cartons: 0, netWeightKg: 0, grossWeightKg: 0, volumeM3: 0});

assert.equal(calculated.pieces, 7370);
assert.equal(calculated.cartons, 339);
assert.ok(Math.abs(calculated.netWeightKg - 3228) < 0.01);
assert.ok(Math.abs(calculated.grossWeightKg - 3299.8) < 0.01);
assert.ok(Math.abs(calculated.volumeM3 - 6.72) < 0.01);
assert.equal(context.api.parseNumber("8,4"), 8.4);
assert.equal(context.api.parseNumber("8,6"), 8.6);
assert.equal(context.api.parseNumber("13,2"), 13.2);
assert.equal(context.api.parseNumber("13,3"), 13.3);
assert.equal(context.api.parseNumber("3299,8"), 3299.8);
assert.equal(context.api.parseNumber("3228,0"), 3228);
assert.equal(context.api.parseNumber("6,72"), 6.72);

console.log(JSON.stringify({
  references: parsed.records.length,
  pieces: calculated.pieces,
  cartons: calculated.cartons,
  netWeightKg: Number(calculated.netWeightKg.toFixed(2)),
  grossWeightKg: Number(calculated.grossWeightKg.toFixed(2)),
  volumeM3: Number(calculated.volumeM3.toFixed(2)),
  pdfTotals: parsed.totals
}, null, 2));

function element() {
  return {value: "", checked: false, innerHTML: "", textContent: "", disabled: false, style: {}, className: "",
    classList: {add() {}, remove() {}, toggle() {}}, addEventListener() {}, setAttribute() {}, focus() {},
    scrollIntoView() {}};
}
const elements = new Map();
const documentStub = {
  getElementById(id) { if(!elements.has(id))elements.set(id, element()); return elements.get(id); },
  querySelectorAll() { return []; },
  addEventListener() {}
};
const storage = new Map();
const appContext = {
  console,
  document: documentStub,
  window: {scrollTo() {}, print() {}},
  localStorage: {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key)},
  alert() {}, confirm: () => true, setTimeout: callback => callback(), clearTimeout() {}
};
vm.runInNewContext(`${source}\nthis.integration={setPieces(value){pieces=value;},getPieces(){return pieces;},continue:continuarServicio,analyze:analizar,getAnalysis(){return lastAnalysis;},totals};`, appContext);
["tipoCarga", "cerrado", "temp", "altoValor", "escolta", "satelital", "equipo", "muelle", "restricIngreso", "sobredim", "horario", "aduana", "peligrosa"].forEach(id => { documentStub.getElementById(id).value = id === "tipoCarga" ? "Carga suelta" : id === "muelle" ? "Sí" : "No"; });
appContext.integration.setPieces(parsed.records);
appContext.integration.continue();
assert.equal(appContext.integration.getPieces().length, 60, "continuarServicio no debe perder piezas");
assert.ok(Math.abs(appContext.integration.totals().weight - 3.2998) < 0.000001);
appContext.integration.analyze();
assert.equal(appContext.integration.getPieces().length, 60, "analizar no debe perder piezas");
assert.ok(appContext.integration.getAnalysis().best, "El Analizador debe encontrar una opción");
console.log(JSON.stringify({
  afterContinueReferences: appContext.integration.getPieces().length,
  afterAnalyzeReferences: appContext.integration.getPieces().length,
  analyzerHasBest: Boolean(appContext.integration.getAnalysis().best),
  analyzerWeightKg: Number((appContext.integration.totals().weight * 1000).toFixed(2)),
  analyzerVolumeM3: Number(appContext.integration.totals().volume.toFixed(2))
}, null, 2));
