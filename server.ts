import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { metaAdsClient } from "./metaAdsClient";

dotenv.config();

// Initialize Gemini API client lazily to avoid crashing on startup if the key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

const app = express();
app.use(express.json());

// API endpoints FIRST

// Check status of Gemini API connection
app.get("/api/ai-status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    active: hasKey,
    configured: hasKey,
    message: hasKey 
      ? "IA de Gemini lista para generar campañas personalizadas." 
      : "Gemini API Key no configurada. Usando el motor de sugerencias premium pre-curado."
  });
});

// Endpoint to generate a real product image via Gemini's image generation model
app.post("/api/generate-image", async (req, res) => {
  const { product, style, aspectRatio, promoTag, headline } = req.body;

  if (!product) {
    return res.status(400).json({ error: "Falta el nombre del producto." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    return res.status(200).json({
      configured: false,
      message: "Agrega tu GEMINI_API_KEY en Secrets para generar imágenes reales con IA.",
    });
  }

  const styleDescriptions: Record<string, string> = {
    cosmetic: "high-end minimalist fashion styling, soft shadows, warm beige color palette, ambient sunlight, studio photography, cinematic lighting",
    organic: "fresh green concept, citrus slices, green tea leaves, splash of crystal clear water, eco-friendly branding aesthetic, vibrant natural lighting",
    medical: "clean clinical teal background, professional laboratory concept, waterlily petals, pristine geometric shapes, showing purity and microbiome protection",
    gold: "ultra premium prestige black and gold background, elegant dark luxury cosmetic style, podium with warm backlight, golden accents",
  };

  const aspectMap: Record<string, "16:9" | "1:1" | "9:16"> = {
    "16:9": "16:9",
    "1:1": "1:1",
    "9:16": "9:16",
  };

  const prompt = `Commercial product photography of a premium supplement package for "${product}", label clearly readable, ${
    styleDescriptions[style as string] || styleDescriptions.cosmetic
  }, product presentation, centered composition, copy-space on the layout sides for text overlay, extremely realistic, highly detailed textures, professional advertising photography, 8k resolution. Do not add any other text than the product label.`;

  try {
    const response = await ai.models.generateImages({
      model: "imagen-4.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectMap[aspectRatio as string] || "1:1",
      },
    });

    const generated = response.generatedImages?.[0];
    const imageBytes = generated?.image?.imageBytes;

    if (!imageBytes) {
      throw new Error("La API no devolvió datos de imagen.");
    }

    res.json({
      configured: true,
      success: true,
      imageBase64: `data:image/png;base64,${imageBytes}`,
      promptUsed: prompt,
    });
  } catch (error: any) {
    console.error("Error generating image with Gemini Imagen:", error);
    const errString = String(error?.message || error || "").toLowerCase();
    let userMsg = "No se pudo generar la imagen con IA en este momento.";
    if (errString.includes("quota") || errString.includes("429")) {
      userMsg = "Límite de cuota de generación de imágenes superado (429). Intenta de nuevo en unos minutos.";
    } else if (errString.includes("api key")) {
      userMsg = "Clave API inválida para generación de imágenes.";
    }
    res.status(200).json({
      configured: true,
      success: false,
      error: true,
      message: userMsg,
    });
  }
});

// Endpoint to generate customized copy and keywords via Gemini
app.post("/api/generate-ads", async (req, res) => {
  const { product, angle, targetAudience, extraPrompt } = req.body;

  if (!product) {
    return res.status(400).json({ error: "Falta el nombre o código del producto." });
  }

  const ai = getGeminiClient();

  if (!ai) {
    // If Gemini key is not configured, we return curated but highly detailed flat responses
    // so the app stays functional and premium even without any configuration.
    return res.json({
      fallback: true,
      message: "Respuesta de respaldo de alta calidad (Agregue su GEMINI_API_KEY en secrets para personalizar en tiempo real).",
      primaryTexts: getStaticAdsForProduct(product, angle || "direct").primaryTexts,
      headlines: getStaticAdsForProduct(product, angle || "direct").headlines,
      descriptions: getStaticAdsForProduct(product, angle || "direct").descriptions,
      audienceInterests: getStaticAudienceForProduct(product).interests,
      audienceLookalikeIdeas: getStaticAudienceForProduct(product).lookalikes,
      placements: getStaticAudienceForProduct(product).placements,
      landingPageHeadline: getStaticLandingPageCopy(product, angle || "direct").headline,
      landingPageSubheadline: getStaticLandingPageCopy(product, angle || "direct").subheadline,
      landingPageBullets: getStaticLandingPageCopy(product, angle || "direct").bullets,
      marketingReasoning: "Estrategia de conversión premium pre-calculada. Para usar el motor inteligente dinámico con tus inputs personalizados, agrega tu clave de Gemini."
    });
  }

  try {
    const prompt = `
      Eres un especialista en Dropshipping y Media Buyer Experto en Meta Ads (Facebook e Instagram).
      Tu tarea es estructurar y crear una campaña de Meta Ads optimizada para conversiones y alto ROAS.

      Detalles del Producto:
      - Nombre/Categoría: ${product}
      - Ángulo de Enfoque de Marketing: ${angle}
      - Público Objetivo Principal: ${targetAudience || "Interesados en salud, bienestar, cuidado personal"}
      - Contexto Extra / Instrucciones: ${extraPrompt || "Ninguno"}

      Genera exactamente lo siguiente en formato JSON respetando este esquema estricto:
      {
        "primaryTexts": [Lista de exactamente 4 a 6 textos principales para el anuncio (máximo 125 caracteres cada uno para evitar el corte "ver más", con gancho emocional, beneficio y llamado a la acción)],
        "headlines": [Lista de exactamente 5 a 8 títulos cortos (máximo 40 caracteres cada uno, directos, atractivos, destacando beneficios, urgencia, confianza)],
        "descriptions": [Lista de exactamente 3 a 4 descripciones de enlace (máximo 30 caracteres cada una)],
        "audienceInterests": [Lista de 6-8 intereses/comportamientos de segmentación detallada para usar en el Administrador de Anuncios, ej: "Salud y bienestar", "Compras en línea"],
        "audienceLookalikeIdeas": [Lista de 3-4 ideas de públicos similares (lookalike) o fuentes de públicos personalizados, ej: "Compradores de los últimos 90 días", "Visitantes del checkout que no compraron"],
        "placements": [Lista de 3-5 ubicaciones recomendadas, ej: "Feed de Instagram", "Reels", "Historias de Facebook", "Audience Network"],
        "landingPageHeadline": "Un título para la landing page irresistible",
        "landingPageSubheadline": "Un subtítulo que complementa el título y rompe las objeciones principales",
        "landingPageBullets": [Lista de 4 beneficios persuasivos o ganchos emocionales para la página de aterrizaje],
        "marketingReasoning": "Breve explicación de por qué esta estructura y mensajes maximizarán el CTR y Conversión seguro."
      }

      Importante:
      - Los límites de Meta Ads son estrictos: Texto principal <= 125 caracteres, Títulos <= 40 caracteres, Descripciones <= 30 caracteres. No te pases de ese límite.
      - Evita afirmaciones médicas exageradas que puedan hacer rechazar el anuncio o suspender la cuenta (no prometas curación de enfermedades, habla de bienestar, balance, nutrición, fórmulas de confianza, cuidado diario).
      - Responde únicamente con el objeto JSON válido. No uses bloques de markdown con la palabrajson, solo imprime el contenido JSON directo.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryTexts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 4 to 6 primary texts, max 125 chars each"
            },
            headlines: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 5 to 8 headlines, max 40 chars each"
            },
            descriptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 3 to 4 link descriptions, max 30 chars each"
            },
            audienceInterests: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            audienceLookalikeIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            placements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            landingPageHeadline: { type: Type.STRING },
            landingPageSubheadline: { type: Type.STRING },
            landingPageBullets: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            marketingReasoning: { type: Type.STRING }
          },
          required: ["primaryTexts", "headlines", "descriptions", "audienceInterests", "audienceLookalikeIdeas", "placements", "landingPageHeadline", "landingPageSubheadline", "landingPageBullets", "marketingReasoning"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);
    res.json(data);
  } catch (error: any) {
    console.error("Error generating customized ads with Gemini:", error);
    
    // Determine the exact error category
    let userMsg = "Se ha superado el límite de cuota gratuita o rate limit de Gemini (429). Se han cargado sugerencias estratégicas premium pre-configuradas de alta conversión.";
    
    const errString = String(error?.message || error || "").toLowerCase();
    if (errString.includes("quota") || errString.includes("limit") || errString.includes("429") || error?.status === 429) {
      userMsg = "Exceso de solicitudes (429: Rate-limit o Quota Exceeded) en la API de Gemini. Hemos activado nuestro motor local de sugerencias premium para evitar demoras.";
    } else if (errString.includes("api key") || errString.includes("key not found")) {
      userMsg = "Error en las credenciales o clave API. Cargando sugerencias pre-optimizadas del motor de segmentación premium.";
    }

    // On error, fall back to high-quality preset structured JSON
    res.json({
      error: true,
      message: userMsg,
      primaryTexts: getStaticAdsForProduct(product, angle || "direct").primaryTexts,
      headlines: getStaticAdsForProduct(product, angle || "direct").headlines,
      descriptions: getStaticAdsForProduct(product, angle || "direct").descriptions,
      audienceInterests: getStaticAudienceForProduct(product).interests,
      audienceLookalikeIdeas: getStaticAudienceForProduct(product).lookalikes,
      placements: getStaticAudienceForProduct(product).placements,
      landingPageHeadline: getStaticLandingPageCopy(product, angle || "direct").headline,
      landingPageSubheadline: getStaticLandingPageCopy(product, angle || "direct").subheadline,
      landingPageBullets: getStaticLandingPageCopy(product, angle || "direct").bullets,
      marketingReasoning: "Estrategia de conversión enfocada en la solución de problemas y el valor agregado del producto, mitigando el riesgo de rechazos de anuncios por políticas de salud de Meta Ads."
    });
  }
});

// ============================================================
// Meta Ads (Facebook/Instagram) real account integration ("traficker" features)
// ============================================================

// Check whether real Meta Marketing API credentials are configured
app.get("/api/meta-account/status", (req, res) => {
  res.json({ configured: metaAdsClient.isConfigured() });
});

// Fetch real campaigns + last 7 day metrics, plus automated optimization suggestions
app.get("/api/meta-account/campaigns", async (req, res) => {
  if (!metaAdsClient.isConfigured()) {
    return res.status(200).json({
      configured: false,
      message: "Conecta tu cuenta real de Meta Ads agregando las credenciales META_ACCESS_TOKEN y META_AD_ACCOUNT_ID en Secrets.",
    });
  }

  try {
    const campaigns = await metaAdsClient.fetchCampaigns();
    const suggestions = metaAdsClient.evaluateRules(campaigns);
    res.json({ configured: true, success: true, campaigns, suggestions });
  } catch (error: any) {
    console.error("Error fetching Meta Ads campaigns:", error);
    res.status(200).json({
      configured: true,
      success: false,
      error: true,
      message: error?.message || "No se pudo conectar con la API de Meta. Revisa tu token de acceso y el ID de cuenta publicitaria.",
    });
  }
});

// Apply a real, spend-affecting (or status) action. Requires an explicit
// confirm:true flag from the UI — this is never called automatically by a
// background process. The user must click "Aplicar" themselves.
app.post("/api/meta-account/apply-action", async (req, res) => {
  if (!metaAdsClient.isConfigured()) {
    return res.status(400).json({ success: false, message: "La cuenta de Meta Ads no está conectada." });
  }

  const { action, confirm } = req.body;

  if (!confirm) {
    return res.status(400).json({
      success: false,
      message: "Esta acción afecta tu cuenta real de Meta Ads y requiere confirmación explícita (confirm: true).",
    });
  }

  try {
    const result = await metaAdsClient.applyAction(action);
    res.json(result);
  } catch (error: any) {
    console.error("Error applying Meta Ads action:", error);
    res.status(200).json({
      success: false,
      message: error?.message || "No se pudo aplicar la acción en Meta Ads.",
    });
  }
});

// Mock/Static Curated Fallback Data Builders

function getStaticAdsForProduct(product: string, angle: string) {
  const isLemme = product.toLowerCase().includes("lemme");
  const isUrofem = product.toLowerCase().includes("urofem");

  if (isLemme) {
    return {
      primaryTexts: [
        "¿Cansada de antojos de dulce y energía baja? Lemme Burn Caps activa tu metabolismo con ingredientes 100% naturales. Pide el tuyo hoy con envío gratis 🔥",
        "60 cápsulas. 1 mes de cambio real. Lemme Burn te ayuda a quemar más y desear menos azúcar. Paga al recibir en toda Colombia.",
        "Tu metabolismo necesita un empujón natural. Descubre por qué miles ya eligieron Lemme Burn para verse y sentirse mejor cada día.",
        "Fórmula termogénica + control de antojos en una sola cápsula. Lemme Burn Original, envío gratis y pago contra entrega."
      ],
      headlines: [
        "Lemme Burn Caps 60 Unds",
        "Acelera Tu Metabolismo Hoy",
        "Suplemento Lemme Orgánico",
        "Menos Antojos, Más Energía",
        "Lemme Burn Oficial Colombia",
        "Fórmula Termogénica Natural",
        "Comprar Lemme Burn Original",
        "Envío Gratis en Tu Compra"
      ],
      descriptions: [
        "Envío gratis hoy",
        "Paga al recibir",
        "60 cápsulas premium",
        "Stock limitado"
      ]
    };
  } else if (isUrofem) {
    return {
      primaryTexts: [
        "Cuida tu salud íntima de la forma más rica que existe: gomitas. Urofem combina probióticos activos para tu flora urinaria y vaginal. Pide ya con envío gratis 💕",
        "60 gomitas, 1 mes de bienestar íntimo. Urofem refuerza tus defensas y te ayuda a decir adiós a las molestias recurrentes.",
        "Olvídate de tragar pastillas. Urofem son probióticos en gomitas deliciosas para proteger tu zona íntima todos los días.",
        "Probióticos de alta potencia + sabor delicioso. Urofem, pago contra entrega y envío seguro a toda Colombia."
      ],
      headlines: [
        "Urofem Probióticos Gomas x60",
        "Cuidado Urinario Femenino",
        "Probióticos en Deliciosas Gomas",
        "Refuerza Tu Flora Intestinal",
        "Protección y Bienestar Diario",
        "Dile Adiós a las Molestias",
        "Urofem Gomas Original",
        "Paga Contra Entrega Hoy"
      ],
      descriptions: [
        "Envío gratis hoy",
        "Paga al recibir",
        "60 gomitas premium",
        "Stock limitado"
      ]
    };
  } else {
    // Probioticos Uro Vaginal
    return {
      primaryTexts: [
        "Recupera tu frescura y equilibrio íntimo. Probióticos Uro Vaginal con cepas específicas para restaurar tu pH natural. Envío discreto hoy 💧",
        "98% de valoraciones positivas. Cápsulas de absorción rápida que protegen tu zona íntima de bacterias y malos olores, día tras día.",
        "Tu bienestar íntimo merece una fórmula seria. Probióticos Uro Vaginal, garantía de originalidad y envío discreto e inmediato.",
        "Equilibra tu microbiota femenina de forma natural. Pide tus Probióticos Uro Vaginal con pago contra entrega."
      ],
      headlines: [
        "Probióticos Uro Vaginales",
        "Equilibrio de pH Femenino",
        "Flora Vaginal Saludable",
        "Evita Molestias Íntimas",
        "Fórmula Íntima de Confianza",
        "Comprar Probiótico Uro Vaginal",
        "98% de Valoraciones Positivas",
        "Paga Cómodamente al Recibir"
      ],
      descriptions: [
        "Envío discreto",
        "Paga al recibir",
        "60 cápsulas premium",
        "Stock limitado"
      ]
    };
  }
}

function getStaticAudienceForProduct(product: string) {
  const isLemme = product.toLowerCase().includes("lemme");
  const isUrofem = product.toLowerCase().includes("urofem");

  if (isLemme) {
    return {
      interests: [
        "Pérdida de peso",
        "Suplementos dietéticos",
        "Bienestar y fitness",
        "Compras en línea",
        "Nutrición saludable",
        "Vida activa y ejercicio"
      ],
      lookalikes: [
        "Compradores de los últimos 90 días",
        "Visitantes del checkout que no compraron",
        "Seguidores de la página de Instagram"
      ],
      placements: ["Feed de Instagram", "Reels", "Historias de Facebook", "Feed de Facebook"]
    };
  } else if (isUrofem) {
    return {
      interests: [
        "Salud femenina",
        "Probióticos y salud digestiva",
        "Bienestar íntimo",
        "Compras en línea",
        "Suplementos naturales",
        "Cuidado personal"
      ],
      lookalikes: [
        "Compradores de los últimos 90 días",
        "Visitantes del checkout que no compraron",
        "Audiencia similar a clientas recurrentes"
      ],
      placements: ["Feed de Instagram", "Reels", "Historias de Instagram", "Audience Network"]
    };
  } else {
    return {
      interests: [
        "Salud íntima femenina",
        "Probióticos",
        "Bienestar y autocuidado",
        "Compras en línea",
        "Productos naturales",
        "Salud y belleza"
      ],
      lookalikes: [
        "Compradores de los últimos 90 días",
        "Visitantes del checkout que no compraron",
        "Audiencia similar a clientas recurrentes"
      ],
      placements: ["Feed de Instagram", "Historias de Facebook", "Reels", "Feed de Facebook"]
    };
  }
}

function getStaticLandingPageCopy(product: string, angle: string) {
  const isLemme = product.toLowerCase().includes("lemme");
  const isUrofem = product.toLowerCase().includes("urofem");

  if (isLemme) {
    return {
      headline: "Activa Tu Quema Metabólica Natural con Lemme Burn",
      subheadline: "La fórmula de última generación con ingredientes botánicos para optimizar tu energía, disminuir antojos de dulce y potenciar tu bienestar diario.",
      bullets: [
        "Fórmula Termogénica Avanzada: Acelera la digestión y quema calórica.",
        "Control del Apetito por Ansiedad: Diles adiós a los antojos nocturnos de azúcar.",
        "Energía Limpia y Prolongada: Diseñado con ingredientes limpios sin bajones de cafeína.",
        "60 Cápsulas Premium: Suministro completo para todo un mes de cambio real."
      ]
    };
  } else if (isUrofem) {
    return {
      headline: "Protege Tu Zona Íntima de Forma Deliciosa con Urofem",
      subheadline: "Probióticos activos concentrados en gomitas premium para equilibrar tu flora digestiva, tracto urinario y fortalecer defensas.",
      bullets: [
        "Barrera Urinaria Total: Previene y minimiza el riesgo de infecciones recurrentes.",
        "Lactobacillus de Alta Supervivencia: Llegan intactos a donde tu cuerpo los necesita.",
        "Formato en Gomitas Ricas: Fácil de consumir, sin tragar pastillas aburridas.",
        "Práctico Frasco de 60 Unidades: Bienestar diario a tu alcance inmediato."
      ]
    };
  } else {
    return {
      headline: "Recupera la Frescura y Equilibrio Íntimo que Mereces",
      subheadline: "Probióticos Uro Vaginal de alta potencia científica para restaurar el pH saludable, combatir malos olores y neutralizar bacterias hostiles.",
      bullets: [
        "Optimización del pH Vaginal: Mantiene un ecosistema ácido equilibrado naturalmente.",
        "Previene Candidiasis y Molestias: Crea una fuerte capa de defensas óptima.",
        "Fórmula Médicamente Investigada: Enriquecida con cepas de lactobacilos específicos.",
        "Absorción Rápida e Higiénica: Resultados visibles desde la primera semana de uso."
      ]
    };
  }
}

// Setup Vite & App Server
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Dev mode setup with Vite dev server middleware
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
