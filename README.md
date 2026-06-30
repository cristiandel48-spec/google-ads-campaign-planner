<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ab1bb1cc-d005-4e05-ae35-2d171794414e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Generación de imágenes con IA

La pestaña "Imágenes y Banners" ahora genera fotos reales del producto con el
modelo de imágenes de Gemini (Imagen) usando tu `GEMINI_API_KEY` existente —
no necesitas ninguna clave adicional. Se generan automáticamente cada vez que
cambias de producto o de estilo visual.

## Conectar tu cuenta real de Meta Ads

La pestaña "Cuenta Meta Ads" puede leer el rendimiento real de tus campañas
(Facebook e Instagram) y proponer acciones de optimización al estilo de un
media buyer (pausar campañas sin resultados, subir presupuesto a las que
escalan bien, avisar de frecuencia o CTR bajo). Por seguridad, **ninguna
acción que afecte tu gasto real se aplica sola**: siempre debes hacer clic
en "Aplicar" para confirmarla.

Para conectarla necesitas 2 valores obligatorios en tus Secrets/`.env.local`
(`META_*`, ver `.env.example`):

1. **Access Token**: en [Meta Business Suite](https://business.facebook.com/),
   ve a Configuración del Negocio → Usuarios → Usuarios del Sistema, crea uno
   (o usa uno existente), asígnale el activo "Cuenta publicitaria" con rol
   de administrador, y genera un token con los permisos `ads_management` y
   `ads_read`. Usa la opción de token de larga duración para que no caduque
   pronto.
2. **Ad Account ID**: el ID numérico de tu cuenta publicitaria (lo ves en
   Administrador de Anuncios, con o sin el prefijo `act_` — la app lo agrega
   automáticamente si falta).
3. **App ID / App Secret** (opcionales): solo necesarios si más adelante
   agregas flujos de login OAuth o webhooks con tu propia App de Meta.

Mientras estos valores no estén configurados, la pestaña "Cuenta Meta Ads" se
queda en modo informativo y no intenta conectarse a ninguna cuenta real.

## Agente omnichannel Meta + Mastershop + WhatsApp

La app ahora incluye un centro omnicanal para operar el flujo completo: Meta Ads -> landing -> checkout -> Mastershop -> WhatsApp -> reporte diario.

- **Meta Ads**: lee campañas reales, calcula ingresos atribuidos y ROAS, pausa campañas con ROAS menor a 1.5x y escala ganadoras con ROAS mayor a 3x solo si el modo LIVE y los caps lo permiten.
- **Mastershop**: recibe eventos de pedido en POST /api/mastershop/webhook y puede leer reportes diarios desde el endpoint configurado en MASTERSHOP_REPORTS_PATH.
- **WhatsApp Business**: responde consultas frecuentes en POST /api/whatsapp/webhook, envía confirmaciones de pedido y dispara alertas si hay métricas fuera de rango.
- **Reportes**: POST /api/omnichannel/report/run genera un consolidado con ingresos, gasto, pedidos, clientes nuevos/recurrentes, CPM, CPC, conversión y ROAS. El loop de fondo genera un reporte por día.

Sin credenciales, el sistema no falla: opera en modo local, registra eventos y deja WhatsApp en outbox. Para operación real, completa las variables MASTERSHOP_*, WHATSAPP_*, META_* y GEMINI_API_KEY en Secrets o .env.local.
