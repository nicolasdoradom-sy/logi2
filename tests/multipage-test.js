const assert = require("node:assert/strict");

function normHeader(h){return String(h||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
function parseNumber(value){
 const raw=String(value??"").trim().replace(/\s/g,"");
 if(!raw)return NaN;
 const numeric=(raw.match(/[+-]?[0-9][0-9.,]*/) || [""])[0];
 if(!numeric)return NaN;
 const normalized=numeric.includes(",")&&numeric.includes(".")
  ? (numeric.lastIndexOf(",")>numeric.lastIndexOf(".")?numeric.replace(/\./g,"").replace(",","."):numeric.replace(/,/g,""))
  : numeric.replace(",",".");
 return Number(normalized);
}
function normalizePdfText(value){return String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}
function findPdfDimensions(text){
 const match=/([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*(mm|cm|m)?/i.exec(text);
 if(match)return {L:parseNumber(match[1]),W:parseNumber(match[2]),H:parseNumber(match[3]),unit:(match[4]||"").toLowerCase(),index:match.index,end:match.index+match[0].length};
 const labelled=/\b(?:largo|length|l)\s*:\s*([0-9][0-9.,]*)\s+(?:ancho|width|w|a)\s*:\s*([0-9][0-9.,]*)\s+(?:alto|height|h)\s*:\s*([0-9][0-9.,]*)\s*(mm|cm|m)?/i.exec(text);
 return labelled?{L:parseNumber(labelled[1]),W:parseNumber(labelled[2]),H:parseNumber(labelled[3]),unit:(labelled[4]||"").toLowerCase(),index:labelled.index,end:labelled.index+labelled[0].length}:null;
}
function convertPdfMeasurement(measurement,defaultUnit){
 if(!measurement||!Number.isFinite(measurement.value))return NaN;
 const unit=measurement.unit||defaultUnit;
 if(["mm"].includes(unit))return measurement.value/1000;
 if(["cm"].includes(unit))return measurement.value/100;
 if(["kg"].includes(unit))return measurement.value/1000;
 if(["lb","lbs"].includes(unit))return measurement.value*0.00045359237;
 return measurement.value;
}
function pdfRows(items){
 const groups=[];
 items.filter(item=>String(item.str||"").trim()).forEach(item=>{
  const x=Number(item.transform?.[4]||0), y=Number(item.transform?.[5]||0);
  const group=groups.find(candidate=>Math.abs(candidate.y-y)<3);
  if(group)group.items.push({text:String(item.str).trim(),x});else groups.push({y,items:[{text:String(item.str).trim(),x}]});
 });
 return groups.sort((a,b)=>b.y-a.y).map(group=>({y:group.y,items:group.items.sort((a,b)=>a.x-b.x),text:group.items.map(item=>item.text).join(" ").trim()})).filter(row=>row.text);
}
function pdfCell(row,columns,aliases){
 const column=columns.find(candidate=>aliases.some(alias=>candidate.name===normHeader(alias)))||columns.find(candidate=>aliases.some(alias=>candidate.name.includes(normHeader(alias))));
 if(!column)return "";
 return row.items.filter(item=>Math.abs(item.x-column.x)<column.width/2).map(item=>item.text).join(" ").trim();
}
function pdfTotals(text){
 const find=(aliases)=>{const match=new RegExp(`(?:${aliases.join("|")})\\s*[:=]?\\s*([0-9][0-9.,]*)\\s*(kg|cbm|m3|m³|pcs|piezas|cajas)?`,"i").exec(text);return match?parseNumber(match[1]):NaN};
 return {quantity:find(["cantidad total","total quantity","total pcs"]),boxes:find(["total de cajas","total cajas","total cartons","total ctns"]),net:find(["peso neto total","total nw"]),gross:find(["peso bruto total","total gw"]),volume:find(["volumen total","volume total","total cbm"])};
}

function pdfTableRecords(items){
  const rows = pdfRows(items);
  const headerIndex = rows.findIndex(row => 
    /codigo|referencia|description|descripcion/i.test(normHeader(row.text)) && 
    /(qty|quantity|pcs|ctns|cajas|nw|gw|peso|weight|size|cbm)/i.test(normHeader(row.text))
  );
  if(headerIndex < 0) return { records: [], totals: {} };
  
  const labels = [
    ["codigo", ["codigo", "code"]],
    ["ctnno", ["ctnno", "ctn"]],
    ["referencia", ["referencian", "referencia", "reference", "ref"]],
    ["description", ["description", "descripcion", "desc"]],
    ["qty", ["qtypcs", "quantitypcs", "cantidad", "qty", "pcs", "unidades"]],
    ["pcsctn", ["pcsctn", "pcsbox", "pcs/ctn", "pcs/box"]],
    ["ctns", ["ctns", "cartons", "cajas", "boxes", "bultos"]],
    ["totalnw", ["totalnw", "nettotal", "nwtotal", "pesonetototal"]],
    ["nw", ["nw", "netweight", "pesoneto"]],
    ["totalgw", ["totalgw", "grosstotal", "gwtotal", "pesobrutototal"]],
    ["gw", ["gw", "grossweight", "pesobruto"]],
    ["size", ["sizecbm", "size", "cbm", "dimension", "dimensiones", "medidas"]]
  ];
  
  const headerRow = rows[headerIndex];
  const columns = [];
  const claimedTokens = new Set();
  
  labels.forEach(([name, aliases]) => {
    const token = headerRow.items.find(item => 
      !claimedTokens.has(item) && 
      aliases.some(alias => normHeader(item.text).includes(normHeader(alias)))
    );
    if(token && !columns.some(col => Math.abs(col.x - token.x) < 4)){
      claimedTokens.add(token);
      columns.push({ name, x: token.x, width: Infinity });
    }
  });
  
  columns.sort((a, b) => a.x - b.x).forEach((column, index) => {
    column.width = index < columns.length - 1 ? Math.max(16, columns[index + 1].x - column.x) : 80;
  });
  
  const records = [];
  for(const row of rows.slice(headerIndex + 1)){
    const normalized = normalizePdfText(row.text);
    if(/^(?:total|subtotal|cantidad total|peso neto|peso bruto|volume total|volumen total)\b/i.test(normalized) || !/\d/.test(row.text)) continue;
    if(/codigo|referencia|description|descripcion/i.test(normHeader(row.text)) && /(qty|quantity|pcs|ctns|cajas|nw|gw)/i.test(normHeader(row.text))) continue;
    
    const size = pdfCell(row, columns, ["size", "sizecbm", "cbm", "dimension", "dimensiones", "medidas"]);
    const dimensions = findPdfDimensions(size);
    const q = parseNumber(pdfCell(row, columns, ["qty", "cantidad", "quantity", "pcs", "unidades"]));
    const boxes = parseNumber(pdfCell(row, columns, ["ctns", "cajas", "boxes", "cartons", "bultos"]));
    const nwTotal = parseNumber(pdfCell(row, columns, ["totalnw", "nettotal", "nwtotal", "pesonetototal"]));
    const gwTotal = parseNumber(pdfCell(row, columns, ["totalgw", "grosstotal", "gwtotal", "pesobrutototal"]));
    const nw = parseNumber(pdfCell(row, columns, ["nw", "netweight", "pesoneto"]));
    const gw = parseNumber(pdfCell(row, columns, ["gw", "grossweight", "pesobruto"]));
    
    if(!Number.isFinite(q) || (!Number.isFinite(gwTotal) && !Number.isFinite(gw) && !Number.isFinite(nwTotal) && !Number.isFinite(nw))) continue;
    
    const refCode = pdfCell(row, columns, ["referencia", "referencian", "reference", "ref"]);
    const descText = pdfCell(row, columns, ["description", "descripcion", "desc"]);
    const ctnCode = pdfCell(row, columns, ["codigo", "code", "ctnno", "ctn"]);
    const description = [refCode, descText].filter(Boolean).join(" - ") || descText || refCode || ctnCode || `Ítem ${records.length + 1}`;
    
    const boxCount = Number.isFinite(boxes) && boxes > 0 ? boxes : 1;
    const grossKg = Number.isFinite(gwTotal) ? gwTotal : Number.isFinite(gw) ? gw * boxCount : nwTotal;
    const netKg = Number.isFinite(nwTotal) ? nwTotal : Number.isFinite(nw) ? nw * boxCount : grossKg;
    const dimensionsUnit = dimensions?.unit || "cm";
    const L = dimensions ? convertPdfMeasurement({ value: dimensions.L, unit: dimensionsUnit }, "cm") : NaN;
    const W = dimensions ? convertPdfMeasurement({ value: dimensions.W, unit: dimensionsUnit }, "cm") : NaN;
    const H = dimensions ? convertPdfMeasurement({ value: dimensions.H, unit: dimensionsUnit }, "cm") : NaN;
    const cbm = parseNumber(size.match(/(?:cbm|m3|m³)\s*[:=]?\s*([0-9][0-9.,]*)/i)?.[1]);
    const volume = Number.isFinite(L) && Number.isFinite(W) && Number.isFinite(H) ? L * W * H * boxCount : cbm;
    
    if(!Number.isFinite(volume) || !Number.isFinite(grossKg)) continue;
    
    const quantity = Math.max(1, q);
    records.push({
      desc: description,
      q: quantity,
      L: Number(L.toFixed(4)),
      W: Number(W.toFixed(4)),
      H: Number(H.toFixed(4)),
      wt: grossKg / 1000 / quantity,
      nw: netKg / 1000 / quantity,
      gw: grossKg / 1000 / quantity,
      boxes: boxCount,
      volume: Number(volume.toFixed(4)),
      apilable: false,
      acostarse: false,
      sobresalir: false,
      fragil: false,
      peligrosa: false
    });
  }
  
  return { records, totals: pdfTotals(rows.map(row => row.text).join(" ")) };
}

const columnsMap = [
  ["CODIGO", 10], ["Ctn No", 50], ["REFERENCIA N°", 100], ["Description", 180], ["Qty (Pcs)", 340],
  ["Pcs/Ctn", 380], ["Ctns", 420], ["NW (Kgs)", 460], ["Total NW (Kgs)", 500],
  ["GW (Kgs)", 540], ["Total GW (Kgs)", 580], ["Size/CBM", 640]
];

const allItems = [];
columnsMap.forEach(([str, x]) => allItems.push({str, transform: [1,0,0,1,x, 750]}));

// Page 1 (27 items)
for(let i=0; i<27; i++){
  const y = 720 - i*18;
  const values = [
    "", `Ctn-${i+1}`, `REF-${i+1}`, `Producto ${i+1}`,
    "120", "20", "6", "10,0", "60,0", "10,5", "63,0", "40x30x20 cm"
  ];
  values.forEach((str, valIdx) => allItems.push({str, transform: [1,0,0,1,columnsMap[valIdx][1], y]}));
}

// Page 2 (33 items, offset by -2000)
for(let i=0; i<33; i++){
  const y = 720 - i*18 - 2000;
  const values = [
    "", `Ctn-${i+28}`, `REF-${i+28}`, `Producto ${i+28}`,
    "120", "20", "6", "10,0", "60,0", "10,5", "63,0", "40x30x20 cm"
  ];
  values.forEach((str, valIdx) => allItems.push({str, transform: [1,0,0,1,columnsMap[valIdx][1], y]}));
}

// Total line on page 2
[
  ["TOTAL", 100], ["7200", 340], ["360", 420], ["3600,0", 500], ["3780,0", 580], ["8,64", 640]
].forEach(([str, x]) => allItems.push({str, transform: [1,0,0,1,x, 100 - 2000]}));

const parsed = pdfTableRecords(allItems);
console.log("Extracted records count:", parsed.records.length);
assert.equal(parsed.records.length, 60, "Debe extraer 60 referencias de ambas páginas");

const calculated = parsed.records.reduce((acc, r) => {
  acc.q += r.q;
  acc.boxes += r.boxes;
  acc.netKg += r.nw * r.q * 1000;
  acc.grossKg += r.gw * r.q * 1000;
  acc.volume += r.volume;
  return acc;
}, { q: 0, boxes: 0, netKg: 0, grossKg: 0, volume: 0 });

console.log("Calculated:", {
  q: calculated.q,
  boxes: calculated.boxes,
  netKg: calculated.netKg.toFixed(2),
  grossKg: calculated.grossKg.toFixed(2),
  volumeM3: calculated.volume.toFixed(2)
});

assert.equal(calculated.q, 7200);
assert.equal(calculated.boxes, 360);
assert.equal(calculated.grossKg.toFixed(1), "3780.0");
assert.equal(calculated.volume.toFixed(2), "8.64");
console.log("✅ TEST PASSED SUCCESSFULLY!");
