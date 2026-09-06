# Reglas del parser de listas de empaque

## Regla de salida obligatoria

Ningún cambio a `js/app.js`, detectores de PDF/Excel, rutas jerárquicas, Worker de IA o exportación de Excel se considera terminado hasta ejecutar `node tests/master-regression.test.js` contra todos los fixtures disponibles en `tests/fixtures/packing-lists/` y obtener resultados `PASS` para todos. El test siempre imprime una tabla completa. Un fixture ausente o un resultado distinto bloquea la entrega; se debe solicitar el archivo faltante y no declarar la corrección terminada.

Cada documento confirmado se incorpora de inmediato como el binario original y un archivo `.expected.json` homónimo. El JSON documenta el total declarado por el documento, descripción y valores esperados. Si la confidencialidad impide almacenar el original, se incorpora un PDF sintético con la misma estructura relevante (columnas, unidades, separadores y jerarquía), datos inventados y `fixture_type: "synthetic"`; el original se ejecuta sólo en el entorno autorizado antes de confirmar una corrección.

## Reglas de extracción

- Decimales: interpretar coma y punto por contexto de columna y de valor. Un documento puede mezclar separadores de miles y decimales; no existe una regla global.
- Unidades: respetar primero la unidad explícita del encabezado para peso y dimensiones. Sólo inferir por magnitud si el encabezado no declara unidad.
- Multiplicadores: cantidades, cajas e identificadores se distinguen mediante controles de sanidad. Un ID grande no puede multiplicar peso, volumen o área.
- Filas de pie: `TOTAL`, `SubTotals`, emitente, `Embalajes`, `Cubaje` y etiquetas de embalaje no son productos. Una fila o grupo requiere señales estructurales y métricas inequívocas.
- Jerarquía: un grupo físico necesita un tipo de embalaje explícito y el patrón completo de dos pesos y volumen. El peso, volumen y área se cuentan una vez por grupo; los productos hijos no duplican esas métricas.
- Totales declarados: se comparan siempre con el cálculo. Una desviación relevante debe advertirse al usuario y activa el respaldo de IA cuando corresponda; el respaldo también debe pasar esta validación.
- Cotización: una importación con discrepancias, filas incompletas o filas excluidas queda en `Revisión requerida`. No puede generar, guardar ni imprimir cotización hasta que una persona confirme explícitamente la revisión.

## Protocolo ante una falla

1. Obtener primero los totales declarados del PDF/Excel real.
2. Ejecutar el archivo real con diagnósticos de columnas, grupos y valores extraídos.
3. Identificar el patrón causante y documentarlo aquí si es nuevo.
4. Aplicar el cambio más específico posible.
5. Ejecutar la suite maestra completa y corregir cualquier regresión.
6. Añadir el fixture y su JSON si el documento fue confirmado.
7. Sólo con toda la suite verde: incrementar el cache-busting de `index.html`, hacer commit y push, y verificar `git rev-parse HEAD` contra `git rev-parse origin/main`.
8. Pedir validación del sitio publicado en incógnito con el documento nuevo y fixtures antiguos relevantes.