const fs = require("node:fs");
const path = require("node:path");

const fixtureDirectory = path.join(__dirname, "fixtures", "packing-lists");

function escapePdf(text) {
  return String(text).replace(/([\\()])/g, "\\$1");
}

function createPdf(fileName, pages) {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageObjectNumbers = [];
  pages.forEach((lines, index) => {
    const pageObject = 4 + index * 2;
    const contentObject = pageObject + 1;
    pageObjectNumbers.push(`${pageObject} 0 R`);
    const stream = lines.map(({ text, x, y }) => `BT /F1 8 Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`).join("\n");
    objects[pageObject - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 800 8000] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject - 1] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });
  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.join(" ")}] /Count ${pages.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  fs.writeFileSync(path.join(fixtureDirectory, fileName), pdf, "ascii");
}

function format(value) {
  return Number(value).toFixed(3).replace(".", ",");
}

function flatFixture(fileName, rowCount, totalWeight, totalVolume, totalArea, splitHeader) {
  const lines = [];
  const headers = [[splitHeader ? "ITEM" : "ITEM CODE", 20], ["DESCRIPTION", 110], ["QTY", 310], ["CTNS", 360], ["TOTAL GW (kg)", 410], ["VOLUME (m3)", 510], ["DIMENSIONS (m)", 610]];
  headers.forEach(([text, x]) => lines.push({ text, x, y: 7960 }));
  if (splitHeader) lines.push({ text: "CODE", x: 20, y: 7948 });
  const baseWeight = Math.floor((totalWeight / rowCount) * 1000) / 1000;
  const baseVolume = Math.floor((totalVolume / rowCount) * 1000) / 1000;
  const baseArea = Math.floor((totalArea / rowCount) * 1000) / 1000;
  for (let index = 0; index < rowCount; index++) {
    const last = index === rowCount - 1;
    const weight = last ? totalWeight - baseWeight * (rowCount - 1) : baseWeight;
    const volume = last ? totalVolume - baseVolume * (rowCount - 1) : baseVolume;
    const area = last ? totalArea - baseArea * (rowCount - 1) : baseArea;
    const y = 7920 - index * 18;
    [[`SYN-${String(index + 1).padStart(3, "0")}`, 20], [`Producto sintetico ${index + 1}`, 110], ["1", 310], ["1", 360], [format(weight), 410], [format(volume), 510], [`${format(area)} x 1,000 x 1,000 m`, 610]].forEach(([text, x]) => lines.push({ text, x, y }));
  }
  createPdf(fileName, [lines]);
}

function hierarchicalFixture(fileName, groupCount, totalWeight, totalVolume, totalArea, label) {
  const lines = [];
  const baseWeight = Math.floor((totalWeight / groupCount) * 1000) / 1000;
  const baseVolume = Math.floor((totalVolume / groupCount) * 1000) / 1000;
  const baseArea = Math.floor((totalArea / groupCount) * 1000) / 1000;
  for (let index = 0; index < groupCount; index++) {
    const last = index === groupCount - 1;
    const weight = last ? totalWeight - baseWeight * (groupCount - 1) : baseWeight;
    const volume = last ? totalVolume - baseVolume * (groupCount - 1) : baseVolume;
    const area = last ? totalArea - baseArea * (groupCount - 1) : baseArea;
    const y = 7960 - index * 28;
    lines.push({ text: `00 ${900000 + index} ${index + 1} ${label} A${String(index + 1).padStart(2, "0")} ${format(weight)} KG ${format(weight - 1)} KG ${format(volume)} M3`, x: 20, y });
    lines.push({ text: `${format(area)} x 1,000 x 1,000 M`, x: 20, y: y - 9 });
    lines.push({ text: `SY${index + 1}-001 1 PZ Producto sintetico ${index + 1}`, x: 20, y: y - 18 });
  }
  createPdf(fileName, [lines]);
}

flatFixture("PL_2026RL338.pdf", 82, 3299.8, 5.42, 37.05, true);
hierarchicalFixture("PACKING_AFM9667.pdf", 3, 960, 5.4, 3.6, "PALLET");
hierarchicalFixture("02_Packing_List_DN3047.pdf", 242, 12682, 94.1, 76.24, "CAIXA");
flatFixture("PACKING_LIST_TEST_001.pdf", 5, 90.45, 0.419, 2.455, false);
flatFixture("PACKING_LIST_TEST_002_COMPLEJA.pdf", 10, 288.1, 0.795, 4.978, true);