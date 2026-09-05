
function showPanel(n){
  // Limpiar los paneles dinámicos exclusivos de Servicio cuando
  // el usuario cambia a otra etapa. Así Contenedor/Piezas y el botón
  // "Continuar" nunca aparecen en Especiales, Analizador o Cotización.
  const panelContenedor = $("panel2");
  const panelCarga = $("panel3");
  const serviceContinue = $("servicioContinue");

  if(n !== 1){
    panelContenedor?.classList.remove("active","inline-carga-suelta","service-side-active");
    panelCarga?.classList.remove("active","inline-carga-suelta","service-side-active");
    if(serviceContinue) serviceContinue.style.display = "none";
  }else{
    if(serviceContinue) serviceContinue.style.display = "flex";
  }

  if((n===2 || n===3) && $("tipoCarga")){
    showPanel(1);
    toggleContainer();
    const tipo = $("tipoCarga").value;
    setTimeout(()=>scrollToId(tipo === "Contenedor" ? "panel2" : "panel3"),80);
    return;
  }

  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const p=document.getElementById('panel'+n);
  if(p)p.classList.add('active');

  document.querySelectorAll('.app-tab').forEach(tab=>{
    tab.classList.toggle('active',Number(tab.dataset.panel)===n);
  });

  if(n===1) toggleContainer();
  updateDashboard();
  window.scrollTo({top:0,behavior:'smooth'});
}
function updateDashboard(){const t=typeof totals==='function'?totals():{weight:0,volume:0,refs:0};const a=typeof lastAnalysis!=='undefined'?lastAnalysis:null;const q=id=>document.getElementById(id);if(q('dashTon'))q('dashTon').textContent=(t.weight||0).toFixed(5)+' t';if(q('dashM3'))q('dashM3').textContent=(t.volume||0).toFixed(3)+' m³';if(q('dashRefs'))q('dashRefs').textContent=t.refs||0;updateQuoteButton();if(a&&typeof validation==='function'){const v=validation(a);q('dashStatus').textContent=v.level==='green'?'Aprobado':v.level==='yellow'?'Revisar':'No compatible';q('dashDot').className='status-dot '+v.level;}else{q('dashStatus').textContent='Pendiente';q('dashDot').className='status-dot';}}
function updateQuoteButton(){const button=$("quoteGenerateBtn");if(!button)return;const enabled=typeof hasCargo==='function'&&hasCargo();button.disabled=!enabled;button.setAttribute("aria-disabled",String(!enabled));}

const BASE_VEHICLES = [
 {name:"4 x 4",cap:1,vol:5.5,L:2.0,W:1.4,H:1.5,body:"Furgón - carpado platón",cargo:"Carga suelta / bultos / pallets",special:""},
 {name:"Turbo",cap:4.5,vol:18.5,L:4.5,W:2.0,H:2.1,body:"Furgón - carpado platón",cargo:"Carga suelta / bultos / pallets",special:""},
 {name:"600 sencillo",cap:8,vol:30.5,L:5.9,W:2.3,H:2.2,body:"Furgón - carpado / plancha",cargo:"Carga suelta / bultos / pallets / contenedor 20'",special:""},
 {name:"Doble troque",cap:17,vol:35.5,L:7.5,W:2.3,H:2.2,body:"Furgón - carpado / plancha",cargo:"Carga suelta / bultos / pallets / contenedor 20'",special:""},
 {name:"Minimula patineta",cap:18,vol:71.5,L:12,W:2.4,H:2.3,body:"Furgón - carpado plancha - grillo",cargo:"Carga suelta / bultos / contenedor 20' (combinados)",special:""},
 {name:"Mula",cap:35,vol:71.5,L:12,W:2.4,H:2.3,body:"Furgón - carpado plancha - grillo",cargo:"Carga suelta / bultos / contenedor 40' (combinados)",special:""},
 {name:"Carro tanque / niñera",cap:30,vol:null,L:12,W:2.4,H:2.4,body:"Tanque / tráiler hidráulico o de guaya",cargo:"Líquidos / vehículos",special:"Carga especializada"},
 {name:"Tolva",cap:35,vol:null,L:12,W:2.4,H:2.4,body:"Tolva",cargo:"Granel",special:"Carga especializada"},
 {name:"Cama baja / tolva",cap:35,vol:null,L:null,W:null,H:null,body:"Tráiler cama baja",cargo:"Cargas extra dimensionadas",special:"Según resolución / permiso"},
 {name:"Modular",cap:100,vol:null,L:null,W:null,H:null,body:"Tráiler modular",cargo:"Cargas extra dimensionadas",special:"Según resolución / permiso"},
 {name:"Van / furgón liviano",cap:1.2,vol:7,L:3.0,W:1.6,H:1.45,body:"Furgón cerrado",cargo:"Paquetería / urbana",special:"Configurable"},
 {name:"NHR",cap:2.5,vol:12,L:3.6,W:1.8,H:1.8,body:"Furgón / estacas",cargo:"Carga urbana liviana",special:"Configurable"},
 {name:"NPR",cap:4,vol:16,L:4.2,W:1.9,H:2.0,body:"Furgón / estacas",cargo:"Distribución urbana",special:"Configurable"},
 {name:"NQR",cap:6,vol:24,L:5.0,W:2.1,H:2.1,body:"Furgón / estacas",cargo:"Carga urbana mayor",special:"Configurable"},
 {name:"Furgón refrigerado",cap:8,vol:28,L:5.8,W:2.25,H:2.2,body:"Furgón refrigerado",cargo:"Carga con temperatura controlada",special:"Refrigeración"},
 {name:"Plataforma",cap:18,vol:null,L:8,W:2.5,H:2.5,body:"Plataforma",cargo:"Equipos / estructuras",special:"Carga especial"},
 {name:"Portacontenedor 20'",cap:30,vol:null,L:6.1,W:2.44,H:2.59,body:"Portacontenedor",cargo:"Contenedor 20'",special:"Validar peso bruto y ruta"},
 {name:"Portacontenedor 40'",cap:35,vol:null,L:12.2,W:2.44,H:2.9,body:"Portacontenedor",cargo:"Contenedor 40 / 40 HC",special:"Validar peso bruto y ruta"},
 {name:"Cama alta extensible",cap:35,vol:null,L:14,W:2.5,H:3,body:"Cama extensible",cargo:"Carga larga / especial",special:"Permiso según caso"}
];
let vehicles = JSON.parse(localStorage.getItem("lt_vehicles")||"null") || BASE_VEHICLES.map(v=>({...v}));
let pieces = [];
let lastAnalysis = null;
let editingIndex = null;
let pdfTotalsOverride = null;

function $(id){return document.getElementById(id)}
function num(id){return parseFloat($(id).value)||0}
function scrollToId(id){$(id).scrollIntoView({behavior:"smooth"})}
function toggleContainer(){
  const tipo = $("tipoCarga").value;
  const serviceContinue = $("servicioContinue");
  if(serviceContinue) serviceContinue.style.display = tipo === "Carga suelta" ? "flex" : "none";
  const panelContenedor = $("panel2");
  const panelCarga = $("panel3");

  if(!panelContenedor || !panelCarga) return;

  // Al entrar por primera vez a Servicio no mostramos ningún formulario
  // secundario. Aparece únicamente después de que el usuario seleccione
  // explícitamente el tipo de carga.
  panelContenedor.classList.remove("active","inline-carga-suelta","service-side-active");
  panelCarga.classList.remove("active","inline-carga-suelta","service-side-active");

  if(!tipo) return;

  if(tipo === "Contenedor"){
    panelContenedor.classList.add("inline-carga-suelta","service-side-active");
  }else if(tipo === "Carga suelta"){
    panelCarga.classList.add("inline-carga-suelta","service-side-active");
  }
  updateLooseCargoContinue();
}
function updateLooseCargoContinue(){
  const button=$("looseCargoContinue");
  if(!button)return;
  const enabled=$("tipoCarga")?.value==="Carga suelta" && pieces.length>0;
  button.disabled=!enabled;
  button.setAttribute("aria-disabled",String(!enabled));
}
function continuarServicio(){
  const tipo = $("tipoCarga").value;

  if(!tipo){
    alert("Primero selecciona el tipo de carga.");
    $("tipoCarga").focus();
    return;
  }

  if(tipo === "Carga suelta" && (!pieces || pieces.length === 0)){
    alert("Agrega al menos una carga válida antes de continuar.");
    const p = $("panel3");
    if(p) p.scrollIntoView({behavior:"smooth",block:"start"});
    return;
  }

  if(tipo === "Contenedor"){
    if(num("contCant") < 1){
      alert("Indica una cantidad de contenedores válida.");
      $("contCant")?.focus();
      return;
    }
  }

  showPanel(4);
}

function irDesdeServicio(){
  const tipo = $("tipoCarga").value;

  if(tipo === "Contenedor" || tipo === "Carga suelta"){
    toggleContainer();
    setTimeout(()=>scrollToId(tipo === "Contenedor" ? "panel2" : "panel3"),80);
    return;
  }

  showPanel(4);
}
function volverACarga(){
  showPanel(1);
  toggleContainer();
  const tipo = $("tipoCarga").value;
  setTimeout(()=>scrollToId(tipo === "Contenedor" ? "panel2" : "panel3"),80);
}
function unitToM(v,u){return u==="Centímetros"?v/100:v}
function weightToT(v,u){return u==="kg"?v/1000:v}

function calcPiecePreview(){
 const q=Math.max(1,num("pCant")), L=unitToM(num("pL"),$("pUnidad").value), W=unitToM(num("pA"),$("pUnidad").value), H=unitToM(num("pH"),$("pUnidad").value);
 const wt=weightToT(num("pPeso"),$("pPesoUnidad").value);
 $("previewPiece").innerHTML=(L&&W&&H?`Volumen unitario: <b>${(L*W*H).toFixed(2)} m³</b> · volumen total: <b>${(L*W*H*q).toFixed(2)} m³</b>`:"Ingresa medidas")+" · "+(wt?`peso total: <b>${(wt*q).toFixed(3)} t</b>`:"ingresa peso");
}
["pCant","pL","pA","pH","pPeso","pUnidad","pPesoUnidad"].forEach(id=>$(id).addEventListener("input",calcPiecePreview));

function addPieceObject(){
 const q=Math.max(1,num("pCant")), L=unitToM(num("pL"),$("pUnidad").value), W=unitToM(num("pA"),$("pUnidad").value), H=unitToM(num("pH"),$("pUnidad").value), wt=weightToT(num("pPeso"),$("pPesoUnidad").value);
 if(!L||!W||!H||!wt){alert("Completa cantidad, largo, ancho, alto y peso de la pieza.");return null}
 return {desc:$("pDesc").value.trim()||`Referencia ${pieces.length+1}`,q,L,W,H,wt,nw:wt,gw:wt,apilable:$("pApilable").checked,acostarse:$("pAcostarse").checked,sobresalir:$("pSobresalir").checked,fragil:$("pFragil").checked,peligrosa:$("pPeligrosa").checked};
}
function resetPieceForm(){
 ["pDesc","pL","pA","pH","pPeso"].forEach(id=>$(id).value="");
 $("pCant").value=1;$("pUnidad").value="Centímetros";$("pPesoUnidad").value="kg";
 ["pApilable","pAcostarse","pSobresalir","pFragil","pPeligrosa"].forEach(id=>$(id).checked=false);
 editingIndex=null; calcPiecePreview();
}
function agregarPieza(){
 const p=addPieceObject(); if(!p)return;
 if(editingIndex!==null){pieces[editingIndex]=p}else pieces.push(p);
 renderPieces(); resetPieceForm(); scrollToId("pieceForm");
}
function editarPieza(i){
 const p=pieces[i]; editingIndex=i;
 $("pDesc").value=p.desc;$("pCant").value=p.q;$("pL").value=p.L;$("pA").value=p.W;$("pH").value=p.H;$("pUnidad").value="Metros";$("pPeso").value=p.wt;$("pPesoUnidad").value="toneladas";
 $("pApilable").checked=p.apilable;$("pAcostarse").checked=p.acostarse;$("pSobresalir").checked=p.sobresalir;$("pFragil").checked=p.fragil;$("pPeligrosa").checked=p.peligrosa;
 calcPiecePreview();scrollToId("pieceForm");
}
function eliminarPieza(i){if(confirm("¿Eliminar esta referencia?")){pieces.splice(i,1);renderPieces()}}
function renderPieces(){
 let el=$("pieceList");
 if(!pieces.length){el.innerHTML='<div class="empty">No hay referencias guardadas. Agrega la primera pieza o grupo, o impórtalas desde Excel o PDF.</div>'}
 else el.innerHTML=pieces.map((p,i)=>{
  const boxesLabel = p.boxes ? ` · ${p.boxes} cajas` : "";
  const hasDimensions=Number.isFinite(p.L)&&Number.isFinite(p.W)&&Number.isFinite(p.H);
  const hasWeight=Number.isFinite(p.wt);
  const vol = Number.isFinite(Number(p.volume))?Number(p.volume).toFixed(3):hasDimensions?(p.L*p.W*p.H*(p.boxes||p.q)).toFixed(3):"N/D";
  const area = hasDimensions?(p.L*p.W*(p.boxes||p.q)).toFixed(2):"N/D";
  const pesoTotT = hasWeight?(p.wt*p.q).toFixed(5):"N/D";
  const pesoTotKg = hasWeight?((p.wt*p.q)*1000).toFixed(2):"N/D";
  const dimCm = hasDimensions?`${Math.round(p.L*100)} × ${Math.round(p.W*100)} × ${Math.round(p.H*100)} cm`:"N/D";
  const dimM = hasDimensions?`${p.L.toFixed(2)} × ${p.W.toFixed(2)} × ${p.H.toFixed(2)} m`:"N/D";
  return `<div class="piece"><div class="piece-grid">
 <div><b>${esc(p.desc)}</b><small>${p.q} und${boxesLabel} · ${dimCm} <span style="color:#8f9bad">(${dimM})</span></small></div>
 <div><small>Peso</small><b>${pesoTotT} t</b> <span style="font-size:10px;color:#8f9bad">(${pesoTotKg} kg)</span></div>
 <div><small>Volumen</small><b>${vol} m³</b></div>
 <div><small>Área piso</small><b>${area} m²</b></div>
 <div><small>Apilable</small><b>${p.apilable?"Sí":"No"}</b></div>
 <div><small>Estado</small><b>${p.incomplete?"Incompleta":p.peligrosa?"Peligrosa":p.fragil?"Frágil":"Normal"}</b></div>
 <div style="display:flex;gap:5px"><button class="iconbtn" onclick="editarPieza(${i})" title="Editar">✎</button><button class="iconbtn" onclick="eliminarPieza(${i})" title="Eliminar">×</button></div>
 </div></div>`;
 }).join("");
 const t=totals();$("totalTon").textContent=t.weight.toFixed(5)+" t ("+(t.weight*1000).toFixed(2)+" kg)";$("totalM3").textContent=t.volume.toFixed(3)+" m³";$("totalArea").textContent=t.area.toFixed(3)+" m²";$("totalRefs").textContent=pieces.length;
 renderMeasuresTable();
 updateLooseCargoContinue();
 updateQuoteButton();
}
function renderMeasuresTable(){
 const tbl=$("measuresTable"); if(!tbl)return;
 if(isContainer()){
  const count=Math.max(1,num("contCant"));
  const weight=(num("contMerc")+num("contTara"))*count/1000;
  tbl.innerHTML=`<tr><td>Contenedor ${esc($("contTam").value)}</td><td>${count}</td><td class="muted-cell">Dimensiones según equipo</td><td>${weight.toFixed(3)} t</td><td>N/D</td></tr>`;
  return;
 }
 if(!pieces.length){tbl.innerHTML='<tr><td colspan="5" class="muted-cell" style="text-align:center;padding:16px">Sin referencias registradas.</td></tr>';return}
 tbl.innerHTML=pieces.map(p=>{
   const totT = (p.wt*p.q).toFixed(3);
   const totKg = (p.wt*p.q*1000).toFixed(1);
   const vol = (Number.isFinite(Number(p.volume))?Number(p.volume):p.L*p.W*p.H*(p.boxes||p.q)).toFixed(3);
   const cantLabel = p.boxes ? `${p.q} (${p.boxes} cjs)` : `${p.q}`;
   const dimStr = `${Math.round(p.L*100)}×${Math.round(p.W*100)}×${Math.round(p.H*100)} cm`;
   return `<tr><td>${esc(p.desc)}</td><td>${cantLabel}</td><td class="muted-cell">${dimStr}</td><td>${totT} t <small style="color:#8f9bad">(${totKg} kg)</small></td><td>${vol}</td></tr>`;
 }).join("");
}
function isContainer(){return $("tipoCarga")?.value==="Contenedor"}
function hasCargo(){return pieces.length>0 || (isContainer() && num("contMerc")>0 && num("contCant")>=1)}
function totals(){
 if(isContainer()){
  const count=Math.max(1,num("contCant"));
  const weight=(num("contMerc")+num("contTara"))*count/1000;
  return {weight,gw:weight,net:num("contMerc")*count/1000,volume:0,area:0,refs:count,maxL:0,maxW:0,maxH:0};
 }
  const calculated=pieces.reduce((a,p)=>{
   const quantity=Number(p.q)||0;
   const boxes=Number(p.boxes)||quantity;
   const gross=Number(p.gw??p.wt)||0;
   const net=Number(p.nw??p.wt)||0;
   a.weight+=gross*quantity;
   a.gw+=gross*quantity;
   a.net+=net*quantity;
   a.volume+=Number.isFinite(Number(p.volume))?Number(p.volume):p.L*p.W*p.H*boxes;
   a.area+=p.L*p.W*boxes;
   a.maxL=Math.max(a.maxL,p.L);
   a.maxW=Math.max(a.maxW,p.W);
   a.maxH=Math.max(a.maxH,p.H);
   return a;
 },{weight:0,gw:0,net:0,volume:0,area:0,refs:pieces.length,maxL:0,maxW:0,maxH:0});
  if(!pdfTotalsOverride)return calculated;
  return {...calculated,...pdfTotalsOverride};
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

const PDF_HEADER_DEFINITIONS = [
  { key: "desc", aliases: ["descripcion de la mercancia", "descripcion del producto", "commodity description", "equipo / carga", "descripcion", "description", "detalle", "producto", "product", "mercancia", "mercancía", "articulo", "artículo", "material", "nombre", "especificacion", "desc", "commodity"] },
  { key: "size", aliases: ["dimensions (lxwxh cm)", "dimensions (cm)", "dimensiones (cm)", "dimensiones (m)", "medidas (cm)", "medidas (m)", "size/cbm", "size", "cbm", "dimensiones", "dimension", "medidas", "medida", "tamano", "lxwxh", "l x a x h", "dim (cm)", "dim (m)", "dim (mm)", "medidas (mts)", "dimensiones (mts)"] },
  { key: "totalGw", aliases: ["total gw (kgs)", "total gw", "total gross weight", "peso bruto total", "gw total", "total weight", "total gross wt", "peso bruto tot", "peso total (t)", "peso total (ton)", "peso total (kg)", "peso total", "peso bruto (kg)", "peso (kg)", "peso (t)", "peso (ton)", "gross weight (kgs)", "gross weight", "gross", "peso bruto", "gw (kgs)", "gw", "peso", "weight"] },
  { key: "weightUnit", aliases: ["unid peso", "unidad peso", "weight unit", "unit weight", "weight uom", "peso uom"] },
  { key: "totalNw", aliases: ["total nw (kgs)", "total nw", "total net weight", "peso neto total", "nw total", "total net wt", "peso neto (kg)", "peso neto (t)", "peso neto", "net weight (kgs)", "net weight", "net", "nw (kgs)", "nw"] },
  { key: "gwUnit", aliases: ["peso bruto unitario", "peso bruto por caja", "peso unitario", "gw/ctn", "gw/box", "peso x caja", "peso por bulto", "peso unit (kg)", "peso u (t)", "peso/u", "peso unit", "unit gw", "unit gross weight", "unit weight", "gw per ctn", "gw per box"] },
  { key: "nwUnit", aliases: ["peso neto unitario", "peso neto por caja", "nw/ctn", "nw/box", "p. neto unit", "unit nw", "unit net weight"] },
  { key: "pcsPerBox", aliases: ["unidades por caja", "piezas por caja", "pcs/ctn", "pcs/box", "pcs ctn", "pcs box", "pcsctn", "pcsbox", "und/caja"] },
  { key: "qty", aliases: ["quantity (pcs)", "cantidad piezas", "piezas totales", "total pcs", "tot pcs", "unidades", "units", "qty (pcs)", "cantidad", "cant", "qty", "quantity", "und", "pcs", "piezas", "cant.", "pieces"] },
  { key: "boxes", aliases: ["total bultos", "total cartons", "total cajas", "total ctns", "cant bultos", "cant cajas", "total pkgs", "bultos", "ctns", "cartons", "cajas", "boxes", "paquetes", "pkgs", "packages"] },
  { key: "len", aliases: ["largo (cm)", "largo (m)", "largo (mm)", "length (cm)", "length (m)", "largo", "longitud", "length", "l (cm)", "l (m)", "l (mm)", "l"] },
  { key: "width", aliases: ["ancho (cm)", "ancho (m)", "ancho (mm)", "width (cm)", "width (m)", "ancho", "width", "wide", "w (cm)", "w (m)", "w (mm)", "w", "a"] },
  { key: "height", aliases: ["alto (cm)", "alto (m)", "alto (mm)", "height (cm)", "height (m)", "alto", "altura", "height", "h (cm)", "h (m)", "h (mm)", "h"] },
  { key: "dimUnit", aliases: ["unid dim", "unidad dimension", "unidad dimensiones", "dimension unit", "unit dimension", "dim unit", "dim"] },
  { key: "ref", aliases: ["referencia n°", "referencia no", "part number", "codigo producto", "referencia", "reference", "part no", "item code", "sku", "modelo", "ref"] },
  { key: "code", aliases: ["commodity item", "carton no", "awb item", "item no", "ctn no", "bulto no", "box no", "codigo", "code", "posicion", "ítem", "item", "pos", "nro", "no", "sec"] },
  { key: "vol", aliases: ["volumen total", "volume (cbm)", "volume (m3)", "volumen (m3)", "cbm", "volumen", "volume", "m3", "cubicaje", "cubagem"] }
];

function normHeader(h){return String(h||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"")}
function stripPageMarkers(value){
  return String(value ?? "")
    .replace(/(^|\s)(?:p(?:ag(?:ina)?)?\.?|page)\s*\d+\s*\/\s*\d+(?=\s|$)/gi, "$1")
    .replace(/(^|\s)\d+\s*\/\s*\d+(?=\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
function parseNumber(value){
 const raw=stripPageMarkers(value).trim().replace(/\s/g,"");
 if(!raw)return NaN;
 const numeric=(raw.match(/[+-]?[0-9][0-9.,]*/) || [""])[0];
 if(!numeric)return NaN;
 const normalized=numeric.includes(",")&&numeric.includes(".")
  ? (numeric.lastIndexOf(",")>numeric.lastIndexOf(".")?numeric.replace(/\./g,"").replace(",","."):numeric.replace(/,/g,""))
  : numeric.replace(",",".");
 return Number(normalized);
}
function parseHierarchicalTotal(value){
 const raw=stripPageMarkers(value).replace(/\s/g,"");
 if(/^[-+]?\d{1,3}(?:,\d{3})+$/.test(raw))return Number(raw.replace(/,/g,""));
 return parseNumber(raw);
}
function findBestHeaderValue(rowMap, aliases, options={}){
  const preferTotal = Boolean(options.preferTotal);
  const list = Array.isArray(aliases) ? aliases : [aliases];
  if(!rowMap || !Object.keys(rowMap).length) return NaN;

  const scored = Object.entries(rowMap)
    .map(([key, value]) => {
      const keyNorm = normHeader(key);
      const score = list.reduce((acc, alias) => {
        const aliasNorm = normHeader(alias);
        if(!aliasNorm) return acc;
        if(!keyNorm || !aliasNorm) return acc;
        if(keyNorm === aliasNorm) return acc + 100;
        if(keyNorm.includes(aliasNorm) || aliasNorm.includes(keyNorm)) return acc + 40;
        return acc;
      }, 0);

      const numeric = parseNumber(value);
      const isTotal = /total|totale|totales|tot/i.test(String(key));
      return { key, value, score, isTotal, numeric };
    })
    .filter(item => item.score > 0 && Number.isFinite(item.numeric));

  if(!scored.length) return NaN;
  scored.sort((a, b) => {
    if(preferTotal && a.isTotal !== b.isTotal) return a.isTotal ? -1 : 1;
    return b.score - a.score;
  });

  return scored[0].numeric;
}
function importValue(keys,names){
 for(const name of names){
  const exact=keys[normHeader(name)];
  if(exact!==undefined&&String(exact).trim()!=="")return exact;
 }
 const key=Object.keys(keys).find(candidate=>names.some(name=>normHeader(name).length>1&&candidate.includes(normHeader(name))));
 return key?keys[key]:undefined;
}
function normalizePdfText(value){return stripPageMarkers(value).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim()}

function roundExtracted(value){return Number.isFinite(value)?Number(value.toFixed(6)):null}
function parseExtractedMeasurement(value, kind){
  const match=String(value||"").match(/([+-]?[0-9][0-9.,]*)\s*(ton(?:eladas?)?\s*(?:corta|us)?|t\s*(?:corta|us)?|kg|kgs|kilos|lb|lbs|libras|g|gramos|mm|cm|m|mts|metros|in|inch|pulg(?:adas)?|ft|pies)?/i);
  if(!match)return null;
  const number=parseNumber(match[1]);
  if(!Number.isFinite(number))return null;
  const unit=(match[2]||"").toLowerCase().replace(/\s+/g," ").trim();
  if(kind==="weight"){
    const factor=/^(g|gramos)$/.test(unit)?0.001:/^(lb|lbs|libras)$/.test(unit)?0.453592:/^(oz|onza|onzas)$/.test(unit)?0.0283495:/^(ton corta|t corta|ton us|t us)$/.test(unit)?907.185:/^(ton|tonelada|toneladas|t)$/.test(unit)?1000:1;
    return {value:number*factor,unit:unit||"kg",converted:unit!==""&&unit!=="kg"&&unit!=="kgs"&&unit!=="kilos"};
  }
  const factor=/^(mm)$/.test(unit)?0.1:/^(m|mts|metros)$/.test(unit)?100:/^(yd|yarda|yardas)$/.test(unit)?91.44:/^(in|inch|pulgadas?)$/.test(unit)?2.54:/^(ft|pies)$/.test(unit)?30.48:1;
  return {value:number*factor,unit:unit||"cm",converted:unit!==""&&!/^(cm)$/.test(unit)};
}
function extractedValueAfter(text, labels, kind){
  const label=labels.join("|");
  const match=new RegExp(`(?:${label})\\s*(?:[:=\\-]|\\s+|(?=[0-9]))\\s*([+-]?[0-9][0-9.,]*\\s*(?:ton(?:eladas?)?\\s*(?:corta|us)?|t\\s*(?:corta|us)?|kg|kgs|kilos|lb|lbs|libras|oz|onzas|g|gramos|mm|cm|m|mts|metros|yd|yardas|in|inch|pulg(?:adas)?|ft|pies)?)`,`i`).exec(text);
  return match?parseExtractedMeasurement(match[1],kind):null;
}
function extractedDimensions(text){
  const combined=/([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*(mm|cm|m|mts|metros|in|inch|pulg(?:adas)?|ft|pies)?/i.exec(text);
  if(combined){
    const unit=combined[4]||"cm";
    return [1,2,3].map(index=>parseExtractedMeasurement(`${combined[index]} ${unit}`,"dimension"));
  }
  const compact=/\bL\s*([0-9][0-9.,]*)\s+A\s*([0-9][0-9.,]*)\s+H\s*([0-9][0-9.,]*)\s*(mm|cm|m|mts|metros|in|inch|pulg(?:adas)?|ft|pies)?\b/i.exec(text);
  if(compact){
    const unit=compact[4]||"cm";
    return [1,2,3].map(index=>parseExtractedMeasurement(`${compact[index]} ${unit}`,"dimension"));
  }
  const values=[];
  ["largo|longitud|length|long|lgth|l", "ancho|anchura|width|anch|w", "alto|altura|height|alt|h"].forEach(labels=>{
    const measurement=extractedValueAfter(text,labels.split("|"),"dimension");
    values.push(measurement);
  });
  return values.every(Boolean)?values:null;
}
function extractedPackaging(text){
  const match=/(?:bultos?|cajas?|cartons?|boxes|packages?|paquetes?|pallets?|palets?)\s*[:=x-]?\s*([0-9][0-9.,]*)/i.exec(text);
  return match?parseNumber(match[1]):null;
}
function extractedDescription(text){
  const match=/(?:descripci[oó]n(?: de la mercanc[ií]a)?|description|commodity|producto|product|item|carga|mercanc[ií]a)\s*[:=-]\s*([^;|]+)/i.exec(text);
  if(match)return match[1].replace(/\s+(?:(?:qty|quantity|cantidad|cant|peso|weight|wt|gw|bultos?|cajas?|volume|volumen|largo|longitud|length|ancho|width|alto|height)\b).*$/i,"").replace(/\s+/g," ").trim();
  return null;
}
function mergeExtractedLines(lines){
  const merged=[];
  lines.map(line=>String(line||"").trim()).filter(Boolean).forEach(line=>{
    const startsRecord=/^(?:item|ítem|row|line)\s*\d+\b|^\d+\s+(?=[A-WYZÁÉÍÓÚÑ])/i.test(line);
    if(startsRecord||!merged.length)merged.push(line);
    else merged[merged.length-1]=`${merged[merged.length-1]} ${line}`;
  });
  return merged;
}
function extractedReference(text){
  const match=/(?:referencia|reference|sku|part\s*no\.?|codigo|c[oó]digo|ref\.?)\s*(?:[:#=-]\s*|\s+)([\w./-]+)/i.exec(text);
  return match?match[1].replace(/[.,;:]+$/g,"").trim():null;
}
function extractedReferencesToPieces(result){
  return (result?.referencias||[]).map(reference=>{
    const hasValue=value=>value!==null&&value!==undefined&&Number.isFinite(Number(value));
    const quantity=Number(reference.cantidad)>0?Number(reference.cantidad):1;
    const weightKg=hasValue(reference.peso_kg)?Number(reference.peso_kg):null;
    return {
      desc:reference.descripcion||reference.referencia||"Referencia importada",
      ref:reference.referencia,
      q:quantity,
      boxes:hasValue(reference.bultos)?Number(reference.bultos):quantity,
      L:hasValue(reference.largo_cm)?Number(reference.largo_cm)/100:null,
      W:hasValue(reference.ancho_cm)?Number(reference.ancho_cm)/100:null,
      H:hasValue(reference.alto_cm)?Number(reference.alto_cm)/100:null,
      volume:hasValue(reference.volumen_m3)?Number(reference.volumen_m3):(
        hasValue(reference.largo_cm)&&hasValue(reference.ancho_cm)&&hasValue(reference.alto_cm)
          ? Number(reference.largo_cm)*Number(reference.ancho_cm)*Number(reference.alto_cm)/1000000*quantity
          : null
      ),
      wt:weightKg===null?null:weightKg/1000,
      gw:weightKg===null?null:weightKg/1000,
      nw:weightKg===null?null:weightKg/1000,
      incomplete:Boolean(reference.incompleta),
      extractionWarnings:Array.isArray(reference.advertencias)?reference.advertencias:[],
      apilable:true,acostarse:false,sobresalir:false,fragil:false,peligrosa:false
    };
  });
}
function extractPackingListText(input){
  const source=String(input??"");
  const lines=mergeExtractedLines(source.split(/\r?\n/).map(line=>stripPageMarkers(line).trim()));
  const references=[];
  const units=new Set();
  const headerPattern=/^(?:largo|length|longitud|ancho|width|alto|height|peso|weight|qty|quantity|cantidad|description|descripcion|referencia|reference)(?:\s|$)|^(?:item|ítem)\s*$/i;
  lines.forEach((line,index)=>{
    const normalized=normalizePdfText(line);
    if(!normalized||/^(?:page|pagina|p[aá]gina)?\s*\d+(?:\s*\/\s*\d+)?$/.test(normalized)||headerPattern.test(normalized))return;
    const dimensions=extractedDimensions(line);
    const volumeMatch=/(?:volumen|volume|cbm|m3|m³)\s*[:=]?\s*([0-9][0-9.,]*)\s*(m3|m³|cbm|l|litros)?/i.exec(line);
    const volume=volumeMatch?parseNumber(volumeMatch[1])*(/^(l|litros)$/i.test(volumeMatch[2]||"")?0.001:1):null;
    const weight=extractedValueAfter(line,["peso bruto unitario","peso neto unitario","peso unitario","gross weight per unit","net weight per unit","weight per unit","gross weight","net weight","peso bruto","peso neto","peso total","peso","weight","wt","gw"],"weight");
    const quantity=extractedValueAfter(line,["cantidad","cant","unidades","units","qty","quantity","piezas","pieces"],"quantity");
    const boxes=extractedPackaging(line);
    const reference=extractedReference(line);
    const description=extractedDescription(line);
    const useful=Boolean(dimensions||volume!==null||weight||quantity||boxes||reference||description);
    if(!useful||(!/\d/.test(line)&&!description&&!reference))return;
    const warnings=[];
    if(weight?.unit)units.add(weight.unit);
    dimensions?.forEach(d=>{if(d?.unit)units.add(d.unit)});
    if(volumeMatch?.[2])units.add(volumeMatch[2].toLowerCase());
    const qty=quantity?.value>0?quantity.value:1;
    if(!quantity){warnings.push("Cantidad no encontrada, se asumió 1");}
    if(weight?.converted)warnings.push(`Peso convertido de ${weight.unit} a kg`);
    if(dimensions?.some(d=>d.converted))warnings.push("Dimensiones convertidas a cm");
    if(volume!==null)warnings.push("Se reportó volumen; largo, ancho y alto quedan en null");
    if(!dimensions)warnings.push("Dimensiones no encontradas");
    if(!weight)warnings.push("Peso no encontrado");
    if(!description&&!reference)warnings.push(`Descripción y referencia no identificadas en la fila ${index+1}`);
    const residualDescription=description||reference||line.replace(/\d[\d.,\s]*(?:x|×|\*)\s*\d[\d.,\s]*(?:x|×|\*)\s*\d[\d.,\s]*(?:mm|cm|m|in|ft)?/i," ").trim()||null;
    references.push({
      descripcion:description||residualDescription,
      referencia:reference,
      cantidad:roundExtracted(qty),
      largo_cm:roundExtracted(dimensions?.[0]?.value),
      ancho_cm:roundExtracted(dimensions?.[1]?.value),
      alto_cm:roundExtracted(dimensions?.[2]?.value),
      volumen_m3:roundExtracted(volume),
      peso_kg:roundExtracted(weight?.value),
      bultos:roundExtracted(boxes),
      tipo_embalaje:/(pallet|palet|caja|crate|caj[oó]n|drum|tambor|crate)/i.exec(line)?.[1]||null,
      incompleta:Boolean(!weight||(!dimensions&&volume===null)||!description&&!reference),
      advertencias:warnings
    });
  });
  return {referencias:references,resumen:{total_referencias:references.length,referencias_incompletas:references.filter(item=>item.incompleta).length,unidades_detectadas_origen:[...units],notas_generales:references.length?["Se consolidaron las filas de texto aprovechables."]: [source.trim()?"No se identificaron datos aprovechables de carga en el texto.":"El contenido recibido está vacío."]}};
}

function matchHeaderCategory(tokenText){
  const rawClean = tokenText.trim().toLowerCase();
  const nToken = normHeader(tokenText);
  if(!nToken) return null;

  let bestMatch = { key: null, score: -Infinity, alias: "" };

  for(const def of PDF_HEADER_DEFINITIONS){
    for(const alias of def.aliases){
      const nAlias = normHeader(alias);
      if(!nAlias) continue;

      let score = 0;
      const isGenericAlias = ["gw","peso","weight","nw","net weight","gross weight","total"].includes(nAlias);
      if(nToken === nAlias) score = 200;
      else if(nAlias.length > 1 && (nToken.startsWith(nAlias) || nToken.endsWith(nAlias) || nToken.includes(nAlias))) score = 120;
      else if(alias.length === 1 && rawClean === alias.toLowerCase()) score = 50;
      else continue;

      if(/total/.test(alias.toLowerCase())) score += 80;
      if(/gross|net|weight|peso/.test(alias.toLowerCase())) score += 15;
      if(/\b(gw|peso|weight|nw)\b/i.test(alias.toLowerCase()) && !/total/.test(alias.toLowerCase())) score -= 60;
      if(isGenericAlias) score -= 50;
      score += nAlias.length;

      if(score > bestMatch.score){
        bestMatch = { key: def.key, score, alias };
      }
    }
  }

  return bestMatch.key ? bestMatch : null;
}

function findPdfMeasurement(text,names){
 const aliases=names.map(name=>normalizePdfText(name).replace(/\s+/g,"\\s*"));
 const match=new RegExp(`(?:${aliases.join("|")})[\\s.:=\\/-]*([0-9][0-9.,]*)\\s*(mm|cm|m|kg|lb|lbs|t|ton(?:eladas?)?)?`,"i").exec(text);
 return match?{value:parseNumber(match[1]),unit:(match[2]||"").toLowerCase()}:null;
}
function findPdfNumber(text,names){
 const measurement=findPdfMeasurement(text,names);
 return measurement?measurement.value:NaN;
}
function findPdfDimensions(text){
 if(!text||typeof text!=="string")return null;
 const match=/([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*(mm|cm|m)?(?:\/[^\s]+)?(?:\b|$)/i.exec(text);
 if(match){
  const rawL=parseNumber(match[1]), rawW=parseNumber(match[2]), rawH=parseNumber(match[3]);
  let unit=(match[4]||"").toLowerCase();
  if(!unit){
   const maxVal=Math.max(rawL,rawW,rawH);
   unit=maxVal>4?"cm":"m";
  }
  return {L:rawL,W:rawW,H:rawH,unit,index:match.index,end:match.index+match[0].length};
 }
 const labelled=/\b(?:largo|length|l)\s*:\s*([0-9][0-9.,]*)\s+(?:ancho|width|w|a)\s*:\s*([0-9][0-9.,]*)\s+(?:alto|height|h)\s*:\s*([0-9][0-9.,]*)\s*(mm|cm|m)?/i.exec(text);
 if(labelled){
  const rawL=parseNumber(labelled[1]), rawW=parseNumber(labelled[2]), rawH=parseNumber(labelled[3]);
  let unit=(labelled[4]||"").toLowerCase();
  if(!unit){
   const maxVal=Math.max(rawL,rawW,rawH);
   unit=maxVal>4?"cm":"m";
  }
  return {L:rawL,W:rawW,H:rawH,unit,index:labelled.index,end:labelled.index+labelled[0].length};
 }
 return null;
}
function convertPdfMeasurement(measurement,defaultUnit){
 if(!measurement||!Number.isFinite(measurement.value))return NaN;
 const unit=(measurement.unit||defaultUnit||"").toLowerCase();
 if(["mm"].includes(unit))return measurement.value/1000;
 if(["cm"].includes(unit))return measurement.value/100;
 if(["in","inch","pulgada","pulgadas"].includes(unit))return measurement.value*0.0254;
 if(["ft","pie","pies"].includes(unit))return measurement.value*0.3048;
 if(["yd","yarda","yardas"].includes(unit))return measurement.value*0.9144;
 if(["kg"].includes(unit))return measurement.value/1000;
 if(["g"].includes(unit))return measurement.value/1000000;
 if(["t","ton","tons","tonelada","toneladas"].includes(unit))return measurement.value;
 if(["lb","lbs"].includes(unit))return measurement.value*0.00045359237;
 return measurement.value;
}
function pdfRows(items){
 const groups=[];
 items.filter(item=>String(item.str||"").trim()).forEach(item=>{
  const x=Number(item.transform?.[4]||0), y=Number(item.transform?.[5]||0);
  const width=Number(item.width||(String(item.str).length*6));
  const group=groups.find(candidate=>Math.abs(candidate.y-y)<5.5);
  if(group){
    group.items.push({text:String(item.str).trim(),x,width});
  } else {
    groups.push({y,items:[{text:String(item.str).trim(),x,width}]});
  }
 });
 return groups.sort((a,b)=>b.y-a.y).map(group=>({
   y:group.y,
   items:group.items.sort((a,b)=>a.x-b.x),
   text:group.items.map(item=>item.text).join(" ").trim()
 })).filter(row=>row.text);
}
function pdfLines(items){return pdfRows(items).map(row=>row.text)}

function detectPdfTableColumns(headerRows){
  const combinedItems = [];
  headerRows.forEach(hr => combinedItems.push(...hr.items));
  combinedItems.sort((a, b) => a.x - b.x);

  const groupedItems = [];
  combinedItems.forEach(item => {
    const previous = groupedItems[groupedItems.length - 1];
    if(previous && Math.abs(previous.x - item.x) < 3){
      previous.text += " " + item.text;
      previous.width = Math.max(previous.width || 0, item.width || 0);
    }else{
      groupedItems.push({ ...item });
    }
  });

  const matchedColumns = [];
  const claimedIndices = new Set();

  for(let i = 0; i < groupedItems.length; i++){
    if(claimedIndices.has(i)) continue;
    const item = groupedItems[i];
    
    const directMatch = matchHeaderCategory(item.text);
    let key = directMatch?.key || null;
    let score = directMatch?.score ?? null;
    let spanCount = 1;

    if(key){
      claimedIndices.add(i);

      const fullHeaderText = item.text.toLowerCase();
      let explicitUnit = "";
      if(/\b(mm)\b/i.test(fullHeaderText)) explicitUnit = "mm";
      else if(/\b(cm)\b/i.test(fullHeaderText)) explicitUnit = "cm";
      else if(/\b(m|mts|metros)\b/i.test(fullHeaderText)) explicitUnit = "m";
      else if(/\b(t|ton|tons|toneladas)\b/i.test(fullHeaderText)) explicitUnit = "t";
      else if(/\b(kg|kgs|kilos)\b/i.test(fullHeaderText)) explicitUnit = "kg";
      else if(/\b(lb|lbs|libras)\b/i.test(fullHeaderText)) explicitUnit = "lb";

      matchedColumns.push({
        key,
        x: item.x,
        width: item.width || 40,
        unit: explicitUnit,
        rawText: item.text,
        score
      });
    }
  }

  // Disambiguate when multiple GW or NW columns exist (e.g. Total GW vs Unit GW).
  // Prefer explicit total labels and longer aliases over generic ones like "gw"/"peso"/"weight".
  const gwCols = matchedColumns.filter(c => c.key === "totalGw" || c.key === "gwUnit");
  if(gwCols.length > 1){
    const totalCandidates = gwCols.filter(c => /total|totale|totales|tot\b/i.test(c.rawText || ""));
    const totalCol = totalCandidates.length ? totalCandidates.sort((a, b) => a.x - b.x)[0] : gwCols.sort((a, b) => b.x - a.x)[0];
    const unitCol = gwCols.find(c => c !== totalCol) || gwCols.sort((a, b) => a.x - b.x)[0];
    if(totalCol && unitCol){
      totalCol.key = "totalGw";
      unitCol.key = "gwUnit";
    }
  }
  const nwCols = matchedColumns.filter(c => c.key === "totalNw" || c.key === "nwUnit");
  if(nwCols.length > 1){
    const totalCandidates = nwCols.filter(c => /total|totale|totales|tot\b/i.test(c.rawText || ""));
    const totalCol = totalCandidates.length ? totalCandidates.sort((a, b) => a.x - b.x)[0] : nwCols.sort((a, b) => b.x - a.x)[0];
    const unitCol = nwCols.find(c => c !== totalCol) || nwCols.sort((a, b) => a.x - b.x)[0];
    if(totalCol && unitCol){
      totalCol.key = "totalNw";
      unitCol.key = "nwUnit";
    }
  }

  const uniqueKeys = new Set(matchedColumns.map(c => c.key));
  const hasDesc = uniqueKeys.has("desc") || uniqueKeys.has("ref") || uniqueKeys.has("code");
  const hasQty = uniqueKeys.has("qty") || uniqueKeys.has("boxes");
  const hasDimOrWt = uniqueKeys.has("size") || uniqueKeys.has("len") || uniqueKeys.has("width") || uniqueKeys.has("height") || uniqueKeys.has("totalGw") || uniqueKeys.has("gwUnit");
  const hasWeightPair = uniqueKeys.has("totalGw") && uniqueKeys.has("gwUnit");
  const diagnosticColumns = matchedColumns.map(c => ({ key: c.key, rawText: c.rawText, score: c.score ?? null, x: c.x }));
  console.log("[detectPdfTableColumns] columns:", diagnosticColumns);

  if((uniqueKeys.size < 3 && !hasWeightPair) || !(hasWeightPair || (hasDesc && (hasQty || hasDimOrWt)))){
    console.log("[detectPdfTableColumns] rejected:", { uniqueKeys: [...uniqueKeys], hasDesc, hasQty, hasDimOrWt, hasWeightPair, columns: diagnosticColumns });
    return null;
  }

  matchedColumns.sort((a, b) => a.x - b.x);
  console.log("[detectPdfTableColumns] final columns:", matchedColumns.map(c => ({ key: c.key, rawText: c.rawText, score: c.score ?? null, x: c.x })));

  for(let i = 0; i < matchedColumns.length; i++){
    const curr = matchedColumns[i];
    const prev = i > 0 ? matchedColumns[i - 1] : null;
    const next = i < matchedColumns.length - 1 ? matchedColumns[i + 1] : null;

    curr.minX = prev ? (prev.x + curr.x) / 2 : 0;
    curr.maxX = next ? (curr.x + next.x) / 2 : Infinity;
  }

  return matchedColumns;
}

function extractCellFromRow(row, column){
  if(!column) return "";
  const cells = row.items.filter(item => item.x >= column.minX && item.x < column.maxX);
  return cells.map(c => stripPageMarkers(c.text)).join(" ").trim();
}

function pdfHierarchicalRecords(items){
  const groupMarkers=items.filter(item=>/^(?:pallet|box)$/i.test(stripPageMarkers(item.str||item.text||"").trim())).map(item=>({
    y:item.transform?.[5]??item.y,
    marker:stripPageMarkers(item.str||item.text||"").trim()
  })).sort((a,b)=>b.y-a.y);
  if(groupMarkers.length<2)return null;

  const numericItems=items.map(item=>({
    ...item,
    x:item.transform?.[4]??item.x,
    y:item.transform?.[5]??item.y,
    text:stripPageMarkers(item.str||item.text||"").trim()
  }));
  const nearValue=(label, tolerance=3)=>numericItems
    .filter(item=>item.x>label.x&&item.x-label.x<90&&Math.abs(item.y-label.y)<=tolerance&&/^[0-9][0-9.,]*$/.test(item.text))
    .sort((a,b)=>a.x-b.x)[0];
  const groups=groupMarkers.map((marker,index)=>{
    const labels=numericItems.filter(item=>item.y>=marker.y-18&&item.y<=marker.y+18);
    const findLabel=pattern=>labels.find(item=>pattern.test(item.text));
    const largeLabel=findLabel(/^large\s*:/i);
    const widthLabel=findLabel(/^width\s*:/i);
    const heightLabel=findLabel(/^height\s*:/i);
    const boxesLabel=findLabel(/^cajas\s*:/i);
    const values={
      L:largeLabel?parseNumber(nearValue(largeLabel)?.text):NaN,
      W:widthLabel?parseNumber(nearValue(widthLabel)?.text):NaN,
      H:heightLabel?parseNumber(nearValue(heightLabel)?.text):NaN,
      boxes:boxesLabel?parseNumber(numericItems.filter(item=>item.x>boxesLabel.x&&item.x<90&&Math.abs(item.y-boxesLabel.y)<=3&&/^[0-9][0-9.,]*$/.test(item.text)).sort((a,b)=>b.x-a.x)[0]?.text):NaN
    };
    console.log("[pdfHierarchicalRecords] group",{index:index+1,marker:marker.marker,dimensions:values});
    return {...marker,...values,nextY:groupMarkers[index+1]?.y??-Infinity};
  });

  const referenceItems=numericItems.filter(item=>item.x>=85&&item.x<=112&&/^\d{1,3}$/.test(item.text)&&Number(item.text)>=1&&Number(item.text)<=242)
    .sort((a,b)=>b.y-a.y);
  const uniqueReferences=[];
  const seen=new Set();
  referenceItems.forEach(item=>{
    const reference=Number(item.text);
    if(seen.has(reference))return;
    seen.add(reference);
    const group=groups.find(candidate=>candidate.y>item.y&&candidate.nextY<item.y);
    const sameLine=numericItems.filter(candidate=>Math.abs(candidate.y-item.y)<=3);
    const quantityItem=sameLine.find(candidate=>candidate.x>700&&/^\d/.test(candidate.text));
    const netItem=sameLine.find(candidate=>candidate.x>=620&&candidate.x<=700&&/^[0-9][0-9.,]*$/.test(candidate.text));
    const description=sameLine.filter(candidate=>candidate.x>=300&&candidate.x<620).map(candidate=>candidate.text).join(" ").trim();
    const code=sameLine.filter(candidate=>candidate.x>=210&&candidate.x<300).map(candidate=>candidate.text).join(" ").trim();
    const quantity=quantityItem?parseNumber(quantityItem.text):1;
    const netKg=netItem?parseNumber(netItem.text):NaN;
    uniqueReferences.push({
      desc:`${reference}${code||description?` - ${code||description}`:""}`,
      q:Number.isFinite(quantity)&&quantity>0?quantity:1,
      boxes:null,L:null,W:null,H:null,volume:null,
      wt:null,gw:null,nw:Number.isFinite(netKg)?netKg/1000:null,
      incomplete:true,apilable:true,acostarse:false,sobresalir:false,fragil:false,peligrosa:false,
      hierarchicalGroup:group?.marker||null
    });
  });
  if(uniqueReferences.length<20)return null;

  const rows=numericItems.map(item=>item.text).join(" ");
  const totalLabel=numericItems.filter(item=>/^totals?\s*:??$/i.test(item.text)).map(label=>({label,values:numericItems.filter(item=>Math.abs(item.y-label.y)<=4&&item.x>label.x&&/^[0-9][0-9.,]*$/.test(item.text)).sort((a,b)=>a.x-b.x)})).filter(candidate=>candidate.values.length>=5).at(-1);
  const totalValues=totalLabel?.values||[];
  const declared=totalValues.length>=5?{
    volume:parseHierarchicalTotal(totalValues[1].text),netVolume:parseHierarchicalTotal(totalValues[0].text),net:parseHierarchicalTotal(totalValues[2].text),gross:parseHierarchicalTotal(totalValues[3].text),quantity:parseHierarchicalTotal(totalValues[4].text),references:uniqueReferences.length
  }:{references:uniqueReferences.length};
  const packageMatch=/total\s*:\s*([0-9][0-9.,]*)\s+cajas?\s+o\s+bultos?/i.exec(rows);
  if(packageMatch)declared.boxes=parseNumber(packageMatch[1]);
  const area=groups.reduce((sum,group)=>sum+(Number.isFinite(group.L)&&Number.isFinite(group.W)?group.L/100*group.W/100:0),0);
  declared.area=area;
  console.log("[detectPdfHierarchicalPdf] detected",{groups:groups.length,references:uniqueReferences.length,declared,area:area.toFixed(2)});
  return {records:uniqueReferences,totals:declared,hierarchical:true};
}

function pdfTableRecords(items){
  const hierarchical=pdfHierarchicalRecords(items);
  if(hierarchical)return hierarchical;
  const rows = pdfRows(items);
  if(rows.length < 2) return { records: [], totals: {} };

  let bestHeaderIndex = -1;
  let detectedColumns = null;

  for(let i = 0; i < Math.min(rows.length - 1, 20); i++){
    const headerSignal=/(?:item|ítem|description|descripcion|reference|referencia|qty|quantity|cant\.?|unid\.?|dimensions|dimensiones|dimension|dim\.?|size|largo|ancho|alto|peso|weight)/i;
    if(!headerSignal.test(rows[i].text))continue;
    const headerRows=[];
    for(let next=Math.max(0,i-2);next<Math.min(rows.length,i+3);next++){
      if((next===i||!/\d/.test(rows[next].text))&&headerSignal.test(rows[next].text))headerRows.push(rows[next]);
    }
    const cols=detectPdfTableColumns(headerRows);

    if(cols){
      bestHeaderIndex = i;
      detectedColumns = cols;
      break;
    }
  }

  if(!detectedColumns || bestHeaderIndex < 0){
    return { records: [], totals: {} };
  }

  const colMap = {};
  detectedColumns.forEach(c => { colMap[c.key] = c; });

  const records = [];
  const startRowIdx = bestHeaderIndex + 1;
  const tableMinX = Math.min(...detectedColumns.map(column => column.minX));
  const tableMaxX = Math.max(...detectedColumns.map(column => column.maxX));
  const documentText = rows.map(r => r.text).join(" ");
  const packageCountMatch = /(?:embalajes?|packaging)\s*:\s*\(?\s*([0-9][0-9.,]*)/i.exec(documentText);
  const declaredPackageCount = packageCountMatch ? parseNumber(packageCountMatch[1]) : NaN;
  const summaryFooterPattern = /^(?:(?:\d+\s*[-.]?\s*)?(?:peso bruto|peso liquido|peso neto|peso total|volume?n total|volume?n|quant|cantidad|area de piso|referencias|total))\b/i;

  for(let r = startRowIdx; r < rows.length; r++){
    const row = rows[r];
    const normalized = normalizePdfText(row.text);

    if(summaryFooterPattern.test(normalized)) continue;
    if(/^(?:total|subtotal|totales|cantidad total|peso neto|peso bruto|volume total|volumen total|grand total|resumen)\b/i.test(normalized)) continue;
    if(detectPdfTableColumns([row])) continue;
    if(!/\d/.test(row.text)) continue;
    const hasTableCell = row.items.some(item => item.x >= tableMinX && item.x < tableMaxX && Boolean(stripPageMarkers(item.text)));
    if(!hasTableCell) continue;

    const totalGwCell = extractCellFromRow(row, colMap.totalGw);
    const gwUnitCell = extractCellFromRow(row, colMap.gwUnit);
    if(r < startRowIdx + 5) {
      console.log("[pdfTableRecords] row", { rowIndex: r, totalGw: totalGwCell, gwUnit: gwUnitCell, rawRow: row.text });
    }

    const descText = extractCellFromRow(row, colMap.desc);
    const refText = extractCellFromRow(row, colMap.ref);
    const codeText = extractCellFromRow(row, colMap.code);
    const description = [refText, descText].filter(Boolean).join(" - ") || descText || refText || codeText || `Ítem ${records.length + 1}`;

    const qtyVal = parseNumber(extractCellFromRow(row, colMap.qty));
    const rawBoxVal = parseNumber(extractCellFromRow(row, colMap.boxes));
    const boxVal = sanitizePdfPackageCount(rawBoxVal, Number.isFinite(declaredPackageCount) ? declaredPackageCount : qtyVal);
    const suspiciousBoxId=Number.isFinite(rawBoxVal)&&(rawBoxVal>9999 || rawBoxVal>=1000&&!Number.isFinite(qtyVal));
    const quantity = suspiciousBoxId ? 1 : Number.isFinite(qtyVal) && qtyVal > 0 ? qtyVal : boxVal;
    const boxes = boxVal;

    let L = NaN, W = NaN, H = NaN;
    const sizeStr = extractCellFromRow(row, colMap.size);
    if(sizeStr){
      const parsedDim = findPdfDimensions(sizeStr);
      if(parsedDim){
        L = convertPdfMeasurement({ value: parsedDim.L, unit: parsedDim.unit }, "cm");
        W = convertPdfMeasurement({ value: parsedDim.W, unit: parsedDim.unit }, "cm");
        H = convertPdfMeasurement({ value: parsedDim.H, unit: parsedDim.unit }, "cm");
      }
    }

    if(!Number.isFinite(L) || !Number.isFinite(W) || !Number.isFinite(H)){
      const rawL = parseNumber(extractCellFromRow(row, colMap.len));
      const rawW = parseNumber(extractCellFromRow(row, colMap.width));
      const rawH = parseNumber(extractCellFromRow(row, colMap.height));

      if(Number.isFinite(rawL) && Number.isFinite(rawW) && Number.isFinite(rawH)){
        const dimensionUnitText=extractCellFromRow(row,colMap.dimUnit).toLowerCase();
        const dimensionUnit=(dimensionUnitText.match(/mm|cm|m|in|inch|pulg(?:adas)?|ft|pies/i)||[])[0]||"";
        const unitL = colMap.len?.unit || dimensionUnit || (rawL > 4 ? "cm" : "m");
        const unitW = colMap.width?.unit || dimensionUnit || (rawW > 4 ? "cm" : "m");
        const unitH = colMap.height?.unit || dimensionUnit || (rawH > 4 ? "cm" : "m");

        L = convertPdfMeasurement({ value: rawL, unit: unitL }, "cm");
        W = convertPdfMeasurement({ value: rawW, unit: unitW }, "cm");
        H = convertPdfMeasurement({ value: rawH, unit: unitH }, "cm");
      }
    }

    const gwTotVal = parseNumber(extractCellFromRow(row, colMap.totalGw));
    const nwTotVal = parseNumber(extractCellFromRow(row, colMap.totalNw));
    const gwUnitVal = parseNumber(extractCellFromRow(row, colMap.gwUnit));
    const nwUnitVal = parseNumber(extractCellFromRow(row, colMap.nwUnit));

    const rowWeightUnit=(extractCellFromRow(row,colMap.weightUnit).match(/kg|kgs|lb|lbs|g|ton(?:eladas?)?|t/i)||[])[0]||"";
    const unitGW = colMap.totalGw?.unit || colMap.gwUnit?.unit || rowWeightUnit || "kg";
    const unitNW = colMap.totalNw?.unit || colMap.nwUnit?.unit || "kg";

    const toKg = (value, unit) => {
      if(!Number.isFinite(value)) return NaN;
      const normalizedUnit = String(unit || "kg").toLowerCase();
      if(normalizedUnit.startsWith("t")) return value * 1000;
      if(normalizedUnit.startsWith("lb")) return value * 0.45359237;
      return value;
    };

    const unitWeightIsPerItem=/unit|unitario|per unit|por unidad/i.test(colMap.gwUnit?.rawText||"");
    const rowGrossKg = Number.isFinite(gwTotVal) ? toKg(gwTotVal, unitGW)
      : Number.isFinite(gwUnitVal) ? toKg(gwUnitVal, unitGW) * (unitWeightIsPerItem ? quantity : boxes)
      : Number.isFinite(nwTotVal) ? toKg(nwTotVal, unitNW)
      : Number.isFinite(nwUnitVal) ? toKg(nwUnitVal, unitNW) * boxes
      : NaN;

    const rowNetKg = Number.isFinite(nwTotVal) ? toKg(nwTotVal, unitNW)
      : Number.isFinite(nwUnitVal) ? toKg(nwUnitVal, unitNW) * boxes
      : rowGrossKg;

    let grossKg = rowGrossKg;
    let netKg = rowNetKg;

    const cbmVal = parseNumber(extractCellFromRow(row, colMap.vol));
    const volume = Number.isFinite(cbmVal) && cbmVal > 0
      ? cbmVal
      : (Number.isFinite(L) && Number.isFinite(W) && Number.isFinite(H) ? L * W * H * boxes : NaN);

    const hasDimensions=Number.isFinite(L)&&Number.isFinite(W)&&Number.isFinite(H);
    const hasIdentity=Boolean(descText||refText||codeText);
    const hasLoadData=Boolean(Number.isFinite(grossKg)||Number.isFinite(volume)||Number.isFinite(L)||Number.isFinite(W)||Number.isFinite(H)||Number.isFinite(qtyVal)||Number.isFinite(boxVal));
    const secondaryRow=/^pallet\b|tipo de embalagem|nuestra ref|su ref|peso liquido un|peso bruto un|^cantidad$|^dimensiones$/i.test(normalized);
    if(!hasIdentity&&!hasLoadData)continue;
    if(secondaryRow&&!Number.isFinite(grossKg)&&!Number.isFinite(cbmVal))continue;
    if(colMap.size&&!hasDimensions)continue;

    records.push({
      desc: description,
      q: quantity,
      boxes: boxes,
      L: Number.isFinite(L)?Number(L.toFixed(4)):null,
      W: Number.isFinite(W)?Number(W.toFixed(4)):null,
      H: Number.isFinite(H)?Number(H.toFixed(4)):null,
      wt: Number.isFinite(grossKg)?(grossKg / 1000) / quantity:null,
      gw: Number.isFinite(grossKg)?(grossKg / 1000) / quantity:null,
      nw: Number.isFinite(netKg)?(netKg / 1000) / quantity:null,
      volume: Number.isFinite(volume)?Number(volume.toFixed(4)):null,
      incomplete:Boolean(!Number.isFinite(grossKg)||!Number.isFinite(volume)||!Number.isFinite(L)||!Number.isFinite(W)||!Number.isFinite(H)),
      apilable: true,
      acostarse: false,
      sobresalir: false,
      fragil: false,
      peligrosa: false
    });
  }

  const findTot = (aliases) => {
    const match = new RegExp(`(?:${aliases.join("|")})\\s*[:=]?\\s*([0-9][0-9.,]*)`, "i").exec(documentText);
    return match ? parseNumber(match[1]) : NaN;
  };

  const totals = {
    quantity: findTot(["cantidad total", "total quantity", "total pcs", "total piezas"]),
    boxes: findTot(["total de cajas", "total cajas", "total cartons", "total ctns", "total bultos"]),
    net: findTot(["peso neto total", "total nw", "peso neto"]),
    gross: findTot(["peso bruto total", "total gw", "peso bruto", "peso total"]),
    volume: findTot(["volumen total", "volume total", "total cbm", "total m3", "cubaje"])
  };

  return { records, totals };
}

function pdfPatternRecords(lines){
  const records = [];
  for(let i = 0; i < lines.length; i++){
    const line = lines[i];
    if(!line || !/\d/.test(line)) continue;
    if(/^(?:total|subtotal|fecha|invoice|pagina|page|telefono|tel|nit|direccion)\b/i.test(line)) continue;
    
    const dimMatch = /([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*(mm|cm|m)?(?:\/[^\s]+)?(?:\b|$)/i.exec(line);
    if(!dimMatch) continue;
    
    const rawL = parseNumber(dimMatch[1]);
    const rawW = parseNumber(dimMatch[2]);
    const rawH = parseNumber(dimMatch[3]);
    const explicitUnit = (dimMatch[4] || (Math.max(rawL, rawW, rawH) > 4 ? "cm" : "m")).toLowerCase();
    
    const L = explicitUnit === "mm" ? rawL / 1000 : explicitUnit === "cm" ? rawL / 100 : rawL;
    const W = explicitUnit === "mm" ? rawW / 1000 : explicitUnit === "cm" ? rawW / 100 : rawW;
    const H = explicitUnit === "mm" ? rawH / 1000 : explicitUnit === "cm" ? rawH / 100 : rawH;
    
    let grossKg = NaN;
    const afterDims = line.slice(dimMatch.index + dimMatch[0].length);
    const wtMatch = /(?:peso|weight|gw|gross|bruto)?[\s.:=-]*([0-9][0-9.,]*)\s*(kg|kgs|kilos|t|ton|tons|toneladas|lb|lbs|g)?/i.exec(afterDims)
      || /(?:peso|weight|gw|gross|bruto)[\s.:=-]*([0-9][0-9.,]*)\s*(kg|kgs|kilos|t|ton|tons|toneladas|lb|lbs|g)?/i.exec(line);
      
    if(wtMatch && Number.isFinite(parseNumber(wtMatch[1]))){
      const wtVal = parseNumber(wtMatch[1]);
      const unit = (wtMatch[2] || "kg").toLowerCase();
      grossKg = unit.startsWith("t") ? wtVal * 1000 : unit.startsWith("lb") ? wtVal * 0.453592 : wtVal;
    }
    
    let quantity = 1, boxes = 1;
    const beforeDims = line.slice(0, dimMatch.index);
    const qtyMatches = [...beforeDims.matchAll(/\b([0-9]+)\s*(?:und|unidades|units|pcs|piezas|cajas|boxes|ctns|bultos|pkgs)?\b/gi)];
    if(qtyMatches.length){
      const lastQ = parseInt(qtyMatches[qtyMatches.length - 1][1], 10);
      if(lastQ > 0 && lastQ < 100000){
        quantity = lastQ;
        boxes = lastQ;
      }
    }
    
    const desc = beforeDims.replace(/^[0-9.-]+\s*/, "").replace(/\b[0-9]+\s*(?:und|unidades|units|pcs|piezas|cajas|boxes|ctns|bultos|pkgs)?\s*$/i, "").trim() || `Ítem ${records.length + 1}`;
    const volume = L * W * H * boxes;
    
    if(Number.isFinite(grossKg) && Number.isFinite(volume) && volume > 0){
      records.push({
        desc,
        q: quantity,
        boxes,
        L: Number(L.toFixed(4)),
        W: Number(W.toFixed(4)),
        H: Number(H.toFixed(4)),
        wt: (grossKg / 1000) / quantity,
        gw: (grossKg / 1000) / quantity,
        nw: (grossKg / 1000) / quantity,
        volume: Number(volume.toFixed(4)),
        apilable: true,
        acostarse: false,
        sobresalir: false,
        fragil: false,
        peligrosa: false
      });
    }
  }
  return records;
}

function sanitizePdfPackageCount(value, quantity){
  if(!Number.isFinite(value)||value<=0)return Number.isFinite(quantity)&&quantity>0?quantity:1;
  if(value>9999 || (value>=1000 && (!Number.isFinite(quantity)||quantity<=0)))return 1;
  return value;
}

function pdfKeyValueRecord(text){
  const normalized = normalizePdfText(text);
  
  const descMatch = /(?:descripcion(?:\s+de(?:\s+la)?\s+carga)?|producto|mercancia|equipo|carga)[\s.:=-]+([^\n\r,;]+)/i.exec(text);
  const desc = descMatch ? descMatch[1].trim() : "Carga General";
  
  const qtyMatch = /(?:cantidad|unidades|piezas|bultos|cant)[\s.:=-]+([0-9]+)/i.exec(normalized);
  const q = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
  
  let L = NaN, W = NaN, H = NaN;
  const dimMatch = /([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*[x×*]\s*([0-9][0-9.,]*)\s*(mm|cm|m)?/i.exec(normalized);
  if(dimMatch){
    const rawL = parseNumber(dimMatch[1]);
    const rawW = parseNumber(dimMatch[2]);
    const rawH = parseNumber(dimMatch[3]);
    const unit = (dimMatch[4] || (Math.max(rawL, rawW, rawH) > 4 ? "cm" : "m")).toLowerCase();
    L = unit === "mm" ? rawL / 1000 : unit === "cm" ? rawL / 100 : rawL;
    W = unit === "mm" ? rawW / 1000 : unit === "cm" ? rawW / 100 : rawW;
    H = unit === "mm" ? rawH / 1000 : unit === "cm" ? rawH / 100 : rawH;
  } else {
    const lMatch = /(?:largo|longitud|length|l)[\s.:=-]+([0-9][0-9.,]*)\s*(mm|cm|m|mts|metros)?/i.exec(normalized);
    const wMatch = /(?:ancho|width|w|a)[\s.:=-]+([0-9][0-9.,]*)\s*(mm|cm|m|mts|metros)?/i.exec(normalized);
    const hMatch = /(?:alto|altura|height|h)[\s.:=-]+([0-9][0-9.,]*)\s*(mm|cm|m|mts|metros)?/i.exec(normalized);
    
    if(lMatch && wMatch && hMatch){
      const parseDim = (m) => {
        const val = parseNumber(m[1]);
        const u = (m[2] || (val > 4 ? "cm" : "m")).toLowerCase();
        return u === "mm" ? val / 1000 : u === "cm" ? val / 100 : val;
      };
      L = parseDim(lMatch);
      W = parseDim(wMatch);
      H = parseDim(hMatch);
    }
  }
  
  let grossKg = NaN;
  const wtMatch = /(?:peso|peso bruto|peso total|weight|gw|bruto)[\s.:=-]+([0-9][0-9.,]*)\s*(kg|kgs|kilos|t|ton|tons|toneladas|lb|lbs|g)?/i.exec(normalized);
  if(wtMatch){
    const wtVal = parseNumber(wtMatch[1]);
    const u = (wtMatch[2] || "kg").toLowerCase();
    grossKg = u.startsWith("t") ? wtVal * 1000 : u.startsWith("lb") ? wtVal * 0.453592 : wtVal;
  }
  
  if(Number.isFinite(L) && Number.isFinite(W) && Number.isFinite(H) && Number.isFinite(grossKg)){
    const volume = L * W * H * q;
    return {
      desc,
      q,
      boxes: q,
      L: Number(L.toFixed(4)),
      W: Number(W.toFixed(4)),
      H: Number(H.toFixed(4)),
      wt: (grossKg / 1000) / q,
      gw: (grossKg / 1000) / q,
      nw: (grossKg / 1000) / q,
      volume: Number(volume.toFixed(4)),
      apilable: true,
      acostarse: false,
      sobresalir: false,
      fragil: false,
      peligrosa: false
    };
  }
  return null;
}

function pdfTotals(text){
 const find=(aliases)=>{const match=new RegExp(`(?:${aliases.join("|")})\\s*[:=]?\\s*([0-9][0-9.,]*)\\s*(kg|cbm|m3|m³|pcs|piezas|cajas)?`,"i").exec(text);return match?parseNumber(match[1]):NaN};
 return {quantity:find(["cantidad total","total quantity","total pcs","quant\\.? de peças"]),boxes:find(["total de cajas","total cajas","total cartons","total ctns","quant\\.? de caixas"]),net:find(["peso neto total","total nw","peso líquido","peso liquido","peso neto"]),gross:find(["peso bruto total","total gw","peso bruto"]),volume:find(["volumen total","volume total","total cbm","volume?n total"])};
}

function pdfSummaryTotals(items){
 const rows=pdfRows(items), result={};
 const labels=[
  {key:"gross",pattern:/(?:\d+\s*[-.]?\s*)?peso bruto(?: total)?/i},
  {key:"net",pattern:/(?:\d+\s*[-.]?\s*)?peso (?:l[ií]quido|neto)(?: total)?/i},
  {key:"volume",pattern:/(?:\d+\s*[-.]?\s*)?volume?n total/i},
  {key:"boxes",pattern:/(?:\d+\s*[-.]?\s*)?quant\.? de caixas|(?:\d+\s*[-.]?\s*)?cantidad total de cajas/i}
 ];
 rows.forEach((row,index)=>row.items.forEach(label=>{
  const match=labels.find(candidate=>candidate.pattern.test(label.text));
  if(!match||Number.isFinite(result[match.key]))return;
  const below=rows.slice(index+1).find(candidate=>candidate.y<row.y&&candidate.y>row.y-35);
  const value=below?.items.filter(item=>item.x>=label.x-12&&item.x<=label.x+Math.max(label.width||0,80)+12).map(item=>parseNumber(item.text)).find(Number.isFinite);
  if(Number.isFinite(value))result[match.key]=value;
 }));
 return result;
}

function comparePdfTotals(expected,actual){
 const checks=[
  ["cantidad",expected.quantity,actual.quantity,0],
  ["cajas",expected.boxes,actual.boxes,0],
  ["peso neto",expected.net,actual.net*1000,1.0],
  ["peso bruto",expected.gross,actual.weight*1000,1.0],
  ["volumen",expected.volume,actual.volume,0.1]
 ];
 return checks.filter(([,documentValue,calculated,tolerance])=>Number.isFinite(documentValue)&&Number.isFinite(calculated)&&Math.abs(documentValue-calculated)>tolerance).map(([name,documentValue,calculated,tolerance])=>({name,documentValue,calculated,tolerance,difference:calculated-documentValue}));
}

function pdfRecord(text,index){
 if(!text||typeof text!=="string")return null;
 const patternResults = pdfPatternRecords([text]);
 if(patternResults.length){
   return { record: patternResults[0], missing: [], warnings: [] };
 }
 const kv = pdfKeyValueRecord(text);
 if(kv){
   return { record: kv, missing: [], warnings: [] };
 }
 return null;
}

function prepareIncompleteImport(result){
 const record=result.record;
 $("pDesc").value=record.desc;
 $("pCant").value=Number.isFinite(record.q)?record.q:"";
 $("pL").value=Number.isFinite(record.L)?record.L:"";
 $("pA").value=Number.isFinite(record.W)?record.W:"";
 $("pH").value=Number.isFinite(record.H)?record.H:"";
 $("pPeso").value=Number.isFinite(record.wt)?record.wt:"";
 $("pUnidad").value="Metros";$("pPesoUnidad").value="toneladas";calcPiecePreview();
 $("excelHelp").textContent=`PDF leído parcialmente. Completa: ${result.missing.join(", ")}. Los valores encontrados quedaron en el formulario y no se agregó una referencia incompleta.`;
}

async function ocrPdfPages(documentPdf){
 if(typeof Tesseract==="undefined")return [];
 const lines=[];
 for(let pageNumber=1;pageNumber<=documentPdf.numPages;pageNumber++){
  const page=await documentPdf.getPage(pageNumber);
  const viewport=page.getViewport({scale:1.6});
  const canvas=document.createElement("canvas");
  canvas.width=viewport.width;canvas.height=viewport.height;
  await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
  const result=await Tesseract.recognize(canvas,"spa+eng");
  lines.push(...String(result.data.text||"").split(/\r?\n/).filter(Boolean));
 }
 return lines;
}

async function importarPDF(file){
 if(typeof pdfjsLib==="undefined")throw new Error("El lector PDF todavía no está disponible.");

 // 1. LIMPIEZA COMPLETA: Cada importación inicia 100% desde cero
 pieces = [];
 pdfTotalsOverride = null;
 lastAnalysis = null;
 editingIndex = -1;
 if($("pDesc")) $("pDesc").value = "";
 if($("pCant")) $("pCant").value = "";
 if($("pL")) $("pL").value = "";
 if($("pA")) $("pA").value = "";
 if($("pH")) $("pH").value = "";
 if($("pPeso")) $("pPeso").value = "";
 renderPieces();
 updateDashboard();

 if(!pdfjsLib.GlobalWorkerOptions.workerSrc){
  pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
 }
 const documentPdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const lines=[], items=[];
 for(let pageNumber=1;pageNumber<=documentPdf.numPages;pageNumber++){
  const page=await documentPdf.getPage(pageNumber);
  const content=await page.getTextContent();
  const pageOffset=(pageNumber-1)*2000;
  (content.items||[]).forEach(item=>{
   if(!String(item.str||"").trim())return;
   const transform=item.transform?[...item.transform]:[1,0,0,1,0,0];
   transform[5]=(transform[5]||0)-pageOffset;
   items.push({
    ...item,
    str:String(item.str||""),
    transform,
    pageNumber
   });
  });
  lines.push(...pdfLines(content.items));
 }

 let text=normalizePdfText(lines.join(" "));
 let table=pdfTableRecords(items);
 let records=table.records;
 let extractedTextResult=null;
 if(!records.length){
  extractedTextResult=extractPackingListText(lines.join("\n"));
  if(extractedTextResult.referencias.length)records=extractedReferencesToPieces(extractedTextResult);
 }

 // Strategy 2: Pattern-based extraction across lines
 if(!records.length && lines.length > 0){
  records = pdfPatternRecords(lines);
 }

 // Strategy 3: Key-Value Document extraction
 if(!records.length && text.length > 0){
  const kv = pdfKeyValueRecord(lines.join("\n"));
  if(kv) records = [kv];
 }

 // Strategy 4: OCR Fallback if document has no selectable text
 if(!records.length && (text.length < 30 || lines.length < 3)){
  $("excelHelp").textContent="PDF escaneado detectado. Intentando reconocer el texto con OCR, esto puede tardar unos segundos...";
  const ocrLines = await ocrPdfPages(documentPdf);
  if(ocrLines.length){
  lines.push(...ocrLines);
  text=normalizePdfText(lines.join(" "));
  extractedTextResult=extractPackingListText(ocrLines.join("\n"));
  records = extractedTextResult.referencias.length ? extractedReferencesToPieces(extractedTextResult) : pdfPatternRecords(ocrLines);
   if(!records.length){
    const kv = pdfKeyValueRecord(ocrLines.join("\n"));
    if(kv) records = [kv];
   }
  }
 }

 let importadas=0;
 if(records.length){
  pieces=[];
  records.forEach(record=>{
    pieces.push({...record,apilable:true,acostarse:false,sobresalir:false,fragil:false,peligrosa:false});
    importadas++;
  });
 }

 renderPieces();
 updateDashboard();

 const declaredTotals={...(table.totals||{}),...pdfSummaryTotals(items)};
 const importedTotals=records.reduce((a,record)=>{
   a.quantity+=Number(record.q)||0;
   a.boxes+=Number(record.boxes)||0;
   a.net+=(Number(record.nw)||0)*(Number(record.q)||0);
   a.weight+=(Number(record.gw??record.wt)||0)*(Number(record.q)||0);
   a.volume+=Number(record.volume)||0;
   return a;
 },{quantity:0,boxes:0,net:0,weight:0,volume:0});

 const mismatches=comparePdfTotals(declaredTotals,importedTotals);
 const severeMismatch=mismatches.some(item=>Math.abs(item.calculated-item.documentValue)>Math.max(Math.abs(item.documentValue),0.001));
  if(Number.isFinite(declaredTotals.volume)&&Math.abs(importedTotals.volume-declaredTotals.volume)<=0.01){
    pdfTotalsOverride={...(pdfTotalsOverride||{}),volume:declaredTotals.volume};
  }
 if(severeMismatch){
  pdfTotalsOverride={};
  if(Number.isFinite(declaredTotals.gross))pdfTotalsOverride.weight=declaredTotals.gross/1000;
  if(Number.isFinite(declaredTotals.net))pdfTotalsOverride.net=declaredTotals.net/1000;
  if(Number.isFinite(declaredTotals.volume))pdfTotalsOverride.volume=declaredTotals.volume;
  if(Number.isFinite(declaredTotals.area))pdfTotalsOverride.area=declaredTotals.area;
  renderPieces();
  updateDashboard();
 }

 // MODO DEBUG estructurado en consola
 const debugTable = [
   { "Métrica": "Referencias", "Declarado PDF": Number.isFinite(declaredTotals.boxes) ? declaredTotals.boxes : "-", "Calculado": importadas, "Diferencia": Number.isFinite(declaredTotals.boxes) ? importadas-declaredTotals.boxes : "-", "Estado": Number.isFinite(declaredTotals.boxes)&&importadas!==declaredTotals.boxes ? "REVISAR" : "OK" },
    { "Métrica": "Piezas (Und)", "Declarado PDF": declaredTotals.quantity ?? "N/D", "Calculado": importedTotals.quantity, "Diferencia": Number.isFinite(declaredTotals.quantity) ? (importedTotals.quantity - declaredTotals.quantity) : "-", "Estado": (!Number.isFinite(declaredTotals.quantity) || importedTotals.quantity === declaredTotals.quantity) ? "OK" : "REVISAR" },
    { "Métrica": "Cajas / Bultos", "Declarado PDF": declaredTotals.boxes ?? "N/D", "Calculado": importedTotals.boxes, "Diferencia": Number.isFinite(declaredTotals.boxes) ? (importedTotals.boxes - declaredTotals.boxes) : "-", "Estado": (!Number.isFinite(declaredTotals.boxes) || importedTotals.boxes === declaredTotals.boxes) ? "OK" : "REVISAR" },
    { "Métrica": "Peso Neto (kg)", "Declarado PDF": declaredTotals.net ? declaredTotals.net.toFixed(2) : "N/D", "Calculado": (importedTotals.net * 1000).toFixed(2), "Diferencia": Number.isFinite(declaredTotals.net) ? ((importedTotals.net * 1000) - declaredTotals.net).toFixed(2) + " kg" : "-", "Estado": (!Number.isFinite(declaredTotals.net) || Math.abs((importedTotals.net * 1000) - declaredTotals.net) <= 1.0) ? "OK" : "REVISAR" },
    { "Métrica": "Peso Bruto (kg)", "Declarado PDF": declaredTotals.gross ? declaredTotals.gross.toFixed(2) : "N/D", "Calculado": (importedTotals.weight * 1000).toFixed(2), "Diferencia": Number.isFinite(declaredTotals.gross) ? ((importedTotals.weight * 1000) - declaredTotals.gross).toFixed(2) + " kg" : "-", "Estado": (!Number.isFinite(declaredTotals.gross) || Math.abs((importedTotals.weight * 1000) - declaredTotals.gross) <= 1.0) ? "OK" : "REVISAR" },
    { "Métrica": "Volumen (m³)", "Declarado PDF": declaredTotals.volume ? declaredTotals.volume.toFixed(2) : "N/D", "Calculado": importedTotals.volume.toFixed(2), "Diferencia": Number.isFinite(declaredTotals.volume) ? (importedTotals.volume - declaredTotals.volume).toFixed(2) + " m³" : "-", "Estado": (!Number.isFinite(declaredTotals.volume) || Math.abs(importedTotals.volume - declaredTotals.volume) <= 0.1) ? "OK" : "REVISAR" }
 ];

 console.group(`🔍 [DEBUG PDF] Archivo: ${file.name}`);
 console.table(debugTable);
 console.groupEnd();

 if(importadas){
  if(mismatches.length){
    alert(`Alerta: los datos calculados no coinciden con los totales del PDF (${mismatches.map(item=>`${item.name}: ${item.difference>0?"+":""}${item.difference.toFixed(2)}`).join(", ")}). ${severeMismatch?"Se mostrará el total declarado por el documento.":"Se conservaron los datos individuales extraídos."}`);
  }
  const shownTotals=totals();
  const statusMsg = `PDF "${file.name}" procesado: ${importadas} ref(s) | ${Number.isFinite(declaredTotals.boxes)?declaredTotals.boxes:shownTotals.boxes} cajas | ${(shownTotals.weight).toFixed(5)} t (${(shownTotals.weight*1000).toFixed(2)} kg) | ${shownTotals.volume.toFixed(3)} m³${severeMismatch?" | tomado del total declarado en el documento":""}`;
  $("excelHelp").textContent = statusMsg;
  alert(statusMsg);
 } else {
  const isScanned = (!text || text.length < 30) && !lines.length;
  const msg = isScanned
    ? "El PDF parece ser un documento escaneado o imagen sin capa de texto seleccionable. Ingresa los datos manualmente o conviértelo a un PDF digital."
    : "No pudimos identificar tablas de carga con dimensiones (Largo x Ancho x Alto) y pesos en el archivo. Verifica el formato del PDF o ingresa las piezas manualmente.";
  $("excelHelp").textContent = msg;
  alert(msg);
 }
}
function importarArchivo(evt){
 const file=evt.target.files[0]; if(!file)return;
 if(file.name.toLowerCase().endsWith(".pdf")){importarPDF(file).catch(()=>alert("No pudimos leer el PDF. Verifica que contenga texto seleccionable y datos de dimensiones, peso y cantidad."));evt.target.value="";return}
 importarExcel(evt);
}
function importarExcel(evt){
 const file=evt.target.files[0]; if(!file)return;
 const reader=new FileReader();
 reader.onload=function(e){
  try{
    const data=new Uint8Array(e.target.result);
    const wb=XLSX.read(data,{type:"array"});
    const aliases=["largo","long","length","longitud","ancho","width","wide","alto","height","altura","peso","weight","kg","cantidad","qty","quantity","unidades","cant","cajas","ctns","cartons","size","dimension","dimensiones","cbm","gw","nw"];
    
    // Find best sheet
    let bestSheet=wb.Sheets[wb.SheetNames[0]];
    let bestMatrix=[];
    let bestScore=-1;
    for(const sName of wb.SheetNames){
      const currentSheet=wb.Sheets[sName];
      const currentMatrix=XLSX.utils.sheet_to_json(currentSheet,{header:1,defval:""});
      const score=currentMatrix.slice(0,25).reduce((acc,row)=>acc+row.filter(cell=>aliases.some(alias=>normHeader(cell).includes(normHeader(alias)))).length,0);
      if(score>bestScore){bestScore=score;bestSheet=currentSheet;bestMatrix=currentMatrix;}
    }
    const matrix=bestMatrix;
    if(!matrix.length){alert("El archivo no tiene hojas con datos tabulares.");return;}
    
    const headerIndex=matrix.slice(0,25).reduce((best,row,index)=>{const score=row.filter(cell=>aliases.some(alias=>normHeader(cell).includes(normHeader(alias)))).length;return score>best.score?{index,score}:best},{index:0,score:0}).index;
    const headers=matrix[headerIndex]||[];
    const headerText=headers.map(String).join(" ");
    const rows=matrix.slice(headerIndex+1).filter(row=>row.some(value=>String(value).trim()!=="")).map(row=>Object.fromEntries(headers.map((header,index)=>[header,row[index]??""])));
    if(!rows.length){alert("El archivo no contiene filas de datos.");return;}
    
    let importadas=0, omitidas=0, faltantes={largo:0,ancho:0,alto:0,peso:0,cantidad:0};
    pieces=[];
    rows.forEach(row=>{
      const keys={}; Object.keys(row).forEach(k=>keys[normHeader(k)]=row[k]);
      const get=(...names)=>importValue(keys,names);
      
      const descVal=get("descripcion","referencia","item","producto","description","nombre","material","codigo","code","detalle");
      const desc=descVal?String(descVal).trim():`Ítem ${pieces.length+importadas+1}`;
      
      // Skip summary / total rows
      if(/^(?:total|subtotal|totales|suma|sum|resumen)\b/i.test(normHeader(desc))||/^(?:total|subtotal)\b/i.test(normHeader(Object.values(row)[0])))return;
      
      const cantValue=parseNumber(get("cantidad","cant","und","unidades","units","quantity","qty","pcs","piezas"));
      const boxesValue=parseNumber(get("cajas","cartons","ctns","boxes","bultos","paquetes"));
      const cant=Number.isFinite(cantValue)&&cantValue>0?cantValue:Number.isFinite(boxesValue)&&boxesValue>0?boxesValue:1;
      const boxCount=Number.isFinite(boxesValue)&&boxesValue>0?boxesValue:Number.isFinite(cantValue)&&cantValue>0?cantValue:1;
      
      let L=parseNumber(get("largo","long","longitud","length","l"));
      let W=parseNumber(get("ancho","width","wide","w","a"));
      let H=parseNumber(get("alto","altura","height","h"));
      
      // Check combined dimensions if individual columns are missing
      if(!Number.isFinite(L)||!Number.isFinite(W)||!Number.isFinite(H)){
        const dimStr=String(get("dimensiones","dimension","size","medidas","medida","tamano","lxwxh","sizecbm","cbm")||"");
        const parsedDims=findPdfDimensions(dimStr);
        if(parsedDims){
          L=parsedDims.L;
          W=parsedDims.W;
          H=parsedDims.H;
        }
      }
      
      // Weights
      const gwTotal=parseNumber(get("pesobrutototal","totalgw","grosstotal","gwtotal","totalweight","pesototal"));
      const nwTotal=parseNumber(get("pesonetototal","totalnw","nettotal","nwtotal"));
      const gwUnit=parseNumber(get("pesobruto","grossweight","gw","pesounitario","pesou","peso","weight","kg","kilos"));
      const nwUnit=parseNumber(get("pesoneto","netweight","nw"));
      
const totalByWeightColumn = findBestHeaderValue(keys, ["total gw","total gross weight","total weight","peso bruto total","gw total","peso total","total weight","gross weight"], { preferTotal: true });
      const unitByWeightColumn = findBestHeaderValue(keys, ["gw","gross weight","peso bruto","peso unitario","peso por caja","gw per ctn","gw per box","unit gross weight"], { preferTotal: false });
      const totalByNetColumn = findBestHeaderValue(keys, ["total nw","total net weight","peso neto total","nw total","net weight"], { preferTotal: true });
      const unitByNetColumn = findBestHeaderValue(keys, ["nw","net weight","peso neto","peso neto unitario","unit net weight"], { preferTotal: false });

      let pesoTotalKg = Number.isFinite(totalByWeightColumn) ? totalByWeightColumn
        : Number.isFinite(unitByWeightColumn) ? unitByWeightColumn * (Number.isFinite(boxesValue) ? boxesValue : cant)
        : Number.isFinite(totalByNetColumn) ? totalByNetColumn
        : Number.isFinite(unitByNetColumn) ? unitByNetColumn * (Number.isFinite(boxesValue) ? boxesValue : cant)
        : Number.isFinite(gwTotal) ? gwTotal
        : Number.isFinite(gwUnit) ? gwUnit * (Number.isFinite(boxesValue) ? boxesValue : cant)
        : Number.isFinite(nwTotal) ? nwTotal
        : Number.isFinite(nwUnit) ? nwUnit * (Number.isFinite(boxesValue) ? boxesValue : cant)
        : NaN;
      
      const unidad=String(get("unidad","unidadmedida","unidaddemedida","dimensionunit")||(/\bmm\b/i.test(headerText)?"mm":/\bmetros?\b|\(m\)/i.test(headerText)?"m":"cm")).toLowerCase();
      const unidadPeso=String(get("unidadpeso","unidaddepeso","undpeso","weightunit")||(/\blb?s\b/i.test(headerText)?"lb":/\bton(?:eladas?)?\b/i.test(headerText)?"t":"kg")).toLowerCase();
      
      const missing=[!L&&"largo",!W&&"ancho",!H&&"alto",!Number.isFinite(pesoTotalKg)&&"peso"].filter(Boolean);
      if(missing.length){missing.forEach(field=>faltantes[field]++);omitidas++;return;}
      
      if(unidad.startsWith("mm")){L/=1000;W/=1000;H/=1000;}else if(!unidad.startsWith("m")){L/=100;W/=100;H/=100;}
      if(unidadPeso.startsWith("lb")){pesoTotalKg*=0.00045359237*1000;}else if(unidadPeso.startsWith("t")){pesoTotalKg*=1000;}
      
      const wtUnitTonnes=(pesoTotalKg/1000)/cant;
      const cbmVal=parseNumber(get("cbm","volumen","volume","m3","m³"));
      const vol=Number.isFinite(cbmVal)?cbmVal:(L*W*H*boxCount);
      
      pieces.push({
        desc:String(desc),
        q:cant,
        L:Number(L.toFixed(4)),
        W:Number(W.toFixed(4)),
        H:Number(H.toFixed(4)),
        wt:wtUnitTonnes,
        nw:wtUnitTonnes,
        gw:wtUnitTonnes,
        boxes:boxCount,
        volume:Number(vol.toFixed(4)),
        apilable:true,
        acostarse:false,
        sobresalir:false,
        fragil:false,
        peligrosa:false
      });
      importadas++;
    });
    
    renderPieces();
    updateDashboard();
    const missingSummary=Object.entries(faltantes).filter(([,count])=>count).map(([field,count])=>`${field}: ${count}`).join(", ");
    const warning=matrix[headerIndex].some(cell=>/cm|mm|kg/i.test(String(cell)))?"":" Unidades asumidas: cm y kg.";
    alert(`Importación completa: ${importadas} referencia(s) agregada(s).${warning}${omitidas?` ${omitidas} fila(s) omitida(s) por datos incompletos${missingSummary?` (${missingSummary})`:""}.`:""}`);
  }catch(err){
    alert("No pudimos leer el archivo. Verifica que sea un Excel o CSV válido y que incluya largo, ancho, alto y peso.");
  }
  evt.target.value="";
 };
 reader.readAsArrayBuffer(file);
}

function specialCompatibility(v,t){
 const reqClosed=$("cerrado")?.value==="Sí", reqTemp=$("temp")?.value==="Sí", reqDanger=$("peligrosa")?.value==="Sí"||pieces.some(p=>p.peligrosa), reqProject=$("tipoCarga")?.value==="Proyecto"||$("equipo")?.value!=="No", over=$("sobredim")?.value==="Sí";
 if(reqTemp && !/refrigerado/i.test(v.body) && v.name!=="Furgón refrigerado") return false;
 if(reqClosed && !/Furgón|furgón|carpado/i.test(v.body)) return false;
 if(reqDanger && /4 x 4|Van|NHR|NPR/i.test(v.name)) return false;
 if(over && !/cama|modular|plataforma|extensible|mula|Minimula/i.test(v.name)) return false;
 if(reqProject && !/plataforma|cama|modular|Mula|Minimula|Doble troque/i.test(v.name)) return false;
 if(!over && !reqProject && /cama baja|modular|tolva|tanque|niñera/i.test(v.name+" "+v.body)) return false;
 return true;
}
function containerCompatibility(v){
 if($("tipoCarga")?.value!=="Contenedor") return true;
 const tam=$("contTam")?.value;
 if(tam==="20'" && !/20|Minimula|Mula|Doble|600/i.test(v.cargo+" "+v.name)) return false;
 if((tam==="40'"||tam==="40 HC") && !/40|Mula|portacontenedor/i.test(v.cargo+" "+v.name)) return false;
 return /Portacontenedor|Minimula|Mula|Doble troque|600 sencillo/i.test(v.name+" "+v.body);
}
function analyzeVehicle(v,t,margin=0.10){
 if(v.cap===null||v.cap<=0)return null;
 const needWeight=t.weight*(1+margin);
 const needVol=t.volume*(1+margin);
 const dimsOk=v.L===null|| (t.maxL<=v.L && t.maxW<=v.W && t.maxH<=v.H);
 const weightOk=needWeight<=v.cap;
 const volOk=v.vol===null || needVol<=v.vol;
 const special=specialCompatibility(v,t)&&containerCompatibility(v);
 const maxStackH=Math.max(1.0,Math.min(v.H||2.0,1.8));
 const effectiveArea=pieces.some(p=>p.apilable)||pieces.every(p=>p.H<0.8)?(needVol/maxStackH):(t.area*(1+margin));
 const areaApprox=v.L&&v.W?effectiveArea<=(v.L*v.W):true;
 const compatible=weightOk&&volOk&&dimsOk&&special&&areaApprox;
 const wOcc=v.cap? t.weight/v.cap*100:0;
 const vOcc=v.vol? t.volume/v.vol*100:0;
 const score=compatible ? (v.cap*0.45+(v.vol||999)*0.25+(v.L||99)*(v.W||99)*0.15+vOcc*0.1+wOcc*0.05) : Infinity;
 return {v,compatible,wOcc,vOcc,dimsOk,weightOk,volOk,special,areaApprox,score};
}
function analyzeSet(){
 const t=totals(); if(!hasCargo())return {t,options:[],best:null};
 const normal=vehicles.map(v=>analyzeVehicle(v,t)).filter(Boolean);
 normal.sort((a,b)=>a.score-b.score);
 const compatible=normal.filter(x=>x.compatible);
 if(compatible.length)return {t,options:normal,best:compatible[0]};
 // If no single vehicle, find minimum combination using repeated vehicles for scalable standard vehicles.
 const candidates=vehicles.filter(v=>v.cap>0 && v.name!=="Cama baja / tolva" && v.name!=="Modular").map(v=>{
   const byWeight=Math.ceil(t.weight/(v.cap*0.9));
   const byVol=v.vol?Math.ceil(t.volume/(v.vol*0.9)):1;
   const count=Math.max(1,byWeight,byVol);
   const dims=v.L===null || (t.maxL<=v.L&&t.maxW<=v.W&&t.maxH<=v.H);
   const special=specialCompatibility(v,t)&&containerCompatibility(v);
   return {v,count,dims,special,wOcc:(t.weight/(v.cap*count))*100,vOcc:v.vol?(t.volume/(v.vol*count))*100:0,score:count*100+v.cap+(v.vol||0)/10};
 }).filter(x=>x.dims&&x.special).sort((a,b)=>a.score-b.score);
 return {t,options:normal,best:candidates.length?{...candidates[0],multi:true}:null};
}
function validation(a){
 const errs=[], warns=[];
 if(!a.best){errs.push("No existe un vehículo compatible con los datos registrados. Revisa peso, dimensiones, volumen y condiciones especiales.");return {level:"red",errs,warns}}
 if(a.best.multi) warns.push(`Se requieren aproximadamente ${a.best.count} unidades de ${a.best.v.name}. La combinación debe confirmarse con el transportador.`);
 const t=a.t, v=a.best.v;
 const wo=a.best.wOcc, vo=a.best.vOcc;
 if(wo>90||vo>90)warns.push("Ocupación superior al 90 %: se recomienda confirmar distribución y disponibilidad.");
 if(wo>100||vo>100)errs.push("La carga supera la capacidad estimada de la combinación.");
 if(!a.best.dimsOk)errs.push("Una o más piezas exceden las dimensiones internas disponibles.");
 if(t.area>0 && v.L&&v.W && t.area/(v.L*v.W)>1.0 && pieces.some(p=>!p.apilable && p.H>=0.8))warns.push("El área de piso está cercana al límite. El cubicaje por sí solo no garantiza que los pallets/piezas quepan.");
 if(pieces.some(p=>!p.apilable && p.H>=0.8))warns.push("Hay carga no apilable de gran altura. La distribución real del piso debe validarse.");
 if($("sobredim")?.value==="Sí")warns.push("Carga sobredimensionada: puede requerir permisos, escolta o revisión especializada.");
 if($("peligrosa")?.value==="Sí"||pieces.some(p=>p.peligrosa))warns.push("Mercancía peligrosa: validar ONU, clase, documentación y vehículo autorizado.");
 if($("temp")?.value==="Sí")warns.push("Se requiere control de temperatura. Confirmar rango y equipo refrigerado.");
 return {level:errs.length?"red":warns.length?"yellow":"green",errs,warns}
}
function analizar(){
 const currentTotals=totals();
 console.info("Analizador recibe",{referencias:pieces.length,unidades:pieces.reduce((sum,p)=>sum+(Number(p.q)||0),0),cajas:pieces.reduce((sum,p)=>sum+(Number(p.boxes)||0),0),pesoNetoKg:(currentTotals.net||0)*1000,pesoBrutoKg:(currentTotals.weight||0)*1000,volumenM3:currentTotals.volume||0});
 const a=analyzeSet(); lastAnalysis=a; const val=a.best?validation(a):{level:"blue",errs:["Agrega al menos una pieza."],warns:[]};
 $("alerts").innerHTML=[...val.errs.map(x=>`<div class="alert red">⚠ ${esc(x)}</div>`),...val.warns.map(x=>`<div class="alert yellow">⚠ ${esc(x)}</div>`),(!val.errs.length&&!val.warns.length?`<div class="alert green">✓ La combinación cumple peso, volumen, dimensiones y condiciones registradas.</div>`:"")].join("");
 renderMeasuresTable();
 if(!a.best){$("recommendation").innerHTML="";return}
 const b=a.best,v=b.v, badge=val.level;
 $("recommendation").innerHTML=`<div class="recommend">
 <div class="rec-top"><div><div class="eyebrow">RECOMENDACIÓN ${b.multi?"DE COMBINACIÓN":"PRINCIPAL"}</div><div class="rec-name">${esc(v.name)} ${b.multi?`× ${b.count}`:"× 1"}</div><div style="color:#9ba8b9;font-size:12px;margin-top:4px">${esc(v.body)} · ${esc(v.cargo)}</div></div><span class="badge ${badge}">${badge==="green"?"VERDE":badge==="yellow"?"AMARILLO":"ROJO"}</span></div>
 <div class="bars"><div class="barline"><span>Ocupación peso</span><div class="bar"><div class="fill" style="width:${Math.min(100,b.wOcc)}%"></div></div><b>${b.wOcc.toFixed(1)}%</b></div><div class="barline"><span>Ocupación volumen</span><div class="bar"><div class="fill" style="width:${Math.min(100,b.vOcc||0)}%"></div></div><b>${(b.vOcc||0).toFixed(1)}%</b></div></div>
 <div class="rec-grid"><div class="rec-stat"><span>Peso bruto</span><b>${(a.t.weight*1000).toFixed(2)} kg</b></div><div class="rec-stat"><span>Peso neto</span><b>${((a.t.net||0)*1000).toFixed(2)} kg</b></div><div class="rec-stat"><span>Volumen total</span><b>${a.t.volume.toFixed(2)} m³</b></div><div class="rec-stat"><span>Referencias</span><b>${a.t.refs}</b></div><div class="rec-stat"><span>Dimensión máx.</span><b>${a.t.maxL.toFixed(2)} × ${a.t.maxW.toFixed(2)} × ${a.t.maxH.toFixed(2)} m</b></div></div>
 <div class="alt-list"><b style="font-size:12px;color:#b9c3d1">Alternativas</b>${a.options.filter(x=>x.compatible&&x.v.name!==v.name).slice(0,3).map(x=>`<div class="alt"><strong>${esc(x.v.name)}</strong><span>1 vehículo</span><span>${x.wOcc.toFixed(1)}% peso</span><span>${x.v.vol?x.vOcc.toFixed(1)+"% volumen":"Vol. ND"}</span></div>`).join("")||'<div class="alert blue">No hay otra alternativa individual que cumpla todos los criterios.</div>'}</div>
 </div>`;
 generarCotizacion();
}
function money(v){ if(isNaN(v))v=0; return "$ "+Number(v).toLocaleString("es-CO",{minimumFractionDigits:0,maximumFractionDigits:0}); }
function exportarExcel(){
 if(typeof XLSX==="undefined"){alert("No está disponible el exportador Excel.");return}
 const rows=isContainer()?[{
  Descripción:`Contenedor ${$("contTam").value}`,
  Cantidad:Math.max(1,num("contCant")),
  Largo:"",Ancho:"",Alto:"",
  Unidad:"m",
  Peso:(num("contMerc")+num("contTara"))*Math.max(1,num("contCant")),
  "Unidad de peso":"kg"
 }]:pieces.map(piece=>({
  Descripción:piece.desc,Cantidad:piece.q,Largo:piece.L,Ancho:piece.W,Alto:piece.H,
  Unidad:"m",Peso:(Number(piece.gw ?? piece.wt ?? 0) * Number(piece.q || 1) * 1000),"Unidad de peso":"kg"
 }));
 if(!rows.length){alert("No hay datos de carga para exportar.");return}
 const sheet=XLSX.utils.json_to_sheet(rows);
 const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,"Carga");
 XLSX.writeFile(workbook,"logitrading-carga.xlsx");
}
function generarCotizacion(guardar=false){
  console.log("🔵 generarCotizacion() llamada con guardar="+guardar);
  // Siempre recalculamos para que la cotización use los últimos datos ingresados.
  if(!hasCargo()){
    console.log("❌ No hay carga registrada");
    $("quote").innerHTML='<div class="empty">⚠ Completa los datos básicos de la carga antes de generar la cotización.</div>';
    return;
  }
  const a=analyzeSet();
  lastAnalysis=a;
  if(!a.best){
    console.log("❌ No se encontró vehículo compatible");
    $("quote").innerHTML='<div class="alert red">⚠ No se encontró un vehículo compatible. Revisa peso, volumen, dimensiones y condiciones especiales.</div>';
    return;
  }
  console.log("✅ Vehículo encontrado:", a.best.v.name);
  const op=$("operacion").value, mod=$("modalidad").value, serv=$("servicio").value;
  const val=validation(a);
  const fecha=$("fecha").value ? new Date($("fecha").value).toLocaleString("es-CO") : "Pendiente";

  const venta=num("vVenta"), costo=num("vCosto"), sello=num("vSello"), devol=num("vDevolucion"), otros=num("vOtros");
  let utilidad=$("vUtilidad").value!==""?num("vUtilidad"):(venta-costo-sello-devol-otros);
  const totalCotizado = venta || (costo+sello+devol+otros+Math.max(0,utilidad));
  const margenPct = venta ? (utilidad/venta*100) : 0;

  $("quote").innerHTML=`<div class="quote-head executive-head"><div class="quote-brand"><img src="assets/logitrading-logo.png?v=4" alt="Logitrading" class="quote-logo"><div><div class="eyebrow">RESUMEN EJECUTIVO</div><h2>Cotización de transporte</h2><div class="quote-meta">${esc(op)} · ${esc(mod)} · ${esc(serv)} · ${esc(fecha)}</div></div></div><span class="badge ${val.level}">${val.level.toUpperCase()}</span></div>
  <div class="final-recommendation">
    <div class="final-rec-title"><span>VEHÍCULO RECOMENDADO</span><b>${val.level==="green"?"✓ MEJOR AJUSTE":val.level==="yellow"?"⚠ REVISAR ANTES DE COTIZAR":"✕ REVISIÓN NECESARIA"}</b></div>
    <div class="final-rec-body">
      <div class="final-rec-image">${vehicleSvg(a.best.v)}</div>
      <div class="final-rec-main">
        <div class="final-rec-name">${esc(a.best.v.name)} <small>× ${a.best.multi?a.best.count:1}</small></div>
        <div class="final-rec-meta">${esc(a.best.v.body)} · ${esc(a.best.v.cargo)}</div>
        <div class="final-rec-grid">
          <div><span>Capacidad útil</span><strong>${a.best.v.cap===null?"N/D":a.best.v.cap+" t"}</strong></div>
          <div><span>Volumen útil</span><strong>${a.best.v.vol===null?"N/D":a.best.v.vol+" m³"}</strong></div>
          <div><span>Ocupación peso</span><strong>${a.best.wOcc.toFixed(1)}%</strong></div>
          <div><span>Ocupación volumen</span><strong>${(a.best.vOcc||0).toFixed(1)}%</strong></div>
        </div>
      </div>
    </div>
  </div>
  <div class="quote-section"><div class="quote-section-title">Detalles del servicio</div><table class="service-details"><tr><th>Ruta</th><td>${esc($("origen").value||"Pendiente")} → ${esc($("destino").value||"Pendiente")}</td></tr><tr><th>Recogida</th><td>${esc($("recogida").value||"Pendiente")}</td></tr><tr><th>Destino</th><td>${esc($("destino").value||"Pendiente")}</td></tr><tr><th>Fecha requerida</th><td>${esc(fecha)}</td></tr><tr><th>Tipo de carga</th><td>${esc($("tipoCarga").value||"Pendiente")}</td></tr><tr><th>Carga</th><td>Peso bruto: ${(a.t.weight*1000).toFixed(2)} kg · Peso neto: ${((a.t.net||0)*1000).toFixed(2)} kg · ${a.t.volume.toFixed(2)} m³ · ${a.t.area.toFixed(2)} m² · ${pieces.length} referencias</td></tr><tr><th>Dimensión máxima</th><td>${a.t.maxL.toFixed(2)} × ${a.t.maxW.toFixed(2)} × ${a.t.maxH.toFixed(2)} m</td></tr><tr><th>Requerimientos</th><td>${requirements()}</td></tr></table></div>

  <div class="final-recommendation quote-values" style="margin-top:18px">
    <div class="final-rec-title"><span>VALORES DE LA COTIZACIÓN</span><b>${esc($("vObs").value||"")}</b></div>
    <table style="margin-top:0">
      <tr><th>Valor de venta (flete cliente)</th><td>${money(venta)}</td></tr>
      <tr><th>Costo transportador</th><td>${money(costo)}</td></tr>
      <tr><th>Sello satelital / seguridad</th><td>${money(sello)}</td></tr>
      <tr><th>Devolución de vacío</th><td>${money(devol)}</td></tr>
      <tr><th>Otros cargos</th><td>${money(otros)}</td></tr>
      <tr><th>Utilidad neta</th><td>${money(utilidad)} ${venta?`(${margenPct.toFixed(1)}% sobre venta)`:""}</td></tr>
      <tr class="quote-total"><th><b>TOTAL COTIZADO AL CLIENTE</b></th><td><b>${money(totalCotizado)}</b></td></tr>
    </table>
  </div>

  <div style="margin-top:13px;color:#8f9bad;font-size:11px">Nota comercial: recomendación preliminar. Confirmar vehículo real, disponibilidad, ruta, restricciones, distribución física, permisos y tarifa antes de emitir la oferta definitiva.</div>`;
  if(guardar){
    console.log("💾 Guardando cotización...");
    guardarCotizacion(a,totalCotizado);
  }
}
function imprimirCotizacion(){
  showPanel(7);
  generarCotizacion();
  setTimeout(()=>window.print(),150);
}
function requirements(){
 const r=[]; if($("cerrado").value==="Sí")r.push("carrocería cerrada"); if($("satelital").value==="Sí")r.push("sello satelital"); if($("escolta").value==="Sí")r.push("escolta"); if($("equipo").value!=="No")r.push($("equipo").value); if($("temp").value==="Sí")r.push("temperatura controlada"); if($("peligrosa").value==="Sí"||pieces.some(p=>p.peligrosa))r.push("mercancía peligrosa"); if($("sobredim").value==="Sí")r.push("sobredimensión"); return r.join(", ")||"Sin requerimientos especiales registrados";
}

function vehicleSvg(v){
  const n = (v.name||"").toLowerCase();
  let type = "truck";
  if(n.includes("4 x 4") || n.includes("van") || n.includes("nhr") || n.includes("npr") || n.includes("nqr")) type="light";
  else if(n.includes("turbo") || n.includes("600")) type="box";
  else if(n.includes("doble") || n.includes("sencillo")) type="medium";
  else if(n.includes("minimula") || n==="mula") type="semi";
  else if(n.includes("portacontenedor")) type="container";
  else if(n.includes("tanque") || n.includes("niñera")) type="tank";
  else if(n.includes("tolva")) type="hopper";
  else if(n.includes("cama baja") || n.includes("cama alta") || n.includes("plataforma") || n.includes("modular")) type="flat";
  else if(n.includes("refrigerado")) type="reefer";

  const id = ('veh'+Math.random().toString(36).slice(2,8));
  const colors = {
    light:['#f7fafc','#dbe7f3','#f59a2f'], box:['#eef3f8','#9eb2c8','#f59a2f'],
    medium:['#edf3f8','#7890aa','#f59a2f'], semi:['#f4f7fa','#647d97','#ff9d2e'],
    container:['#eaf2f8','#315b7a','#f59a2f'], tank:['#f2f5f8','#8a98a8','#f59a2f'],
    hopper:['#f1f5f8','#667b90','#f59a2f'], flat:['#f4f6f8','#60768c','#f59a2f'],
    reefer:['#ffffff','#c9d8e6','#37a7e8'], truck:['#f1f5f8','#71869a','#f59a2f']
  }[type];
  const [light, dark, accent] = colors;
  const bg = `url(#${id}bg)`;
  const wheel = (x,y,r=5)=>`<circle cx="${x}" cy="${y}" r="${r+2}" fill="#18212c" opacity=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="#111820" stroke="#e7edf3" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="2" fill="#8795a3"/>`;
  const cab = `<path d="M12 49h9l5-18q1-4 5-4h16v22h-4" fill="${dark}" stroke="#e7edf3" stroke-width="1.4"/>
    <path d="M27 31h14l4 14H25z" fill="url(#${id}glass)" stroke="#f6b35b" stroke-width="1.2"/>
    <path d="M29 33h10l2 9H27z" fill="#bfe4f5" opacity=".92"/>
    <path d="M16 48h6M47 48h7" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
    ${wheel(32,51,5)}${wheel(66,51,5)}`;
  let body='';
  if(type==='light') body=`<rect x="49" y="32" width="30" height="17" rx="3" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.4"/><path d="M53 35h22v11H53z" fill="#f7fbff" opacity=".22"/><path d="M52 48h25" stroke="${accent}" stroke-width="2"/>`;
  else if(type==='box') body=`<rect x="48" y="24" width="47" height="25" rx="3" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M53 28h37v17H53z" fill="#ffffff" opacity=".08"/><path d="M58 25v23M85 25v23" stroke="#ffffff" opacity=".16"/><path d="M52 47h38" stroke="${accent}" stroke-width="2"/>${wheel(57,51,5)}${wheel(86,51,5)}`;
  else if(type==='medium') body=`<rect x="48" y="28" width="52" height="21" rx="3" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M53 32h42v12H53z" fill="#ffffff" opacity=".08"/><path d="M61 29v19M88 29v19" stroke="#ffffff" opacity=".13"/><path d="M51 47h46" stroke="${accent}" stroke-width="2"/>${wheel(58,51,5)}${wheel(86,51,5)}${wheel(99,51,5)}`;
  else if(type==='semi') body=`<rect x="48" y="27" width="43" height="22" rx="3" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M92 32h13v17H92z" fill="${dark}" stroke="#e7edf3" stroke-width="1.3"/><path d="M53 31h33v14H53z" fill="#fff" opacity=".08"/><path d="M51 47h50" stroke="${accent}" stroke-width="2"/>${wheel(57,51,5)}${wheel(75,51,5)}${wheel(96,51,5)}${wheel(105,51,5)}`;
  else if(type==='container') body=`<rect x="48" y="25" width="56" height="24" rx="2" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M54 27v20M61 27v20M68 27v20M75 27v20M82 27v20M89 27v20M96 27v20" stroke="#ffffff" opacity=".18"/><rect x="78" y="30" width="19" height="9" rx="1" fill="#dbe8f1" opacity=".16"/><text x="87.5" y="37" text-anchor="middle" font-size="5" fill="#fff" opacity=".8" font-weight="700">20 / 40</text>${wheel(59,51,5)}${wheel(88,51,5)}${wheel(102,51,5)}`;
  else if(type==='tank') body=`<path d="M49 31Q72 21 98 31v10q-24 10-49 0z" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M55 33q18-6 37 0" fill="none" stroke="#fff" opacity=".22"/><path d="M51 47h46" stroke="${accent}" stroke-width="2"/>${wheel(58,51,5)}${wheel(87,51,5)}${wheel(101,51,5)}`;
  else if(type==='hopper') body=`<path d="M49 28h51l-8 21H57z" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M54 31h41" stroke="#fff" opacity=".18"/><path d="M58 47h38" stroke="${accent}" stroke-width="2"/>${wheel(60,51,5)}${wheel(89,51,5)}${wheel(101,51,5)}`;
  else if(type==='flat') body=`<rect x="48" y="41" width="57" height="8" rx="2" fill="url(#${id}body)" stroke="#e7edf3" stroke-width="1.5"/><path d="M53 40v-10h12v10M69 40V26h13v14M86 40v-7h12v7" fill="none" stroke="${accent}" stroke-width="2.2"/><path d="M52 44h50" stroke="#fff" opacity=".15"/>${wheel(58,51,5)}${wheel(88,51,5)}${wheel(101,51,5)}`;
  else if(type==='reefer') body=`<rect x="48" y="25" width="49" height="24" rx="3" fill="url(#${id}body)" stroke="#dbe5ee" stroke-width="1.5"/><rect x="52" y="29" width="40" height="15" rx="2" fill="#dff2fb"/><path d="M56 32h16M56 36h12" stroke="#70b9d8" stroke-width="1.2"/><text x="81" y="39" text-anchor="middle" font-size="5.2" fill="#25749c" font-weight="800">REEFER</text>${wheel(58,51,5)}${wheel(88,51,5)}${wheel(101,51,5)}`;
  return `<svg viewBox="0 0 118 62" role="img" aria-label="${esc(v.name)}">
    <defs>
      <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#182332"/><stop offset="1" stop-color="#0c121a"/></linearGradient>
      <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
      <linearGradient id="${id}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9f5ff"/><stop offset="1" stop-color="#68a9c7"/></linearGradient>
      <filter id="${id}shadow"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity=".45"/></filter>
    </defs>
    <rect width="118" height="62" rx="9" fill="${bg}"/>
    <path d="M8 54h103" stroke="#344454" stroke-width="1"/>
    <ellipse cx="64" cy="53" rx="48" ry="4" fill="#000" opacity=".28"/>
    <g filter="url(#${id}shadow)">${cab}${body}</g>
    <path d="M12 48h4" stroke="#ffd36b" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function renderVehicles(){
 $("vehicleTable").innerHTML=vehicles.map((v,i)=>`<tr onclick="verFicha(${i})">
   <td><div class="vehicle-name"><div><b>${esc(v.name)}</b><div class="vehicle-badge">${esc(v.special||"Estándar")}</div></div></div></td>
   <td><div class="vehicle-photo">${vehicleSvg(v)}</div></td>
   <td>${v.cap? v.cap.toFixed(1):"ND"}</td>
   <td>${v.vol?v.vol.toFixed(1):"ND"}</td>
   <td class="muted-cell">${v.L?`${v.L} × ${v.W} × ${v.H}`:"Según resolución"}</td>
   <td>${esc(v.body)}</td>
   <td>${esc(v.cargo)}</td>
   <td class="muted-cell">${esc(v.special||"—")}</td>
 </tr>`).join("");
 localStorage.setItem("lt_vehicles",JSON.stringify(vehicles));
}
function verFicha(i){
 const v=vehicles[i];
 const box=$("vehicleModalBox");
 box.innerHTML=`
  <div class="modal-head">
    <div><div class="eyebrow">FICHA TÉCNICA</div><h2 style="margin:4px 0 0">${esc(v.name)}</h2></div>
    <button class="iconbtn" onclick="cerrarFicha()">×</button>
  </div>
  <div class="modal-image">${vehicleSvg(v)}</div>
  <div class="final-rec-grid" style="margin-top:16px">
    <div><span>Capacidad útil</span><strong>${v.cap!==null?v.cap+" t":"N/D"}</strong></div>
    <div><span>Volumen útil</span><strong>${v.vol!==null?v.vol+" m³":"N/D"}</strong></div>
    <div><span>Largo interno</span><strong>${v.L!==null?v.L+" m":"Según resolución"}</strong></div>
    <div><span>Ancho interno</span><strong>${v.W!==null?v.W+" m":"Según resolución"}</strong></div>
    <div><span>Alto interno</span><strong>${v.H!==null?v.H+" m":"Según resolución"}</strong></div>
    <div><span>Carrocería</span><strong>${esc(v.body)}</strong></div>
    <div><span>Uso / carga</span><strong>${esc(v.cargo)}</strong></div>
    <div><span>Condición especial</span><strong>${esc(v.special||"Estándar")}</strong></div>
  </div>
  <div class="footer-note" style="margin-top:16px;text-align:left">Ficha generada a partir de la tabla maestra editable. Ajusta los valores en la pestaña "Tabla maestra" si difieren de la cotización real del transportador.</div>
  <div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn primary" onclick="cerrarFicha()">Cerrar</button></div>
 `;
 $("vehicleModalOverlay").classList.add("open");
}
function cerrarFicha(){$("vehicleModalOverlay").classList.remove("open");}
function restaurarVehiculos(){if(confirm("¿Restaurar la tabla maestra a los valores base?")){vehicles=BASE_VEHICLES.map(v=>({...v}));renderVehicles();}}
function reiniciarTodo(){if(!confirm("Esto borrará la solicitud, las piezas y el análisis. ¿Continuar?"))return;pieces=[];lastAnalysis=null;document.querySelectorAll("input").forEach(i=>{if(i.type!=="checkbox")i.value=""});document.querySelectorAll("select").forEach(s=>s.selectedIndex=0);$("pCant").value=1;$("contCant").value=1;renderPieces();$("alerts").innerHTML='<div class="alert blue">Solicitud reiniciada. Puedes empezar una nueva.</div>';$("recommendation").innerHTML="";$("quote").innerHTML='<div class="empty">Aún no hay cotización.</div>';toggleContainer();window.scrollTo({top:0,behavior:"smooth"})}
function guardarCotizacion(a,totalCotizado){
  if(!lastAnalysis){alert("No hay análisis para guardar.");return}
  const id=Math.random().toString(36).slice(2,8).toUpperCase();
  const record={
    id,
    fecha:new Date().toLocaleString("es-CO"),
    operacionId:$("operationId").value||"—",
    cliente:$("clientName").value||"—",
    tipoCarga:$("tipoCarga").value||"—",
    peso:a.t.weight.toFixed(3),
    volumen:a.t.volume.toFixed(2),
    vehiculo:a.best.v.name+(a.best.multi?` × ${a.best.count}`:""),
    total:money(totalCotizado)
  };
  let history=JSON.parse(localStorage.getItem("lt_history")||"[]");
  history.unshift(record);
  if(history.length>500)history=history.slice(0,500);
  localStorage.setItem("lt_history",JSON.stringify(history));
  alert(`Cotización guardada: ${id}`);
  renderHistory();
}
function renderHistory(){
  const tbody=$("historyTableBody");
  const search=($("historySearch")?.value||"").toLowerCase();
  if(!tbody)return;
  let history=JSON.parse(localStorage.getItem("lt_history")||"[]");
  if(search){
    history=history.filter(r=>(r.operacionId.toLowerCase().includes(search)||r.cliente.toLowerCase().includes(search)));
  }
  const count=$("historyCount");
  if(count)count.textContent=`${history.length} ${history.length===1?"registro":"registros"}`;
  if(!history.length){
    tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:20px;color:#8f9bad">No hay registros en el historial.</td></tr>';
    return;
  }
  tbody.innerHTML=history.map(r=>`<tr>
    <td>${esc(r.fecha)}</td>
    <td><strong>${esc(r.operacionId)}</strong></td>
    <td>${esc(r.cliente)}</td>
    <td>${esc(r.tipoCarga)}</td>
    <td>${r.peso} t</td>
    <td>${r.volumen} m³</td>
    <td>${esc(r.vehiculo)}</td>
    <td><strong>${r.total}</strong></td>
    <td><button class="iconbtn" onclick="if(confirm('¿Eliminar este registro?')){let h=JSON.parse(localStorage.getItem('lt_history')||'[]');h=h.filter(x=>x.id!=='${r.id}');localStorage.setItem('lt_history',JSON.stringify(h));renderHistory();}" title="Eliminar">×</button></td>
  </tr>`).join("");
}
function exportarHistorial(){
  if(typeof XLSX==="undefined"){alert("No está disponible el exportador Excel.");return}
  let history=JSON.parse(localStorage.getItem("lt_history")||"[]");
  if(!history.length){alert("El historial está vacío.");return}
  const rows=history.map(r=>({
    "Fecha":r.fecha,
    "ID Operación":r.operacionId,
    "Cliente":r.cliente,
    "Tipo Carga":r.tipoCarga,
    "Peso (t)":r.peso,
    "Volumen (m³)":r.volumen,
    "Vehículo":r.vehiculo,
    "Total":r.total
  }));
  const sheet=XLSX.utils.json_to_sheet(rows);
  const workbook=XLSX.utils.book_new();XLSX.utils.book_append_sheet(workbook,sheet,"Historial");
  XLSX.writeFile(workbook,"logitrading-historial.xlsx");
}
function vaciarHistorial(){
  if(confirm("¿Borrar todo el historial de cotizaciones? Esta acción no se puede deshacer.")){
    localStorage.removeItem("lt_history");
    renderHistory();
    alert("Historial borrado.");
  }
}
renderVehicles();renderPieces();calcPiecePreview();renderHistory();
document.addEventListener("input",updateDashboard);document.addEventListener("change",updateDashboard);
