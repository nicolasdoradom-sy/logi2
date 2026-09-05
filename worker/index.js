const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["referencias", "totales_documento"],
  properties: {
    referencias: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "referencia", "descripcion", "cantidad", "bultos",
          "largo_cm", "ancho_cm", "alto_cm", "volumen_m3",
          "peso_neto_kg", "peso_bruto_kg", "incompleta", "advertencias"
        ],
        properties: {
          referencia: { type: ["string", "null"] },
          descripcion: { type: ["string", "null"] },
          cantidad: { type: ["number", "null"] },
          bultos: { type: ["number", "null"] },
          largo_cm: { type: ["number", "null"] },
          ancho_cm: { type: ["number", "null"] },
          alto_cm: { type: ["number", "null"] },
          volumen_m3: { type: ["number", "null"] },
          peso_neto_kg: { type: ["number", "null"] },
          peso_bruto_kg: { type: ["number", "null"] },
          incompleta: { type: "boolean" },
          advertencias: { type: "array", items: { type: "string" } }
        }
      }
    },
    totales_documento: {
      type: "object",
      additionalProperties: false,
      required: ["quantity", "boxes", "net", "gross", "volume"],
      properties: {
        quantity: { type: ["number", "null"] },
        boxes: { type: ["number", "null"] },
        net: { type: ["number", "null"] },
        gross: { type: ["number", "null"] },
        volume: { type: ["number", "null"] }
      }
    }
  }
};

const systemPrompt = `Eres un extractor de listas de empaque. Devuelve exclusivamente JSON válido según el esquema solicitado.
Extrae una referencia por producto, línea o grupo logístico. No inventes valores: usa null cuando un campo no aparezca o sea ambiguo.
Normaliza dimensiones a centímetros, pesos a kilogramos y volumen a metros cúbicos. cantidad es el número de piezas/unidades; bultos es el número de cajas, pallets o bultos. Si solo existe volumen, conserva volumen y deja dimensiones en null.
Separa peso_neto_kg y peso_bruto_kg cuando el documento los distinga. peso_bruto_kg es el peso usado por la aplicación para el peso de transporte.
En totales_documento copia únicamente los totales explícitos del documento, no los calculados por ti; usa null si no se declaran. Las advertencias deben explicar ambigüedades o conversiones.`;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "null";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function jsonResponse(body, status, request, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request, env) }
  });
}

export default {
  async fetch(request, env) {
    if (!env.ALLOWED_ORIGIN) return jsonResponse({ error: "Falta configurar ALLOWED_ORIGIN" }, 500, request, env);
    const requestOrigin = request.headers.get("Origin") || "";
    if (requestOrigin && requestOrigin !== env.ALLOWED_ORIGIN) return jsonResponse({ error: "Origen no autorizado" }, 403, request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(request, env) });
    if (request.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405, request, env);
    if (!env.OPENAI_API_KEY) return jsonResponse({ error: "Falta configurar OPENAI_API_KEY" }, 500, request, env);

    let body;
    try { body = await request.json(); } catch { return jsonResponse({ error: "JSON de entrada inválido" }, 400, request, env); }
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) return jsonResponse({ error: "El texto extraído está vacío" }, 400, request, env);
    if (text.length > 180000) return jsonResponse({ error: "El texto excede el límite permitido" }, 413, request, env);

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Archivo: ${String(body.filename || "desconocido")}\n\nTexto extraído:\n${text}` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "packing_list_extraction", strict: true, schema: extractionSchema } }
      })
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("OpenAI error", upstream.status, detail.slice(0, 1000));
      return jsonResponse({ error: "El proveedor IA rechazó la solicitud" }, 502, request, env);
    }

    const completion = await upstream.json();
    const content = completion?.choices?.[0]?.message?.content;
    let result;
    try { result = JSON.parse(content); } catch { return jsonResponse({ error: "La respuesta IA no fue JSON válido" }, 502, request, env); }
    if (!result || !Array.isArray(result.referencias) || !result.totales_documento) {
      return jsonResponse({ error: "La respuesta IA no cumple el contrato" }, 502, request, env);
    }
    return jsonResponse(result, 200, request, env);
  }
};
