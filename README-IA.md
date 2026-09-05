# Respaldo IA para PDF

La página sigue intentando primero el parser local. Solo llama al Worker cuando no encuentra referencias, deja referencias incompletas o los totales no cuadran de forma grave. La clave nunca se guarda en este repositorio ni en `index.html`.

## 1. Crear la cuenta de Cloudflare

1. Entra a <https://dash.cloudflare.com/sign-up> y crea una cuenta gratuita.
2. Confirma el correo electrónico.
3. No necesitas mover tu dominio ni cambiar los DNS para usar un Worker.

## 2. Crear la clave del proveedor IA

1. Entra a <https://platform.openai.com/api-keys>.
2. Crea una API key con permisos mínimos de uso de modelos.
3. Cópiala una sola vez y guárdala temporalmente en un gestor de contraseñas. No la pegues en `app.js`, `index.html`, GitHub ni en un issue.
4. Revisa límites de gasto en <https://platform.openai.com/settings/organization/limits>.

El Worker usa `gpt-4o-mini` por defecto. Se puede cambiar con el secreto de configuración `OPENAI_MODEL` si se necesita otro modelo compatible con JSON Schema.

## 3. Instalar y autenticar Wrangler

Instala Node.js 18 o superior y, en una terminal, ejecuta:

```bash
npm install -g wrangler
wrangler login
```

Se abrirá el navegador. Autoriza Wrangler en la cuenta correcta de Cloudflare.

## 4. Desplegar el Worker y guardar el secreto

Desde la raíz de este repositorio:

```bash
wrangler deploy worker/index.js --name logitrading-pdf-ai --compatibility-date 2026-09-05
wrangler secret put OPENAI_API_KEY --name logitrading-pdf-ai
```

Cuando Wrangler lo solicite, pega la clave de OpenAI directamente en la terminal. No la escribas en un archivo ni la envíes por chat.

Configura el origen permitido para que solo la página de GitHub Pages pueda llamar al Worker. Sustituye el dominio por el real:

```bash
wrangler secret put ALLOWED_ORIGIN --name logitrading-pdf-ai
```

Para probar el Worker desde un dominio temporal o local, usa temporalmente ese origen y después vuelve a dejar únicamente el dominio de GitHub Pages. También puedes elegir el modelo:

```bash
wrangler secret put OPENAI_MODEL --name logitrading-pdf-ai
```

El comando de despliegue mostrará una URL parecida a `https://logitrading-pdf-ai.<tu-cuenta>.workers.dev`.

## 5. Conectar GitHub Pages

En `index.html`, antes de cargar `js/app.js`, define solo la URL pública del Worker:

```html
<script>
  window.LOGITRADING_AI_WORKER_URL = "https://logitrading-pdf-ai.<tu-cuenta>.workers.dev";
</script>
<script src="js/app.js?v=39"></script>
```

La URL no es secreta. La clave sigue estando únicamente en el secreto `OPENAI_API_KEY` de Cloudflare. Publica el cambio en GitHub Pages y prueba un PDF difícil: en la ayuda del formulario aparecerá `respaldo IA` cuando se haya usado.

## 6. Rotar o eliminar la clave

Si la clave se filtra, revócala inmediatamente en OpenAI, crea otra y ejecuta de nuevo `wrangler secret put OPENAI_API_KEY`. No hace falta cambiar el código del sitio.

## Coste aproximado

El Worker de Cloudflare tiene un nivel gratuito con límites y OpenAI cobra por tokens. Con `gpt-4o-mini`, un documento de 5.000 tokens de entrada y 1.000 de salida cuesta aproximadamente `US$0,0009` usando tarifas de referencia de `US$0,15 / millón` de tokens de entrada y `US$0,60 / millón` de salida. Un PDF grande de 20.000 tokens de entrada y 3.000 de salida rondaría `US$0,0048`. Los precios pueden cambiar y el OCR ocurre en el navegador, por lo que solo se cobra la llamada IA cuando el fallback se activa. Configura un límite de gasto.

## Estado de las pruebas

La suite local `tests/universal-pdf-suite.test.js` sigue pasando sus seis escenarios de extracción. Este workspace no contiene los seis PDFs reales ni la tabla de valores correctos mencionada en la solicitud, por lo que esa validación debe ejecutarse después de adjuntarlos nuevamente. La aplicación conserva la alerta de discrepancias de totales para resultados del parser y del Worker.
