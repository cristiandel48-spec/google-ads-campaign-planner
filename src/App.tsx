import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  CheckCircle, 
  HelpCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  FileText, 
  Calendar, 
  ChevronRight, 
  ArrowRight,
  Plus,
  AlertCircle,
  Percent,
  Check,
  Shield,
  Truck,
  RotateCcw,
  Info,
  Image,
  Wand2,
  Link2
} from "lucide-react";
import { Product, AdsStructure, CampaignMetrics, OptimizationTask } from "./types";
import MetaAdsPanel from "./MetaAdsPanel";
import AutomationPanel from "./AutomationPanel";
import OmnichannelPanel from "./OmnichannelPanel";

// Predefined Dropshipping Health & Beauty Products
const PRODUCTS: Product[] = [
  {
    id: "lemme-burn",
    name: "LEMME BURN 60 CAPS",
    supplierCost: 20500, // COP
    stock: 240,
    suggestedSellPrice: 119900,
    benefit: "Acelerador metabólico y supresor de antojos orgánico premium",
    imageAlt: "Lemme Burn 60 Cápsulas"
  },
  {
    id: "urofem-gomas",
    name: "UROFEM PROBIOTICOS X60UND GOMAS",
    supplierCost: 30000,
    stock: 185,
    suggestedSellPrice: 99900,
    benefit: "Prevención urinaria femenina en deliciosas gomas de probióticos",
    imageAlt: "Urofem Gomas Probióticos"
  },
  {
    id: "uro-vaginal",
    name: "Probioticos Uro Vaginal",
    supplierCost: 21600,
    stock: 120,
    suggestedSellPrice: 94900,
    benefit: "Restaurador de flora íntima y balance de pH femenino con cepas activas",
    imageAlt: "Probióticos Uro Vaginales"
  }
];

const STARTER_META_BUDGET_COP = 20000;

const PRODUCT_IMAGES: Record<string, { src: string; label: string }[]> = {
  "lemme-burn": [
    { src: "/images/lemme_burn_square.png", label: "Cuadrada (Feed 1:1)" },
    { src: "/images/lemme_burn_story.png", label: "Vertical (Historias 9:16)" }
  ],
  "urofem-gomas": [
    { src: "/images/urofem_gomas.jpg", label: "Gomitas Urofem" }
  ],
  "uro-vaginal": [
    { src: "/images/uro_floating.png", label: "Cápsulas Flotando" },
    { src: "/images/uro_table.jpg", label: "Frasco en Mesa" },
    { src: "/images/uro_diagram.png", label: "Diagrama Cápsula" },
    { src: "/images/uro_open.jpg", label: "Frasco Abierto" }
  ]
};

const INITIAL_OPTIMIZATION_TASKS: OptimizationTask[] = [
  {
    id: "task-1",
    day: "Día 1",
    phase: "week1",
    title: "Lanzamiento, Píxel y Verificación del Pixel/CAPI",
    description: "Verificar que el Píxel de Meta (y la Conversions API) esté disparando eventos de compra correctamente. Sin esto, el algoritmo de entrega no puede optimizar.",
    checked: true
  },
  {
    id: "task-2",
    day: "Día 3",
    phase: "week1",
    title: "Primer chequeo de frecuencia y CTR",
    description: "Monitorea la frecuencia (ideal < 2.5x en esta etapa) y el CTR inicial. Si el CTR es menor a 1%, evalúa si el creativo o el primer texto principal es poco llamativo.",
    checked: false
  },
  {
    id: "task-3",
    day: "Día 5",
    phase: "week1",
    title: "Activar 2-3 Variantes de Creativo (Test A/B)",
    description: "Sube 2-3 variaciones de imagen/video con el mismo copy para que Advantage+ identifique el creativo ganador antes de escalar presupuesto.",
    checked: false
  },
  {
    id: "task-4",
    day: "Día 7",
    phase: "week1",
    title: "Análisis preliminar de Dropshipping ROI",
    description: "Cruzar ventas de Shopify/WooCommerce con gasto de Meta Ads. Identificar el costo por resultado real (costo por compra óptimo < costo de proveedor).",
    checked: false
  },
  {
    id: "task-5",
    day: "Día 9",
    phase: "week2",
    title: "Revisar Ubicaciones y Desglose por Plataforma",
    description: "Compara rendimiento entre Feed, Reels e Historias. Si Audience Network no convierte, exclúyelo y concentra el presupuesto en las ubicaciones ganadoras.",
    checked: false
  },
  {
    id: "task-6",
    day: "Día 12",
    phase: "week2",
    title: "Optimización de Landing Page por velocidad",
    description: "Si tu CTR en Meta Ads es alto (>2%) pero la conversión es baja, el problema es el tiempo de carga de tu landing o la falta de urgencia/pago contra entrega.",
    checked: false
  },
  {
    id: "task-7",
    day: "Día 14",
    phase: "week2",
    title: "Escalar con Públicos Similares (Lookalike) y Advantage+",
    description: "Si ya acumulaste suficientes compras con el píxel, crea un público similar (lookalike 1-3%) basado en compradores y prueba Advantage+ Shopping Campaigns para escalar.",
    checked: false
  }
];

export default function App() {
  // Application State
  const [selectedProductId, setSelectedProductId] = useState<string>("lemme-burn");
  const [selectedProduct, setSelectedProduct] = useState<Product>(PRODUCTS[0]);
  const [marketingAngle, setMarketingAngle] = useState<string>("direct");
  const [targetAudience, setTargetAudience] = useState<string>("Mujeres de 25-45 años interesadas en salud, bienestar, prevención y suplementación premium.");
  const [extraPrompt, setExtraPrompt] = useState<string>("");
  
  // API Connection State
  const [aiStatus, setAiStatus] = useState({ active: false, configured: false, message: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Generated Ads Strategy Data
  const [adsData, setAdsData] = useState<AdsStructure | null>(null);

  // ROI Calculator Parameters
  const [metrics, setMetrics] = useState<CampaignMetrics>({
    sellingPrice: PRODUCTS[0].suggestedSellPrice,
    dailyBudget: STARTER_META_BUDGET_COP, // COP/day protected starter budget
    cpc: 450, // Average COP per click for health/beauty in LatAm google ads
    conversionRate: 2.2 // percent
  });

  // Currency unit converter toggle (COP standard, but support quick review in USD for global scale)
  const [currency, setCurrency] = useState<"COP" | "USD">("COP");
  const exchangeRate = 4100; // 1 USD = 4100 COP standard placeholder

  // Live preview interactive index selection
  const [pinnedHeadline1, setPinnedHeadline1] = useState<number>(0);
  const [pinnedHeadline2, setPinnedHeadline2] = useState<number>(1);
  const [pinnedHeadline3, setPinnedHeadline3] = useState<number>(2);
  const [pinnedDesc1, setPinnedDesc1] = useState<number>(0);
  const [pinnedDesc2, setPinnedDesc2] = useState<number>(1);
  const [devicePreview, setDevicePreview] = useState<"mobile" | "desktop">("mobile");

  // Active Tab Manager
  const [activeTab, setActiveTab] = useState<"ads" | "keywords" | "landing" | "roi" | "timeline" | "creatives" | "omnichannel" | "ads-account">("ads");

  // Visual Image & Banner Customizer States
  const [creativeStyle, setCreativeStyle] = useState<"cosmetic" | "organic" | "medical" | "gold">("cosmetic");
  const [creativeAspectRatio, setCreativeAspectRatio] = useState<"16:9" | "1:1" | "9:16">("16:9");
  const [creativePromoTag, setCreativePromoTag] = useState<string>("🚚 ENVÍO GRATIS + PAGA EN CASA");
  const [creativeHeadline, setCreativeHeadline] = useState<string>("");
  const [creativeSubheadline, setCreativeSubheadline] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // Real AI-generated product image state
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageConfigured, setImageConfigured] = useState<boolean>(true);

  // Checklist tasks
  const [tasks, setTasks] = useState<OptimizationTask[]>(INITIAL_OPTIMIZATION_TASKS);

  // Real product images customizer state
  const [imageSource, setImageSource] = useState<"real" | "ai">("real");
  const [selectedRealImage, setSelectedRealImage] = useState<string>("");

  // Meta Ads campaign creation states
  const [facebookPages, setFacebookPages] = useState<{ id: string; name: string }[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [launchingCampaign, setLaunchingCampaign] = useState<boolean>(false);
  const [launchResult, setLaunchResult] = useState<{ success: boolean; message: string; campaignId?: string } | null>(null);
  const [customCampaignName, setCustomCampaignName] = useState<string>("");



  // Fetch AI server status and perform initial generation
  useEffect(() => {
    fetch("/api/ai-status")
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(err => console.error("Error fetching AI status:", err));

    fetch("/api/meta-account/pages")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pages) {
          setFacebookPages(data.pages);
          if (data.pages.length > 0) {
            setSelectedPageId(data.pages[0].id);
          }
        }
      })
      .catch(err => console.error("Error fetching Facebook pages:", err));

    // Initial default generation for default product
    const defaultImg = PRODUCT_IMAGES[PRODUCTS[0].id]?.[0]?.src || "";
    setSelectedRealImage(defaultImg);
    handleGenerate(PRODUCTS[0].id, "direct", targetAudience);
  }, []);

  // Update product selection details automatically
  const handleProductChange = (id: string) => {
    const prod = PRODUCTS.find(p => p.id === id);
    if (prod) {
      setSelectedProductId(id);
      setSelectedProduct(prod);
      
      const defaultImg = PRODUCT_IMAGES[id]?.[0]?.src || "";
      setSelectedRealImage(defaultImg);

      // Update recommended audience based on product type
      let aud = "Mujeres de 25-45 años interesadas en salud, bienestar, prevención y suplementación premium.";
      if (id === "lemme-burn") {
        aud = "Hombres y mujeres de 20 a 50 años que buscan acelerar su metabolismo, deportistas y personas enfocadas en la composición corporal y control de ansiedad por dulce.";
      } else if (id === "urofem-gomas") {
        aud = "Mujeres con tendencia a infecciones de vías urinarias, consumidoras de suplementos naturales que prefieren formatos divertidos como gomas masticables.";
      }
      setTargetAudience(aud);

      // Auto update selling price inside state calculator
      setMetrics(prev => ({
        ...prev,
        sellingPrice: prod.suggestedSellPrice
      }));

      // Trigger automatic strategy update
      handleGenerate(id, marketingAngle, aud);
    }
  };

  const handleGenerate = async (
    id: string = selectedProductId, 
    angle: string = marketingAngle, 
    audience: string = targetAudience
  ) => {
    setLoading(true);
    const prod = PRODUCTS.find(p => p.id === id);
    try {
      const response = await fetch("/api/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: prod ? prod.name : id,
          angle: angle,
          targetAudience: audience,
          extraPrompt: extraPrompt
        })
      });
      const data = await response.json();
      setAdsData(data);
      
      // Update the regional AI status container depending on responses/errors
      if (data.error) {
        setAiStatus({
          active: false,
          configured: true,
          message: data.message || "Límite de solicitudes de la API superado."
        });
      } else if (data.fallback) {
        setAiStatus({
          active: false,
          configured: false,
          message: data.message || "Clave API no configurada. Cargando motor de sugerencias."
        });
      } else {
        setAiStatus({
          active: true,
          configured: true,
          message: "IA de Gemini lista para generar campañas personalizadas."
        });
      }

      // Reset pinned indices to reasonable defaults
      setPinnedHeadline1(0);
      setPinnedHeadline2(1);
      setPinnedHeadline3(Math.min(2, (data.headlines?.length || 1) - 1));
      setPinnedDesc1(0);
      setPinnedDesc2(Math.min(1, (data.descriptions?.length || 1) - 1));

      // Preset creative visual designer fields
      if (data.landingPageHeadline) {
        setCreativeHeadline(data.landingPageHeadline);
        setCreativeSubheadline(data.landingPageSubheadline || "");
      }
    } catch (error) {
      console.error("Error generating strategy:", error);
      setAiStatus({
        active: false,
        configured: false,
        message: "No se pudo conectar con el servidor de IA de respaldo."
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate a real product image via the Gemini Imagen endpoint
  const handleGenerateImage = async (
    productName: string = selectedProduct.name,
    style: string = creativeStyle,
    aspectRatio: string = creativeAspectRatio
  ) => {
    setImageLoading(true);
    setImageError(null);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productName,
          style,
          aspectRatio,
          promoTag: creativePromoTag,
          headline: creativeHeadline,
        }),
      });
      const data = await response.json();
      if (!data.configured) {
        setImageConfigured(false);
        setImageError(data.message || "Agrega tu GEMINI_API_KEY para generar imágenes reales.");
        return;
      }
      setImageConfigured(true);
      if (data.success) {
        setGeneratedImage(data.imageBase64);
      } else {
        setImageError(data.message || "No se pudo generar la imagen.");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      setImageError("No se pudo conectar con el servidor para generar la imagen.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!selectedPageId) {
      alert("Por favor, selecciona una página de Facebook.");
      return;
    }
    setLaunchingCampaign(true);
    setLaunchResult(null);

    const campaignName = customCampaignName || `${selectedProduct.name} - Campaña IA`;
    const primaryText = adsData?.primaryTexts?.[0] || "Suplemento premium, pago contra entrega y envío gratis.";
    const headline = creativeHeadline || adsData?.headlines?.[0] || "Comprar Ahora";
    
    const imagePath = imageSource === "ai" && generatedImage 
      ? generatedImage 
      : selectedRealImage || PRODUCT_IMAGES[selectedProductId]?.[0]?.src || "";

    try {
      const response = await fetch("/api/meta-account/create-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedPageId,
          campaignName,
          dailyBudget: Math.min(metrics.dailyBudget, STARTER_META_BUDGET_COP),
          primaryText,
          headline,
          imagePath,
          productId: selectedProductId,
        }),
      });
      const data = await response.json();
      setLaunchResult(data);
    } catch (e) {
      console.error("Error launching campaign:", e);
      setLaunchResult({ success: false, message: "Error al conectar con el servidor." });
    } finally {
      setLaunchingCampaign(false);
    }
  };

  // Auto-generate the product image whenever the product or visual style changes
  useEffect(() => {
    handleGenerateImage(selectedProduct.name, creativeStyle, creativeAspectRatio);
  }, [selectedProduct.id, creativeStyle, creativeAspectRatio]);

  // Quick helper to copy text to clipboard
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // ROI Calculator core calculations
  const calculateROIMetrics = () => {
    const dailySpend = metrics.dailyBudget;
    const clickCost = metrics.cpc;
    const estClicks = Math.floor(dailySpend / clickCost);
    const convRateDec = metrics.conversionRate / 100;
    const estConversions = parseFloat((estClicks * convRateDec).toFixed(2));
    
    // Revenue & Costs
    const retailPrice = metrics.sellingPrice;
    const supplierCost = selectedProduct.supplierCost;
    
    // Per sale profit calculation
    const revenuePerSale = retailPrice;
    const productCostPerSale = supplierCost;
    
    // Calculated cost of Ads per acquisition
    const cpa = estConversions > 0 ? parseFloat((dailySpend / estConversions).toFixed(0)) : 0;
    
    // Gross Revenue & Costs
    const estDailyRevenue = Math.floor(estConversions * retailPrice);
    const estDailySupplierCost = Math.floor(estConversions * supplierCost);
    const estDailyNetProfit = Math.floor(estDailyRevenue - estDailySupplierCost - dailySpend);

    // ROAS (Return on Ad Spend): Revenue / Ad Spend
    const roas = dailySpend > 0 ? parseFloat((estDailyRevenue / dailySpend).toFixed(2)) : 0;
    
    // Break-even CAC: Target Selling Price - Supplier Cost (Max price you can pay for an ad conversion to not lose money)
    const breakEvenCAC = retailPrice - supplierCost;

    return {
      estClicks,
      estConversions,
      cpa,
      estDailyRevenue,
      estDailyNetProfit,
      roas,
      breakEvenCAC
    };
  };

  const calcs = calculateROIMetrics();

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checked: !t.checked } : t));
  };

  // Convert numbers to currency representation
  const formatCurrency = (val: number) => {
    if (currency === "USD") {
      const usdVal = val / exchangeRate;
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(usdVal);
    }
    return new Intl.NumberFormat("es-CO", { 
      style: "currency", 
      currency: "COP", 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF4F6] via-[#FAF6F2] to-[#FFFBF6] text-[#4A3B34] font-sans font-normal" id="apps-container">
      {/* Top Professional Navigation Header */}
      <header className="border-b border-rose-100/85 bg-white/75 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-[0_2px_15px_-4px_rgba(244,63,94,0.06)]" id="main-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-rose-450 rounded-xl text-white shadow-md shadow-pink-200" id="brand-logo">
              <TrendingUp className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-rose-950 tracking-tight flex items-center gap-2">
                Meta Ads Campaign Strategist
                <span className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-full font-semibold">Salud Femenina & Cuidado</span>
              </h1>
              <p className="text-xs text-rose-900/60 font-medium">Dropshipping Inteligente & Redacción Persuasiva para Facebook e Instagram</p>
            </div>
          </div>

          {/* Gemini AI Status Indicator and quick guide */}
          <div 
            className={`flex items-center gap-3 p-2 rounded-xl border shadow-sm transition-all duration-300 ${
              (!aiStatus.active && aiStatus.configured)
                ? "bg-amber-50/90 border-amber-200 text-amber-950" 
                : aiStatus.active 
                  ? "bg-emerald-50/50 border-emerald-100 text-emerald-950" 
                  : "bg-white/90 border-rose-100 text-rose-950"
            }`} 
            id="ai-status"
          >
            <div className="relative">
              <span className={`flex h-2.5 w-2.5 rounded-full ${
                (!aiStatus.active && aiStatus.configured)
                  ? "bg-amber-500" 
                  : aiStatus.active 
                    ? "bg-emerald-500" 
                    : "bg-pink-400"
              }`}></span>
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 top-0 left-0 ${
                (!aiStatus.active && aiStatus.configured)
                  ? "bg-amber-400" 
                  : aiStatus.active 
                    ? "bg-emerald-400" 
                    : "bg-pink-400"
              }`}></span>
            </div>
            <div className="text-xs">
              <p className="font-bold">
                {(!aiStatus.active && aiStatus.configured)
                  ? "Cuota Excedida / Temporizador (429)" 
                  : aiStatus.active 
                    ? "Gemini 3.5 Flash Activo" 
                    : "Modelos Locales Premium"}
              </p>
              <p className="opacity-75 text-[10px]">
                {(!aiStatus.active && aiStatus.configured)
                  ? "Se activó el motor local de alta velocidad para evitar demoras." 
                  : aiStatus.active 
                    ? "Redacción y segmentación en tiempo real por IA." 
                    : "Sugerencias inteligentes pre-configuradas de alto impacto."}
              </p>
            </div>
            {!aiStatus.configured && (
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-pink-400 cursor-help hover:text-pink-600" />
                <div className="absolute right-0 top-6 w-60 p-2 bg-white border border-rose-100 text-[10px] text-rose-800 leading-relaxed rounded shadow-xl hidden group-hover:block z-50">
                  Agrega una variable <code className="text-rose-600 font-bold font-mono">GEMINI_API_KEY</code> en la barra de Ajustes/Secrets de AI Studio para activar la generación 100% personalizada por IA.
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6" id="main-content">
        
        {/* Intro Alert: Value Proposition of health dropshipping */}
        <div className="bg-gradient-to-r from-rose-50/70 via-[#FFF9F6] to-white border border-rose-100 rounded-2xl p-4.5 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm" id="intro-banner">
          <div className="flex gap-3">
            <div className="p-3 bg-rose-100/60 rounded-full text-rose-500 h-11 w-11 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-rose-950 text-sm md:text-base">Estrategia de Ventas y Cumplimiento Contra Entrega (Paga al Recibir)</h3>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                El nicho de salud vaginal y suplementos para mujer tiene alta conversión, pero requiere políticas estrictas de Meta (Facebook/Instagram).
                Nuestras campañas evitan vocabulario médico propenso al rechazo ("curar", "sanar por completo") y destacan el bienestar de confianza con envío gratis.
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-stretch md:self-auto shrink-0 justify-end">
            <span className="text-[11px] bg-white text-rose-800 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1.5 font-semibold shadow-sm">
              <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" /> Sin suspensiones
            </span>
            <span className="text-[11px] bg-white text-rose-800 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1.5 font-semibold shadow-sm">
              <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" /> Alta Conversión
            </span>
          </div>
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-grid">
          
          {/* LEFT PANEL: CONFIGURATION & PRODUCTS SELECTOR (4 COLS) */}
          <div className="lg:col-span-4 space-y-6" id="left-config-panel">
            
            {/* Step 2 & 1 UI: Select Products */}
            <div className="bg-white rounded-2xl border border-rose-100/90 p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.03)]" id="product-selection-card">
              <div className="flex items-center justify-between border-b border-rose-50 pb-3">
                <span className="flex items-center gap-2 text-xs font-bold text-rose-950 uppercase tracking-wider">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-extrabold">1</span>
                  Elegir Producto a Promover
                </span>
                <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full font-bold border border-pink-150">
                  En Bodega Nac.
                </span>
              </div>

              {/* Selector list of products with inventory & cost details */}
              <div className="space-y-3" id="products-list-selector">
                {PRODUCTS.map((prod) => {
                  const isSelected = selectedProductId === prod.id;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleProductChange(prod.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all relative ${
                        isSelected 
                          ? "bg-gradient-to-tr from-[#FFF0F2] to-white border-pink-300 shadow-sm text-rose-950 shadow-pink-100" 
                          : "bg-[#FCFAF8]/80 border-stone-150 hover:bg-rose-50/40 hover:border-pink-200 text-stone-700"
                      }`}
                      id={`prod-btn-${prod.id}`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                        </span>
                      )}
                      
                      <div className="font-extrabold text-sm tracking-tight pr-4 text-rose-950">{prod.name}</div>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-1 italic">{prod.benefit}</p>
                      
                      {/* Price Meta tags */}
                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-rose-50 text-[11px]">
                        <span className="text-stone-500 font-medium">
                          Costo Proveedor: <strong className="text-rose-900">{formatCurrency(prod.supplierCost)}</strong>
                        </span>
                        <span className={prod.stock > 150 ? "text-emerald-600 font-bold" : "text-pink-600 font-bold"}>
                          Stock: <strong>{prod.stock} unds</strong>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Options Config Card */}
            <div className="bg-white rounded-2xl border border-rose-100/90 p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.03)]" id="campaign-config-card">
              <span className="flex items-center gap-2 text-xs font-bold text-rose-950 uppercase tracking-wider border-b border-rose-5 pb-3">
                <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-extrabold">2</span>
                Ángulo y Datos del Comprador
              </span>

              {/* Marketing Angle Radio buttons */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-rose-900/80 block uppercase tracking-wide">Ángulo de Persuasión</label>
                <div className="grid grid-cols-2 gap-2" id="marketing-angle-container">
                  <button
                    onClick={() => setMarketingAngle("direct")}
                    className={`p-2 text-xs rounded-lg border transition-all font-semibold ${
                      marketingAngle === "direct" 
                        ? "bg-pink-50 border-pink-300 text-pink-700 font-bold" 
                        : "bg-stone-50/70 border-stone-200/85 hover:bg-rose-50/30 text-stone-600"
                    }`}
                    id="angle-direct-btn"
                  >
                    🚀 Solución Directa
                  </button>
                  <button
                    onClick={() => setMarketingAngle("authority")}
                    className={`p-2 text-xs rounded-lg border transition-all font-semibold ${
                      marketingAngle === "authority" 
                        ? "bg-pink-50 border-pink-300 text-pink-700 font-bold" 
                        : "bg-stone-50/70 border-stone-200/85 hover:bg-rose-50/30 text-stone-600"
                    }`}
                    id="angle-auth-btn"
                  >
                    🔬 Confianza Científica
                  </button>
                  <button
                    onClick={() => setMarketingAngle("urgency")}
                    className={`p-2 text-xs rounded-lg border transition-all font-semibold ${
                      marketingAngle === "urgency" 
                        ? "bg-pink-50 border-pink-300 text-pink-700 font-bold" 
                        : "bg-stone-50/70 border-stone-200/85 hover:bg-rose-50/30 text-stone-600"
                    }`}
                    id="angle-urgency-btn"
                  >
                    🔥 Escasez & Oferta
                  </button>
                  <button
                    onClick={() => setMarketingAngle("empathy_pain")}
                    className={`p-2 text-xs rounded-lg border transition-all font-semibold ${
                      marketingAngle === "empathy_pain" 
                        ? "bg-pink-50 border-pink-300 text-pink-700 font-bold" 
                        : "bg-stone-50/70 border-stone-200/85 hover:bg-rose-50/30 text-stone-600"
                    }`}
                    id="angle-pain-btn"
                  >
                    🌱 Prevención & Salud
                  </button>
                </div>
              </div>

              {/* Target Audience Inputs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rose-900/80 block flex justify-between uppercase tracking-wide">
                  <span>Público Objetivo Recomendado</span>
                  <span className="text-[10px] text-pink-600 font-bold capitalize">Sugerido para mujer</span>
                </label>
                <textarea
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 bg-[#FFFDFB] border border-rose-100 rounded-xl text-stone-700 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200 resize-none font-sans"
                  placeholder="Ej: Mujeres con molestias urinarias..."
                  id="target-audience-textarea"
                />
              </div>

              {/* Advanced prompt modifications */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-rose-900/80 uppercase tracking-wide">Instrucciones Adicionales (Opcional)</label>
                  <span className="text-[9px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded font-bold">PROMPT EXTRA</span>
                </div>
                <input
                  type="text"
                  value={extraPrompt}
                  onChange={(e) => setExtraPrompt(e.target.value)}
                  placeholder="Ej: Destacar que el envío es discreto..."
                  className="w-full text-xs p-2 bg-[#FFFDFB] border border-rose-100 rounded-lg text-stone-750 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200"
                  id="extra-prompt-input"
                />
              </div>

              {/* Trigger Generation button */}
              <button
                onClick={() => handleGenerate()}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all disabled:from-pink-350 disabled:to-rose-350 text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 mt-2 shadow-sm shadow-pink-200 cursor-pointer"
                id="generate-campaign-btn"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Generando Estructura de Campaña...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    Generar / Actualizar Campaña
                  </>
                )}
              </button>
            </div>

            {/* General Meta Ads Policies Caution Note */}
            <div className="bg-amber-50/55 rounded-2xl border border-amber-100 p-4 space-y-2" id="policies-alert-card">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Normas de Meta Ads (Salud y Bienestar)</span>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed font-sans">
                Meta prohíbe promesas de curas milagrosas, antes/después exagerados o atributos personales sensibles de salud dirigidos al usuario.
                Nuestros textos destacan el <strong className="text-amber-950">"equilibrio natural"</strong>, <strong className="text-amber-950">"fórmula de uso diario"</strong> y <strong className="text-amber-950">"bienestar"</strong> para asegurar aprobaciones rápidas de anuncios.
              </p>
            </div>

          </div>

          {/* MAIN COLUMN & WORKSPACE: TABS WITH DETAILED STRATEGIC OUTPUT (8 COLS) */}
          <div className="lg:col-span-8 space-y-6" id="workspace-panel">
            
            {/* Horizontal Tabs selector */}
            <div className="bg-white/90 p-1.5 rounded-2xl border border-rose-100/90 flex flex-wrap gap-1 shadow-sm" id="navigation-tabs">
              <button
                onClick={() => setActiveTab("ads")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "ads" 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100" 
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-ads-btn"
              >
                <Search className="w-4 h-4" />
                Anuncios Feed/Reels
              </button>
              <button
                onClick={() => setActiveTab("keywords")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "keywords"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100"
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-keywords-btn"
              >
                <Layers className="w-4 h-4" />
                Audiencias
              </button>
              <button
                onClick={() => setActiveTab("landing")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "landing" 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100" 
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-landing-btn"
              >
                <FileText className="w-4 h-4" />
                Landing Page
              </button>
              <button
                onClick={() => setActiveTab("roi")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "roi" 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100" 
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-roi-btn"
              >
                <DollarSign className="w-4 h-4" />
                Calculadora ROI
              </button>
              <button
                onClick={() => setActiveTab("creatives")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "creatives" 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100" 
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-creatives-btn"
              >
                <Image className="w-4 h-4 text-pink-500 animate-pulse" />
                Imágenes y Banners
              </button>
              <button
                onClick={() => setActiveTab("omnichannel")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "omnichannel"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100"
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-omnichannel-btn"
              >
                <Shield className="w-4 h-4" />
                Omnicanal
              </button>
              <button
                onClick={() => setActiveTab("ads-account")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "ads-account"
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100"
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-ads-account-btn"
              >
                <Link2 className="w-4 h-4" />
                Cuenta Meta Ads
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex-1 py-2 px-3 text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "timeline" 
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-sm shadow-pink-100" 
                    : "text-rose-950/60 hover:text-rose-950 hover:bg-rose-50/50"
                }`}
                id="tab-timeline-btn"
              >
                <Calendar className="w-4 h-4" />
                Plan 2 Semanas
              </button>
            </div>

            {adsData && adsData.error && (
              <div className="bg-[#FFF4F5] border border-rose-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-rose-950 animate-fade-in mt-4 mb-2 text-left" id="error-fallback-announcement">
                <AlertCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-rose-950">Motor de Respaldo Premium Activo</h4>
                  <p className="text-[11px] text-[#7c5d4b] leading-relaxed font-sans">
                    {adsData.message || "Se ha superado el límite de solicitudes de la IA. Hemos cargado un conjunto curado de copias y campañas pre-optimizadas de alto rendimiento."}
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: GOOGLE ADS SEARCH RSA COPY & PREVIEW */}
            {activeTab === "ads" && (
              <div className="space-y-6" id="tab-content-ads">
                
                {/* Simulated Loading Skeleton overlay for smoother UX */}
                {loading && !adsData ? (
                  <div className="bg-white rounded-2xl border border-rose-100/90 p-8 space-y-4 animate-pulse shadow-sm">
                    <div className="h-6 bg-rose-100/50 w-1/3 rounded-lg"></div>
                    <div className="h-4 bg-rose-100/50 w-1/2 rounded-lg"></div>
                    <div className="space-y-2 pt-4">
                      <div className="h-4 bg-rose-100/50 rounded-lg"></div>
                      <div className="h-4 bg-rose-100/50 rounded-lg"></div>
                      <div className="h-4 bg-rose-100/50 rounded-lg w-5/6"></div>
                    </div>
                  </div>
                ) : adsData ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="ads-inner-grid">

                    {/* List of Titles & Descriptions */}
                    <div className="xl:col-span-7 space-y-4" id="google-ads-copywriter-resource">
                      {/* Primary texts (Meta "Texto principal") */}
                      <div className="bg-white rounded-2xl border border-rose-100/95 p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.02)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                              Textos Principales (Primary Text)
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">El texto que aparece arriba de la imagen en Feed/Reels. Evita el corte "ver más" manteniéndolo corto.</p>
                          </div>
                          <span className="text-[11px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100 font-bold">Max 125 Caracteres</span>
                        </div>

                        <div className="space-y-2" id="primary-texts-list">
                          {adsData.primaryTexts?.map((text, idx) => (
                            <div key={idx} className="p-3 rounded-xl border bg-stone-50/50 border-stone-150 hover:bg-[#FFF9FA] hover:border-pink-150 text-xs leading-relaxed space-y-2">
                              <div className="flex items-start justify-between border-b border-rose-100/30 pb-1.5">
                                <span className="font-mono text-xs text-rose-900/40 font-bold">P{idx + 1}.</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                  text.length > 125
                                    ? "bg-rose-100 text-rose-600 font-bold"
                                    : "bg-stone-100 text-stone-500"
                                }`}>
                                  {text.length}/125 char
                                </span>
                              </div>
                              <p className="font-medium text-stone-800">{text}</p>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleCopyToClipboard(text, `ptext-${idx}`)}
                                  className="p-1 hover:bg-rose-50 rounded-lg text-rose-450 hover:text-pink-600"
                                  id={`copy-ptext-btn-${idx}`}
                                >
                                  {copiedText === `ptext-${idx}` ? (
                                    <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-rose-100/95 p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.02)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                              Títulos del Anuncio (Headlines)
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">Sugeridos por la IA de marketing directo. Haz clic para anclar a la vista previa del feed.</p>
                          </div>
                          <span className="text-[11px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100 font-bold">Max 40 Caracteres</span>
                        </div>

                        {/* Headlines Grid helper */}
                        <div className="space-y-2 max-h-[290px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rose-100" id="headlines-scroll-list">
                          {adsData.headlines?.map((headline, idx) => {
                            const isP1 = pinnedHeadline1 === idx;
                            const isP2 = pinnedHeadline2 === idx;
                            const isP3 = pinnedHeadline3 === idx;
                            const isPinned = isP1 || isP2 || isP3;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`flex items-center justify-between p-2 rounded-xl border transition-all text-sm ${
                                  isPinned 
                                    ? "bg-[#FFF2F4] border-pink-200 text-rose-950 shadow-sm" 
                                    : "bg-stone-50/50 border-stone-150 hover:bg-[#FFF9FA] hover:border-pink-150 text-stone-700"
                                }`}
                                id={`headline-row-${idx}`}
                              >
                                <span className="font-mono text-xs text-rose-900/40 shrink-0 w-6 font-semibold">{idx + 1}.</span>
                                <span className="font-semibold truncate flex-1 block mr-2 text-xs text-stone-800">{headline}</span>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                    headline.length > 40
                                      ? "bg-rose-100 text-rose-600"
                                      : "bg-stone-100 text-stone-500"
                                  }`}>
                                    {headline.length}/40 char
                                  </span>
                                  
                                  {/* Pin Buttons */}
                                  <div className="flex rounded-lg border border-rose-100/90 overflow-hidden text-[10px] shadow-sm">
                                    <button 
                                      onClick={() => setPinnedHeadline1(idx)}
                                      className={`px-2.5 py-1 font-bold ${isP1 ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "bg-white text-stone-500 hover:text-rose-950"}`}
                                      title="Fijar en Posición 1"
                                      id={`pin-h1-${idx}`}
                                    >
                                      Pos 1
                                    </button>
                                    <button 
                                      onClick={() => setPinnedHeadline2(idx)}
                                      className={`px-2.5 py-1 font-bold ${isP2 ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "bg-white text-stone-500 hover:text-rose-950"}`}
                                      title="Fijar en Posición 2"
                                      id={`pin-h2-${idx}`}
                                    >
                                      Pos 2
                                    </button>
                                    <button 
                                      onClick={() => setPinnedHeadline3(idx)}
                                      className={`px-2.5 py-1 font-bold ${isP3 ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "bg-white text-stone-500 hover:text-rose-950"}`}
                                      title="Fijar en Posición 3"
                                      id={`pin-h3-${idx}`}
                                    >
                                      Pos 3
                                    </button>
                                  </div>

                                  {/* Copy individual */}
                                  <button 
                                    onClick={() => handleCopyToClipboard(headline, `H${idx}`)}
                                    className="p-1 hover:bg-rose-50 rounded-lg text-rose-450 hover:text-pink-600"
                                    id={`copy-hl-btn-${idx}`}
                                  >
                                    {copiedText === `H${idx}` ? (
                                      <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Descriptions lists */}
                      <div className="bg-white rounded-2xl border border-rose-100/95 p-5 space-y-4 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.02)]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                              Descripciones de Enlace (Link Description)
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">Texto breve que aparece bajo el título en el feed. Combina beneficios clave y cierres de garantía.</p>
                          </div>
                          <span className="text-[11px] bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100 font-bold">Max 30 Caracteres</span>
                        </div>

                        <div className="space-y-2.5" id="descriptions-list">
                          {adsData.descriptions?.map((desc, idx) => {
                            const isD1 = pinnedDesc1 === idx;
                            const isD2 = pinnedDesc2 === idx;
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border text-xs leading-relaxed space-y-2 ${
                                  isD1 || isD2
                                    ? "bg-[#FFF2F4] border-pink-200 text-rose-950 shadow-sm"
                                    : "bg-stone-50/50 border-stone-150 text-stone-750 hover:bg-[#FFF9FA]"
                                }`}
                                id={`desc-row-${idx}`}
                              >
                                <div className="flex items-start justify-between border-b border-rose-100/30 pb-1.5">
                                  <span className="font-mono text-xs text-rose-900/40 font-bold">D{idx + 1}.</span>
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                    desc.length > 30
                                      ? "bg-rose-100 text-rose-600 font-bold"
                                      : "bg-stone-100 text-stone-500"
                                  }`}>
                                    {desc.length}/30 char
                                  </span>
                                </div>
                                <p className="font-medium text-stone-800">{desc}</p>
                                
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setPinnedDesc1(idx)}
                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${isD1 ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "bg-white text-stone-500 hover:text-rose-950 border border-rose-100 shadow-sm"}`}
                                    id={`pin-d1-${idx}`}
                                  >
                                    Fijar Desc 1
                                  </button>
                                  <button
                                    onClick={() => setPinnedDesc2(idx)}
                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${isD2 ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "bg-white text-stone-500 hover:text-rose-950 border border-rose-100 shadow-sm"}`}
                                    id={`pin-d2-${idx}`}
                                  >
                                    Fijar Desc 2
                                  </button>
                                  <button
                                    onClick={() => handleCopyToClipboard(desc, `desc-${idx}`)}
                                    className="p-1 hover:bg-rose-50 rounded-lg text-rose-450 hover:text-pink-600"
                                    id={`copy-desc-btn-${idx}`}
                                  >
                                    {copiedText === `desc-${idx}` ? (
                                      <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    {/* LIVE INTERACTIVE PREVIEW PANEL (5 COLS) */}
                    <div className="xl:col-span-5 space-y-6" id="google-ads-mockup-resource">
                       <div className="bg-white rounded-2xl border border-rose-100 p-5 space-y-4 sticky top-24 shadow-[0_4px_25px_-5px_rgba(244,63,94,0.03)]">
                        <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                          <div>
                            <span className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2.5 py-0.5 rounded-full font-bold">Simulación en Vivo</span>
                            <h3 className="text-sm font-extrabold text-rose-950 mt-1">Vista Previa del Feed (Facebook/Instagram)</h3>
                          </div>

                          {/* Device toggle switch */}
                          <div className="flex bg-stone-100/80 p-1 rounded-xl border border-stone-200/60 text-[11px]" id="device-toggle-container">
                            <button
                              onClick={() => setDevicePreview("mobile")}
                              className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all ${devicePreview === "mobile" ? "bg-gradient-to-r from-pink-550 to-rose-500 text-white shadow-sm" : "text-stone-500 hover:text-rose-950"}`}
                              id="device-mobile-btn"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              Móvil
                            </button>
                            <button
                              onClick={() => setDevicePreview("desktop")}
                              className={`p-1.5 rounded-lg flex items-center gap-1 font-bold transition-all ${devicePreview === "desktop" ? "bg-gradient-to-r from-pink-550 to-rose-500 text-white shadow-sm" : "text-stone-500 hover:text-rose-950"}`}
                              id="device-desktop-btn"
                            >
                              <Monitor className="w-3.5 h-3.5" />
                              Escritorio
                            </button>
                          </div>
                        </div>

                        {/* Facebook/Instagram Feed Ad Mockup */}
                        <div className={`mx-auto bg-white text-stone-800 rounded-2xl overflow-hidden font-sans shadow-[0_4px_20px_-6px_rgba(244,63,94,0.08)] border border-rose-100 ${
                          devicePreview === "mobile" ? "max-w-[340px]" : "w-full"
                        }`} id="meta-feed-mockup">

                          {/* Page header row */}
                          <div className="flex items-center gap-2 p-3 pb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                              {selectedProduct.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-extrabold text-stone-900 truncate">Tienda del Bienestar Femenino</p>
                              <p className="text-[10px] text-stone-500">Patrocinado · 🌐</p>
                            </div>
                            <span className="text-stone-400 font-bold text-sm">···</span>
                          </div>

                          {/* Dynamic Primary Text */}
                          <div className="px-3 pb-2 text-xs text-stone-800 leading-relaxed">
                            <p className="line-clamp-3">
                              {adsData.primaryTexts?.[0] || "Este texto principal se completará automáticamente al generar la campaña con nuestro motor."}
                            </p>
                          </div>

                          {/* Image placeholder area */}
                          <div className="w-full aspect-[4/3] bg-stone-100 relative overflow-hidden">
                            <img
                              src={generatedImage || "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=700"}
                              alt="Vista previa del creativo"
                              className="absolute inset-0 w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Link card with headline + description, like Meta's feed ad layout */}
                          <div className="flex items-center justify-between p-3 bg-stone-50 border-t border-stone-100">
                            <div className="min-w-0 pr-2">
                              <p className="text-[10px] text-stone-500 uppercase truncate">tiendabienestarfem.co</p>
                              <a href="#" className="hover:underline text-stone-900 text-xs md:text-sm font-extrabold line-clamp-1 leading-snug block">
                                {adsData.headlines?.[pinnedHeadline1] || "Título de Campaña"}
                              </a>
                              <p className="text-[10px] text-stone-500 truncate">{adsData.descriptions?.[pinnedDesc1] || "Envío gratis hoy"}</p>
                            </div>
                            <button className="shrink-0 bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors">
                              Comprar
                            </button>
                          </div>

                          {/* Drop shipping fast selling triggers inside ad */}
                          <div className="grid grid-cols-2 gap-2 p-3 pt-2 text-[11px] text-stone-700">
                            <div className="p-2 rounded-xl bg-stone-50/80 border border-stone-200/50">
                              <p className="font-extrabold text-rose-950">🚀 Pago al Recibir</p>
                              <span className="text-[9px] text-[#4d5156] block mt-0.5">Pagas en casa sin riesgo</span>
                            </div>
                            <div className="p-2 rounded-xl bg-stone-50/80 border border-stone-200/50">
                              <p className="font-extrabold text-rose-950">📦 Envío Gratis Hoy</p>
                              <span className="text-[9px] text-[#4d5156] block mt-0.5">Entrega rápida nacional</span>
                            </div>
                          </div>
                        </div>

                        {/* Strategy review reasoning bar */}
                        <div className="bg-[#FFF8F8] p-4 rounded-xl border border-rose-100/80 space-y-2 shadow-sm">
                          <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-pink-500" /> Detrás del Enfoque Persuasivo:
                          </h4>
                          <p className="text-[11px] text-stone-600 leading-relaxed italic font-sans">
                            "{adsData.marketingReasoning || "Cargando razonamiento estratégico para mitigar objeciones comunes del sector..."}"
                          </p>
                        </div>

                        {/* Copy All Assets action */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              const allAssetsText = `TEXTOS PRINCIPALES:\n${adsData.primaryTexts?.join("\n")}\n\nTITULOS SUGERIDOS DE ANUNCIO:\n${adsData.headlines?.join("\n")}\n\nDESCRIPCIONES:\n${adsData.descriptions?.join("\n")}`;
                              handleCopyToClipboard(allAssetsText, "all-ads");
                            }}
                            className="w-full bg-[#FFF4F5] hover:bg-[#FFE8EA] transition-colors border border-rose-200/70 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 text-rose-950 shadow-sm"
                            id="copy-all-ads-button"
                          >
                            {copiedText === "all-ads" ? (
                              <>
                                <Check className="w-4 h-4 text-pink-500 font-extrabold" />
                                ¡Copiados todos los anuncios!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                Copiar Todos los Títulos y Descripciones (TXT)
                              </>
                            )}
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white text-center py-12 rounded-2xl border border-rose-100/90 space-y-3 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-pink-400 mx-auto" />
                    <p className="text-sm font-semibold text-rose-950">Cargando estrategia inicial de anuncios...</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: KEYWORDS WITH AGGREGOMETER */}
            {activeTab === "keywords" && (
              <div className="space-y-6" id="tab-content-keywords">
                {adsData ? (
                  <div className="space-y-6" id="keywords-page-container">
                    
                    {/* Header instruction metrics row */}
                    <div className="bg-white p-5 rounded-2xl border border-rose-100/90 space-y-4 shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                            Segmentación de Audiencias y Ubicaciones (Meta Ads)
                          </h2>
                          <p className="text-xs text-stone-500">
                            Diseñado específicamente para el dropshipping colombiano/latam. Combina intereses, públicos similares y las ubicaciones con mejor desempeño.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const audList = `INTERESES DETALLADOS:\n${adsData.audienceInterests?.join("\n")}\n\nIDEAS DE PÚBLICO SIMILAR (LOOKALIKE):\n${adsData.audienceLookalikeIdeas?.join("\n")}\n\nUBICACIONES RECOMENDADAS:\n${adsData.placements?.join("\n")}`;
                            handleCopyToClipboard(audList, "all-kws");
                          }}
                          className="bg-[#FFF4F5] hover:bg-[#FFE8EA] text-rose-950 border border-rose-200/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
                          id="copy-all-keywords-btn"
                        >
                          {copiedText === "all-kws" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" /> Copiado Completo
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copiar Segmentación Completa
                            </>
                          )}
                        </button>
                      </div>

                      {/* Explanation card of targeting types */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-sans">
                        <div className="bg-[#FFF9F9] p-3 rounded-xl border border-rose-100/80 shadow-sm">
                          <p className="text-xs font-extrabold text-pink-650 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                            Intereses Detallados
                          </p>
                          <p className="text-[11px] text-stone-600 mt-1.5">
                            Segmentación por intereses y comportamientos dentro del Administrador de Anuncios. Punto de partida ideal en campañas nuevas.
                          </p>
                        </div>
                        <div className="bg-[#FBF8F5] p-3 rounded-xl border border-rose-100/40 shadow-sm">
                          <p className="text-xs font-extrabold text-[#7c5d4b] flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-450"></span>
                            Públicos Similares (Lookalike)
                          </p>
                          <p className="text-[11px] text-stone-600 mt-1.5">
                            Una vez tengas datos del píxel/CAPI, crea públicos similares a tus compradores reales para escalar con mayor precisión.
                          </p>
                        </div>
                        <div className="bg-rose-50/15 p-3 rounded-xl border border-rose-100/85 shadow-sm">
                          <p className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                            Ubicaciones (Placements)
                          </p>
                          <p className="text-[11px] text-stone-600 mt-1.5">
                            Deja que Meta optimice automáticamente entre Feed, Reels e Historias, o ajusta manualmente según el rendimiento real.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Audience List Panels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="keywords-matchtype-grid">

                      {/* Interests Column */}
                      <div className="bg-white rounded-2xl border border-rose-100 p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                          <span className="text-xs font-extrabold text-rose-950 uppercase tracking-widest text-[10px]">1. Intereses Detallados</span>
                          <span className="text-[9px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-lg border border-pink-100 font-bold">Punto de Partida</span>
                        </div>
                        <div className="space-y-1.5 animate-fade-in" id="exact-keywords-list">
                          {adsData.audienceInterests?.map((kw, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-[#FAF6F3]/50 rounded-xl border border-stone-150 text-[11px] hover:border-pink-200 transition-all">
                              <span className="text-rose-900 font-extrabold truncate pr-2">{kw}</span>
                              <button
                                onClick={() => handleCopyToClipboard(kw, `kwe-${i}`)}
                                className="text-pink-400 hover:text-pink-600 shrink-0 transition-colors"
                                id={`copy-kwe-btn-${i}`}
                              >
                                {copiedText === `kwe-${i}` ? <Check className="w-3.5 h-3.5 text-pink-500 font-black" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lookalike Column */}
                      <div className="bg-white rounded-2xl border border-rose-100 p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                          <span className="text-xs font-extrabold text-rose-950 uppercase tracking-widest text-[10px]">2. Públicos Similares</span>
                          <span className="text-[9px] bg-rose-50 text-purple-600 px-1.5 py-0.5 rounded-lg border border-rose-100 font-bold">Escalamiento</span>
                        </div>
                        <div className="space-y-1.5" id="phrase-keywords-list">
                          {adsData.audienceLookalikeIdeas?.map((kw, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-[#FAF6F3]/50 rounded-xl border border-stone-150 text-[11px] hover:border-pink-200 transition-all">
                              <span className="text-stone-800 font-extrabold truncate pr-2">{kw}</span>
                              <button
                                onClick={() => handleCopyToClipboard(kw, `kwp-${i}`)}
                                className="text-pink-400 hover:text-pink-600 shrink-0 transition-colors"
                                id={`copy-kwp-btn-${i}`}
                              >
                                {copiedText === `kwp-${i}` ? <Check className="w-3.5 h-3.5 text-pink-500 font-black" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Placements Column */}
                      <div className="bg-white rounded-2xl border border-rose-100 p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-rose-50 pb-2">
                          <span className="text-xs font-extrabold text-rose-950 uppercase tracking-widest text-[10px]">3. Ubicaciones</span>
                          <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-lg border border-amber-100 font-bold">Feed/Reels/Stories</span>
                        </div>
                        <div className="space-y-1.5" id="broad-keywords-list">
                          {adsData.placements?.map((kw, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 bg-[#FAF6F3]/50 rounded-xl border border-stone-150 text-[11px] hover:border-pink-200 transition-all">
                              <span className="text-stone-700 font-semibold truncate pr-2">{kw}</span>
                              <button
                                onClick={() => handleCopyToClipboard(kw, `kwb-${i}`)}
                                className="text-pink-400 hover:text-pink-600 shrink-0 transition-colors"
                                id={`copy-kwb-btn-${i}`}
                              >
                                {copiedText === `kwb-${i}` ? <Check className="w-3.5 h-3.5 text-pink-500 font-black" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Exclusions / audience hygiene advice */}
                    <div className="bg-[#FFF5F6] p-5 rounded-2xl border border-rose-100/90 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
                        <Shield className="w-5 h-5 text-rose-500 animate-bounce" />
                        <span className="font-extrabold">Buenas Prácticas de Segmentación (Nicho Femenino)</span>
                      </div>
                      <p className="text-xs text-stone-650 leading-relaxed font-sans">
                        En salud y belleza, segmentar demasiado angosto agota la audiencia rápido y sube el CPM.
                        Deja que Advantage+ Audience amplíe el alcance una vez tengas datos de conversión, y excluye estos públicos de baja intención:
                      </p>

                      <div className="flex flex-wrap gap-2" id="negative-terms-container">
                        {["Empleados de la competencia", "Compradores ya convertidos (excluir)", "Menores de 18 años", "Cazadores de cupones extremos", "Tráfico de bots / clics sospechosos"].map((term, idx) => (
                          <span key={idx} className="bg-white text-rose-700 px-3 py-1 text-xs rounded-xl border border-rose-100 font-bold font-sans shadow-sm hover:scale-105 transition-transform duration-100">
                            - {term}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white text-center py-12 rounded-2xl border border-rose-100 space-y-3 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-pink-400 mx-auto" />
                    <p className="text-sm font-semibold text-rose-950">Genera estrategia primero para ver sugerencia de palabras clave.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: LANDING PAGE WIREFRAME & DESCRIPTIVE COPYWRITING */}
            {activeTab === "landing" && (
              <div className="space-y-6" id="tab-content-landing">
                {adsData ? (
                  <div className="space-y-6" id="landing-page-tab-wrapper">
                    
                    {/* Intro Section */}
                    <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-2 shadow-sm">
                      <h2 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                        Landing Page de Alta Conversión (Estructura Femenina)
                      </h2>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans">
                        Los anuncios de Meta Ads dirigen tráfico de descubrimiento (no de búsqueda activa). Tu Landing Page no debe ser una tienda general aburrida;
                        debe comportarse como un embudo de un <strong className="text-pink-600 font-bold font-sans">único producto (Single Product Store Setup)</strong> optimizado para dispositivos móviles, destacando el <strong className="text-rose-700 font-bold">Envío Gratis</strong> y <strong className="text-rose-700 font-bold">Pago Contra Entrega</strong>.
                      </p>
                    </div>

                    {/* Step-by-Step interactive flow on wireframe */}
                    <div className="border border-rose-100 rounded-2xl overflow-hidden bg-white font-sans shadow-sm" id="wireframe-container">
                      <div className="bg-rose-50/40 px-4 py-2.5 border-b border-rose-100/90 flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900/60 font-sans">Esquema de Embudos Dropshipping</span>
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-300"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-pink-300"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                        </div>
                      </div>

                      {/* Visual Blocks representing sections of the landing site */}
                      <div className="p-4 md:p-6 space-y-6">
                        
                        {/* 1. Header with Fast Shipping announcement */}
                        <div className="border border-dashed border-pink-300/60 rounded-xl p-3 bg-pink-50/20 text-center relative">
                          <span className="absolute -top-3 left-4 bg-pink-500 text-white font-sans text-[9px] px-2 py-0.5 rounded font-bold uppercase shadow-sm">Sección 1: Cintillo de Urgencia</span>
                          <p className="text-xs md:text-sm font-extrabold text-pink-700 flex items-center justify-center gap-1.5 font-sans">
                            <Truck className="w-4 h-4 text-pink-500" />
                            🔥 ENVÍO GRATIS Y PAGO CONTRA ENTREGA (PAGAS AL RECIBIR EN CASA)
                          </p>
                        </div>

                        {/* 2. Hero Headline Copy block */}
                        <div className="border border-dashed border-rose-100/90 rounded-xl p-4 bg-[#FFF9FA]/60 relative space-y-2">
                          <span className="absolute -top-3 left-4 bg-rose-400 text-white font-sans text-[9px] px-2 py-0.5 rounded font-bold uppercase shadow-sm">Sección 2: Propuesta De Valor Irresistible (H1)</span>
                          <div className="flex justify-between items-start gap-4 pt-1">
                            <div className="space-y-1">
                              <h3 className="text-sm md:text-base font-black text-rose-950 tracking-tight leading-snug">
                                {adsData.landingPageHeadline}
                              </h3>
                              <p className="text-xs text-stone-600 leading-relaxed italic font-sans font-medium">
                                {adsData.landingPageSubheadline}
                              </p>
                            </div>
                            <button
                              onClick={() => handleCopyToClipboard(`${adsData.landingPageHeadline}\n${adsData.landingPageSubheadline}`, "h1-lp")}
                              className="p-2 bg-white text-stone-500 hover:text-rose-950 border border-rose-100 rounded-lg hover:bg-rose-50 shadow-sm shrink-0 transition-colors"
                              id="copy-lp-hero-btn"
                            >
                              {copiedText === "h1-lp" ? <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold animate-pulse" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
                            </button>
                          </div>
                        </div>

                        {/* 3. Product Media & Proof section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Simulated Image Placeholder */}
                          <div className="border border-dashed border-rose-150 rounded-xl p-5 bg-[#FCFAF8]/60 flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                            <span className="text-[9px] font-mono bg-pink-50 text-pink-600 px-1.5 py-0.25 rounded font-bold border border-pink-100">Media Box (Espacio Visual)</span>
                            <div className="p-3 bg-pink-100/60 text-pink-500 rounded-full shadow-inner">
                              <Sparkles className="w-6 h-6 animate-pulse" />
                            </div>
                            <p className="text-xs font-extrabold text-rose-950">{selectedProduct.imageAlt}</p>
                            <p className="text-[10px] text-stone-500 leading-normal">Render de Producto / Video promocional 1:1 de 15 segundos demostrando uso o test de producto.</p>
                          </div>

                          {/* Quick high converting bullet indicators */}
                          <div className="border border-dashed border-rose-150 rounded-xl p-4 bg-[#FCFAF8]/60 space-y-2 justify-between flex flex-col">
                            <span className="text-[10px] font-sans font-bold text-rose-900/50 uppercase">Sección 3: Viñetas de Autoridad</span>
                            <div className="space-y-1.5">
                              {adsData.landingPageBullets?.map((bullet, idx) => (
                                <p key={idx} className="text-xs text-stone-750 flex items-start gap-1.5 font-medium">
                                  <Check className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5 font-black" />
                                  <span>{bullet}</span>
                                </p>
                              ))}
                            </div>
                            <div className="pt-2">
                              <button
                                onClick={() => handleCopyToClipboard(adsData.landingPageBullets?.join("\n") || "", "bullets-lp")}
                                className="w-full bg-white hover:bg-rose-50 border border-rose-100 text-rose-950 py-1.5 px-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                id="copy-lp-bullets-btn"
                              >
                                {copiedText === "bullets-lp" ? <Check className="w-3.5 h-3.5 text-pink-500 font-extrabold" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
                                Copiar Viñetas
                              </button>
                            </div>
                          </div>

                        </div>

                        {/* 4. Trust Badges & Guarantee block (Crucial for dropshipping conversions) */}
                        <div className="border border-dashed border-rose-200 rounded-xl p-4 bg-[#FFFBFB]/60 space-y-3 relative">
                          <span className="absolute -top-3 left-4 bg-rose-450 bg-rose-400 text-white font-sans text-[9px] px-2 py-0.5 rounded font-semibold tracking-wider shadow-sm uppercase">Sección 4: Elementos de Seguridad</span>
                          <p className="text-xs font-bold text-rose-950 pt-1.5">Inyección de Confianza y Satisfacción Femenina:</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-[#FCFAF8] rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                              <Shield className="w-5 h-5 text-pink-500 shrink-0" />
                              <div className="text-[10px]">
                                <p className="font-extrabold text-rose-950">100% Original</p>
                                <span className="text-stone-500 font-medium">Proveedor de alta reputación</span>
                              </div>
                            </div>
                            <div className="p-3 bg-[#FCFAF8] rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                              <Truck className="w-5 h-5 text-rose-500 shrink-0" />
                              <div className="text-[10px]">
                                <p className="font-extrabold text-rose-950">Pago al Recibir</p>
                                <span className="text-stone-500 font-medium font-sans">Cero riesgo para tus clientes</span>
                              </div>
                            </div>
                            <div className="p-3 bg-[#FCFAF8] rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                              <RotateCcw className="w-5 h-5 text-pink-400 shrink-0" />
                              <div className="text-[10px]">
                                <p className="font-extrabold text-rose-950">Garantía Total</p>
                                <span className="text-stone-500 font-medium">Reemplazo rápido por falla</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 5. Clear Call to Action */}
                        <div className="border-2 border-dashed border-pink-400/50 rounded-xl p-5 bg-pink-50/10 text-center space-y-3 relative">
                          <span className="absolute -top-3 left-4 bg-pink-500 text-white font-sans text-[9px] px-2 py-0.5 rounded font-bold uppercase shadow-sm">Sección 5: Oferta Comercial Irresistible</span>
                          
                          <div className="max-w-md mx-auto space-y-2 pt-1">
                            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold font-sans">
                              <span>Precio Normal del suplemento: <del className="text-stone-400">{formatCurrency(metrics.sellingPrice * 1.5)}</del></span>
                              <span className="text-pink-600 font-extrabold bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100">¡Ahorra un 33% HOY!</span>
                            </div>
                            <div className="text-2xl font-black text-rose-950">
                              {formatCurrency(metrics.sellingPrice)} COP <span className="text-xs text-stone-500 font-medium">/ Unidad</span>
                            </div>
                            <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black py-3 px-4 rounded-xl text-xs md:text-sm shadow-md shadow-pink-200 flex items-center justify-center gap-1.5 cursor-pointer">
                              <span>PEDIR CONTRA ENTREGA EN UN CLIC</span>
                              <ArrowRight className="w-4.5 h-4.5" />
                            </button>
                            <p className="text-[10px] text-stone-500 font-medium">Quedan pocas unidades en la bodega nacional. Despacho exprés vía Servientrega, Envia o Coordinadora.</p>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-white text-center py-12 rounded-2xl border border-rose-100 space-y-3 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-pink-400 mx-auto" />
                    <p className="text-sm font-semibold text-rose-950">Genera estrategia primero para ver la arquitectura de Landing Page.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ROI CALCULATOR & UNIT ECONOMICS */}
            {activeTab === "roi" && (
              <div className="space-y-6" id="tab-content-roi">
                
                {/* Master Metrics Inputs Column */}
                <div className="bg-white p-5 rounded-2xl border border-rose-100/90 space-y-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-50 pb-3.5">
                    <div>
                      <h2 className="text-base font-black text-rose-950 flex items-center gap-2">
                        Calculadora ROI & Viabilidad de Campaña (Unit Economics)
                      </h2>
                      <p className="text-xs text-stone-500">Ajusta las variables de Meta Ads para visualizar rentabilidades simuladas.</p>
                    </div>

                    {/* Currency Conversion Toggle */}
                    <div className="flex items-center bg-[#FAF6F3] p-1 rounded-xl border border-stone-200/50 text-[11px]" id="currency-toggle-panel">
                      <button 
                        onClick={() => setCurrency("COP")}
                        className={`p-1 px-3 rounded-lg transition-all ${currency === "COP" ? "bg-white text-pink-700 font-extrabold shadow-sm border border-rose-100" : "text-stone-550"}`}
                        id="currency-cop-btn"
                      >
                        COP ($)
                      </button>
                      <button 
                        onClick={() => setCurrency("USD")}
                        className={`p-1 px-3 rounded-lg transition-all ${currency === "USD" ? "bg-white text-pink-700 font-extrabold shadow-sm border border-rose-100" : "text-stone-550"}`}
                        id="currency-usd-btn"
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  {/* Range Sliders Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="sliders-container animate-fade-in">
                    
                    {/* Input: Target Selling Price */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#7c5d4b]">Precio de Venta Sugerido</span>
                        <span className="font-mono text-pink-600 font-black">{formatCurrency(metrics.sellingPrice)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={selectedProduct.supplierCost + 15000} 
                        max={selectedProduct.supplierCost + 120000} 
                        step={5000}
                        value={metrics.sellingPrice} 
                        onChange={(e) => setMetrics({ ...metrics, sellingPrice: parseInt(e.target.value) })}
                        className="w-full accent-pink-500 h-1 bg-[#FAF6F3] rounded-lg cursor-pointer"
                        id="slider-sellprice"
                      />
                      <span className="text-[10px] text-stone-450 block">Costo Proveedor de fábrica ({formatCurrency(selectedProduct.supplierCost)}) no editable. Margen bruto de partida.</span>
                    </div>

                    {/* Input: Daily Ad Spend Budget */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#7c5d4b]">Presupuesto Diario de Meta Ads</span>
                        <span className="font-mono text-rose-950 font-black">{formatCurrency(metrics.dailyBudget)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={5000} 
                        max={STARTER_META_BUDGET_COP} 
                        step={5000}
                        value={metrics.dailyBudget} 
                        onChange={(e) => setMetrics({ ...metrics, dailyBudget: Math.min(parseInt(e.target.value), STARTER_META_BUDGET_COP) })}
                        className="w-full accent-pink-500 h-1 bg-[#FAF6F3] rounded-lg cursor-pointer"
                        id="slider-dailybudget"
                      />
                      <span className="text-[10px] text-stone-450 block">Presupuesto diario protegido para empezar con recarga pequeña: máximo {formatCurrency(STARTER_META_BUDGET_COP)}.</span>
                    </div>

                    {/* Input: Est. Average CPC (Cost per Click) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#7c5d4b]">Costo por Clic Promedio (CPC)</span>
                        <span className="font-mono text-stone-850 font-black">{formatCurrency(metrics.cpc)}</span>
                      </div>
                      <input 
                        type="range" 
                        min={200} 
                        max={1200} 
                        step={20}
                        value={metrics.cpc} 
                        onChange={(e) => setMetrics({ ...metrics, cpc: parseInt(e.target.value) })}
                        className="w-full accent-pink-500 h-1 bg-[#FAF6F3] rounded-lg cursor-pointer"
                        id="slider-cpc"
                      />
                      <span className="text-[10px] text-stone-450 block">Rango LatAm: 300 COP a 600 COP es el CPC típico en salud femenina y bienestar corporal.</span>
                    </div>

                    {/* Input: Est. Landing Page Conversion Rate (%) */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#7c5d4b]">Porcentaje de Conversión</span>
                        <span className="font-mono text-pink-600 font-black">{metrics.conversionRate}%</span>
                      </div>
                      <input 
                        type="range" 
                        min={0.5} 
                        max={6} 
                        step={0.1}
                        value={metrics.conversionRate} 
                        onChange={(e) => setMetrics({ ...metrics, conversionRate: parseFloat(e.target.value) })}
                        className="w-full accent-pink-500 h-1 bg-[#FAF6F3] rounded-lg cursor-pointer"
                        id="slider-cr"
                      />
                      <span className="text-[10px] text-stone-450 block">Promedio para Landing Page estructurada: 1.5% a 3.5% es estándar para embudos de pago en casa.</span>
                    </div>

                  </div>
                </div>

                {/* Simulated ROI metrics output dashboards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="roi-numeric-dash">
                  
                  {/* Clicks & Traffic volume */}
                  <div className="bg-[#FFF9F9] hover:bg-[#FFF5F6] transition-colors rounded-2xl border border-rose-150 p-4 space-y-1.5 shadow-sm text-rose-950">
                    <p className="text-[11px] text-rose-900/60 uppercase font-bold">Clics Estimados / Día</p>
                    <div className="text-xl font-mono text-rose-950 font-black">{calcs.estClicks} <span className="text-xs text-stone-500 font-normal">visitas</span></div>
                    <p className="text-[10px] text-stone-500">Atraídos según tu CPC promedio.</p>
                  </div>

                  {/* Conversions volume */}
                  <div className="bg-[#FFF9F9] hover:bg-[#FFF5F6] transition-colors rounded-2xl border border-rose-150 p-4 space-y-1.5 shadow-sm text-role-950">
                    <p className="text-[11px] text-rose-900/60 uppercase font-bold">Ventas Estimadas / Día</p>
                    <div className="text-xl font-mono text-pink-600 font-black">{calcs.estConversions} <span className="text-xs text-stone-500 font-normal">compras</span></div>
                    <p className="text-[10px] text-stone-500">Basado en tu tasa de conversión.</p>
                  </div>

                  {/* CPA calculated */}
                  <div className="bg-[#FFF9F9] hover:bg-[#FFF5F6] transition-colors rounded-2xl border border-rose-150 p-4 space-y-1.5 shadow-sm text-rose-950">
                    <p className="text-[11px] text-rose-900/60 uppercase font-bold">CPA Promedio (Estimado) dispuesto</p>
                    <div className="text-xl font-mono text-rose-950 font-black">{formatCurrency(calcs.cpa)}</div>
                    <p className="text-[10px] text-stone-500">Costo por adquisición publicitaria.</p>
                  </div>

                  {/* Break even CAC threshold */}
                  <div className="bg-[#FFF9F9] hover:bg-[#FFF5F6] transition-colors rounded-2xl border border-rose-150 p-4 space-y-1.5 shadow-sm text-rose-950">
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] text-rose-900/60 uppercase font-bold">CAC Límite de Empate</p>
                      <Info className="w-3.5 h-3.5 text-stone-400" title="Costo de adquisición publicitaria máximo permitido para no tener pérdidas de dropshipping" />
                    </div>
                    <div className="text-xl font-mono text-rose-800 font-black">{formatCurrency(calcs.breakEvenCAC)}</div>
                    <p className="text-[10px] text-stone-500">Si tu CPA supera esto, el anuncio pierde dinero.</p>
                  </div>

                </div>

                {/* Major KPI analysis block */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="major-roi-metrics">
                  
                  {/* Daily / Monthly Cashflows forecast block */}
                  <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-4 shadow-sm text-rose-950">
                    <h3 className="text-xs font-bold text-[#7c5d4b] uppercase tracking-wider">Pronóstico de Retornos Económicos</h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-600 font-medium">Ingresos Brutos Diarios:</span>
                        <span className="font-mono text-rose-950 font-bold">{formatCurrency(calcs.estDailyRevenue)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-600 font-medium">Inversión en Meta Ads Diario:</span>
                        <span className="font-mono text-pink-600 font-normal">- {formatCurrency(metrics.dailyBudget)}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-stone-600 font-medium">Costo de Inventario Dropshipping Diario:</span>
                        <span className="font-mono text-pink-600 font-normal">- {formatCurrency(Math.floor(calcs.estConversions * selectedProduct.supplierCost))}</span>
                      </div>

                      <div className="h-px bg-rose-50 my-2"></div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#4A382C] font-extrabold text-sm font-sans">Ganancia Neta Diaria Estimada:</span>
                        <span className={`font-mono text-lg font-black ${calcs.estDailyNetProfit > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                          {calcs.estDailyNetProfit > 0 ? "+" : ""}{formatCurrency(calcs.estDailyNetProfit)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center bg-[#FAF6F3]/60 p-3 rounded-xl border border-stone-200/40 text-xs">
                        <span className="text-stone-600 font-medium">Ganancia Mensual Proyectada:</span>
                        <span className={`font-mono font-black ${calcs.estDailyNetProfit > 0 ? "text-emerald-600 text-sm" : "text-amber-600"}`}>
                          {calcs.estDailyNetProfit > 0 ? "+" : ""}{formatCurrency(calcs.estDailyNetProfit * 30)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Return On Ad Spend indicator (ROAS metric review) */}
                  <div className="bg-white p-5 rounded-2xl border border-rose-100 flex flex-col justify-between space-y-4 shadow-sm text-rose-950">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-[#7c5d4b] uppercase tracking-wider">Retorno de Inversión Publicitaria (ROAS)</h3>
                        <span className={`font-mono px-2 py-0.5 rounded-lg text-xs font-black ${
                          calcs.roas >= 2.5 ? "bg-[#EFFBF2] text-[#1e6b37] border border-emerald-100" : calcs.roas >= 1.5 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-red-50 text-red-700 border border-rose-100"
                        }`}>
                          ROAS: {calcs.roas}x
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                        Un ROAS de <strong className="text-pink-600 font-extrabold">{calcs.roas}x</strong> significa que por cada peso invertido en Meta Ads, recuperas <strong className="text-stone-850 font-bold">{calcs.roas} pesos</strong> en ventas brutas.
                      </p>
                    </div>

                    {/* Progress slider bar indicating ROAS safety zones */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-[10px] text-stone-450 font-mono font-bold">
                        <span>Min (0.5x)</span>
                        <span>Rentable (2.0x)</span>
                        <span>Escalable (3.5x+)</span>
                      </div>
                      
                      <div className="w-full bg-[#FAF6F3] rounded-full h-3.5 p-0.5 border border-[#eee5df]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            calcs.roas >= 2.5 ? "bg-[#F38198]" : calcs.roas >= 1.5 ? "bg-amber-400" : "bg-rose-450"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, (calcs.roas / 4.5) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pro recommendation for dropshipper */}
                    <div className="p-3.5 rounded-xl border text-[11px] font-sans">
                      {calcs.roas >= 2.5 ? (
                        <p className="text-[#155724] font-bold">
                          ✓ ¡Fórmula Estable de Alto Margen! Con esta segmentación y un CPA equilibrado, tienes luz verde para duplicar el presupuesto diario gradualmente.
                        </p>
                      ) : calcs.roas >= 1.5 ? (
                        <p className="text-[#856404] font-bold font-sans">
                          ⚠ Escenario de margen controlado. Para subir el ROAS, enfócate en optimizar los ganchos de tu landing page o renegocia costos de flete contra entrega.
                        </p>
                      ) : (
                        <p className="text-[#721c24] font-bold">
                          ❌ Nivel crítico. Tu costo de conversión es alto comparado con el margen del suplemento. Revisa de inmediato tus ofertas negativas o disminuye tu CPC promedio.
                        </p>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: VISUAL AD CREATOR & BRAND IMAGE CONCEPT PLANNER */}
            {activeTab === "creatives" && (
              <div className="space-y-6 animate-fade-in" id="tab-content-creatives">
                
                {/* Introduction header */}
                <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-2 shadow-sm text-rose-950">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
                    <h2 className="text-base font-black animate-fade-in text-rose-950">
                      Diseñador y Planificador de Creativos Visuales
                    </h2>
                  </div>
                  <p className="text-xs text-stone-650 leading-relaxed font-sans">
                    Personaliza conceptos de anuncios visuales de alta conversión en tiempo real. Configura formatos para Feed, Reels o Stories de Facebook e Instagram, obtén ganchos de diseño y genera prompts óptimos para Canva e inteligencias artificiales generativas de imagen.
                  </p>
                </div>

                {/* Sub layout grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* CONFIG PANEL: 5 COLS */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="bg-white rounded-2xl border border-rose-100 p-4 space-y-4 shadow-sm text-rose-950">
                      <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider pb-2 border-b border-rose-50 flex items-center justify-between">
                        <span>Controles de Imagen</span>
                        <span className="text-[10px] text-pink-500 lowercase font-mono font-normal">ajuste en vivo</span>
                      </h3>

                      {/* Image Source Selection */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Origen de la Imagen</label>
                        <div className="grid grid-cols-2 gap-1.5 text-xs font-sans">
                          <button
                            onClick={() => setImageSource("real")}
                            className={`p-2 rounded-xl border transition-all text-center cursor-pointer font-bold ${imageSource === "real" ? "bg-[#FFF4F5] border-pink-300 text-pink-600" : "bg-[#FCFAF8] border-stone-200/50 text-stone-600 hover:text-stone-900"}`}
                          >
                            📷 Foto Real
                          </button>
                          <button
                            onClick={() => setImageSource("ai")}
                            className={`p-2 rounded-xl border transition-all text-center cursor-pointer font-bold ${imageSource === "ai" ? "bg-[#FFF4F5] border-pink-300 text-pink-600" : "bg-[#FCFAF8] border-stone-200/50 text-stone-600 hover:text-stone-900"}`}
                          >
                            ✨ Generar con IA
                          </button>
                        </div>
                      </div>

                      {/* Real Image Gallery (only shown if real selected) */}
                      {imageSource === "real" && PRODUCT_IMAGES[selectedProductId] && (
                        <div className="space-y-2 border-t border-rose-50/50 pt-2">
                          <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Selecciona Foto del Producto</label>
                          <div className="flex gap-2 overflow-x-auto pb-1.5">
                            {PRODUCT_IMAGES[selectedProductId].map((img, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedRealImage(img.src)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedRealImage === img.src ? "border-pink-500 scale-95 shadow-md shadow-pink-100" : "border-stone-200 hover:border-pink-350"}`}
                                title={img.label}
                              >
                                <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Aspect Ratio controller */}
                      <div className="space-y-2 border-t border-rose-50/50 pt-2">
                        <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Formato / Relación de Aspecto</label>
                        <div className="grid grid-cols-3 gap-1.5 text-xs font-sans">
                          <button
                            onClick={() => setCreativeAspectRatio("16:9")}
                            className={`p-2 rounded-xl border transition-all text-center cursor-pointer font-bold ${creativeAspectRatio === "16:9" ? "bg-[#FFF4F5] border-pink-300 text-pink-600" : "bg-[#FCFAF8] border-stone-200/50 text-stone-600 hover:text-stone-900"}`}
                          >
                            Horiz. (16:9)
                          </button>
                          <button
                            onClick={() => setCreativeAspectRatio("1:1")}
                            className={`p-2 rounded-xl border transition-all text-center cursor-pointer font-bold ${creativeAspectRatio === "1:1" ? "bg-[#FFF4F5] border-pink-300 text-pink-600" : "bg-[#FCFAF8] border-stone-200/50 text-stone-600 hover:text-stone-900"}`}
                          >
                            Cuadrado (1:1)
                          </button>
                          <button
                            onClick={() => setCreativeAspectRatio("9:16")}
                            className={`p-2 rounded-xl border transition-all text-center cursor-pointer font-bold ${creativeAspectRatio === "9:16" ? "bg-[#FFF4F5] border-pink-300 text-pink-600" : "bg-[#FCFAF8] border-stone-200/50 text-stone-600 hover:text-stone-900"}`}
                          >
                            Vertical (9:16)
                          </button>
                        </div>
                      </div>

                      {/* Visual Backdrop Preset styles */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Estilo Visual y Paleta de Color</label>
                        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
                          <button
                            onClick={() => setCreativeStyle("cosmetic")}
                            className={`p-2 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer font-bold ${creativeStyle === "cosmetic" ? "bg-[#FFF4F5] border-pink-300 text-pink-700 font-extrabold" : "bg-white border-[#eee5df] text-[#7c5d4b] hover:bg-stone-50"}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-pink-400 shrink-0"></span>
                            Nude / Cosmético
                          </button>
                          <button
                            onClick={() => setCreativeStyle("organic")}
                            className={`p-2 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer font-bold ${creativeStyle === "organic" ? "bg-[#FFF4F5] border-pink-300 text-pink-700 font-extrabold" : "bg-white border-[#eee5df] text-[#7c5d4b] hover:bg-stone-50"}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-[#1e6b37] shrink-0"></span>
                            Fresco / Orgánico
                          </button>
                          <button
                            onClick={() => setCreativeStyle("medical")}
                            className={`p-2 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer font-bold ${creativeStyle === "medical" ? "bg-[#FFF4F5] border-pink-300 text-pink-700 font-extrabold" : "bg-white border-[#eee5df] text-[#7c5d4b] hover:bg-stone-50"}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0"></span>
                            Médico / Clínico
                          </button>
                          <button
                            onClick={() => setCreativeStyle("gold")}
                            className={`p-2 rounded-xl border transition-all text-left flex items-center gap-1.5 cursor-pointer font-bold ${creativeStyle === "gold" ? "bg-[#FFF4F5] border-pink-300 text-pink-700 font-extrabold" : "bg-white border-[#eee5df] text-[#7c5d4b] hover:bg-stone-50"}`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                            Prestigio / Oro
                          </button>
                        </div>
                      </div>

                      {/* Promo tag text input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Texto de Oferta Inmediata</label>
                        <input
                          type="text"
                          value={creativePromoTag}
                          onChange={(e) => setCreativePromoTag(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#FCFAF8] border border-rose-100 rounded-xl text-rose-950 focus:outline-none focus:border-rose-300"
                          placeholder="Ej: ENVÍO GRATIS + PAGA CONTRA ENTREGA"
                        />
                      </div>

                      {/* Custom banner headline overlay text input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-[#7c5d4b] block font-sans">Título Principal en la Imagen</label>
                        <textarea
                          rows={2}
                          value={creativeHeadline}
                          onChange={(e) => setCreativeHeadline(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#FCFAF8] border border-rose-100 rounded-xl text-rose-950 focus:outline-none focus:border-rose-300 resize-none"
                          placeholder="Ej: El secreto mejor guardado de tu bienestar"
                        />
                      </div>

                      {/* Custom banner subheadline overlay text input */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Subtítulo Descriptivo</label>
                        <textarea
                          rows={2}
                          value={creativeSubheadline}
                          onChange={(e) => setCreativeSubheadline(e.target.value)}
                          className="w-full text-xs p-2.5 bg-[#FCFAF8] border border-rose-100/90 rounded-xl text-rose-950 focus:outline-none focus:border-rose-300 resize-none"
                          placeholder="Compensa el ph y previene de forma 100% discreta."
                        />
                      </div>

                    </div>

                    {/* Pro recommendation for visual creatives */}
                    <div className="bg-[#FAF6F3] border border-stone-200/50 rounded-2xl p-4 space-y-2 text-xs">
                      <p className="font-extrabold text-rose-950 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0 text-pink-500" /> Sourcing para Dropshipping:
                      </p>
                      <p className="text-[11px] text-stone-605 leading-relaxed font-sans">
                        Dado que vendes por dropshipping, puedes solicitar al proveedor nacional (a través de Dropi o tu plataforma) el <strong>"Media Kit de Contenidos"</strong>. Suelen tener fotos limpias que puedes recortar e insertar encima de fondos atractivos generados con IA para lograr un look de venta inigualable.
                      </p>
                    </div>
                  </div>

                  {/* VISUAL SCREEN OVERLAY PREVIEWER: 7 COLS */}
                  <div className="md:col-span-7 space-y-4">
                    
                    {/* Live simulated image block */}
                    <div className="bg-white rounded-2xl border border-rose-100 p-4 space-y-4 shadow-sm text-rose-950 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-rose-50 pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-rose-950">
                            Render Creativo en Vivo (Maqueta de Banner)
                          </h4>
                          <p className="text-[10px] text-stone-500">Estilos responsivos según tus directivas de campaña y relación de aspecto.</p>
                        </div>
                        <span className="text-[10px] bg-rose-50 border border-rose-100/90 font-mono text-rose-950 font-bold px-2.5 py-0.5 rounded-lg">
                          {creativeAspectRatio === "16:9" ? "1200 x 628 (Enlace/Feed Horizontal)" : creativeAspectRatio === "1:1" ? "1080 x 1080 (Feed)" : "1080 x 1920 (Story/Reels)"}
                        </span>
                      </div>

                      {/* Render Container with dynamic aspect ratios styling */}
                      <div className="flex justify-center items-center bg-stone-50 border border-stone-200/40 p-3 rounded-2xl min-h-[380px] overflow-hidden">
                        <div 
                          className="relative overflow-hidden rounded shadow-2xl transition-all duration-300 w-full flex flex-col justify-end"
                          style={{
                            aspectRatio: creativeAspectRatio === "16:9" ? "16/9" : creativeAspectRatio === "1:1" ? "1/1" : "9/16",
                            maxHeight: creativeAspectRatio === "9:16" ? "420px" : "none",
                            maxWidth: creativeAspectRatio === "9:16" ? "240px" : "100%",
                          }}
                        >
                          {/* Loading overlay while the real AI image is being generated */}
                          {imageLoading && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-rose-950/70 text-white">
                              <RefreshCw className="w-6 h-6 animate-spin" />
                              <span className="text-[11px] font-bold">Generando imagen real con IA...</span>
                            </div>
                          )}

                          {/* Premium Background image: real AI-generated image if available, otherwise a stock placeholder */}
                          <img
                            src={
                              imageSource === "ai" && generatedImage
                                ? generatedImage
                                : imageSource === "real" && selectedRealImage
                                ? selectedRealImage
                                : selectedProductId === "lemme-burn"
                                ? (creativeStyle === "cosmetic" ? "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=700"
                                  : creativeStyle === "organic" ? "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=700"
                                  : creativeStyle === "medical" ? "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=700"
                                  : "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=700")
                                : selectedProductId === "urofem-gomas"
                                  ? "/images/urofem_gomas.jpg"
                                  : "/images/uro_floating.png"
                            }
                            alt="Background premium layout"
                            className="absolute inset-0 w-full h-full object-cover brightness-[0.5]"
                            referrerPolicy="no-referrer"
                          />

                          {/* Gradient shader overlays to force visual hierarchy & readability */}
                          <div className={`absolute inset-0 bg-gradient-to-t ${
                            creativeStyle === "cosmetic" ? "from-indigo-950/95 via-indigo-950/40"
                              : creativeStyle === "organic" ? "from-emerald-950/95 via-emerald-950/40"
                              : creativeStyle === "medical" ? "from-teal-950/95 via-teal-950/40"
                              : "from-amber-950/95 via-slate-950/40"
                          } to-transparent`} />

                          {/* Render overlays (Headline, tags, badge) */}
                          <div className={`absolute inset-x-0 bottom-0 p-4 shrink-0 flex flex-col justify-end text-left space-y-2.5 z-10 ${
                            creativeAspectRatio === "9:16" ? "h-full" : ""
                          }`}>
                            
                            {/* Promo Batch Tag */}
                            <div className="flex">
                              <span className={`text-[9px] md:text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded inline-block text-white shadow ${
                                creativeStyle === "cosmetic" ? "bg-[#EA5A6F]"
                                  : creativeStyle === "organic" ? "bg-emerald-605"
                                  : creativeStyle === "medical" ? "bg-[#187585]"
                                  : "bg-amber-600"
                              }`}>
                                {creativePromoTag || "PROMOCIÓN PRINCIPAL"}
                              </span>
                            </div>

                            {/* Headline */}
                            <h2 className={`font-extrabold text-[#FDFBFA] leading-tight tracking-tight ${
                              creativeAspectRatio === "9:16" ? "text-base mt-auto" : "text-sm md:text-base lg:text-lg"
                            }`}>
                              {creativeHeadline || "Suplemento Premium de Salud Íntima"}
                            </h2>

                            {/* Subhead details */}
                            <p className="text-[10px] text-stone-200 line-clamp-2 leading-relaxed font-sans">
                              {creativeSubheadline || "Restaura tu flora y siéntete segura todos los días con cepas investigadas de alta supervivencia."}
                            </p>

                            {/* Trust badges footer inside the visual banner */}
                            <div className="flex gap-2.5 pt-1.5 text-[9px] text-stone-250 font-sans flex-wrap border-t border-stone-500/10">
                              <span className="flex items-center gap-1 shrink-0 font-bold">
                                <Check className="w-3 h-3 text-[#EA5A6F] font-bold" /> Pago al Recibir
                              </span>
                              <span className="flex items-center gap-1 shrink-0 font-bold">
                                <Check className="w-3 h-3 text-[#EA5A6F] font-bold" /> Envío Gratis
                              </span>
                            </div>

                          </div>

                          {/* Extra floating discount tag */}
                          <div className="absolute top-3.5 right-3.5 z-20">
                            <span className="bg-[#EA5A6F] font-bold font-sans text-white text-[9px] leading-tight h-10 w-10 flex items-center justify-center rounded-full shadow-lg border border-pink-100/50 animate-pulse text-center">
                              PAGA<br/>EN<br/>CASA
                            </span>
                          </div>

                        </div>
                      </div>

                      {/* Real AI image generation status + manual regenerate control */}
                      <div className="flex items-center justify-between gap-3 bg-[#FAF6F3] border border-stone-200/50 rounded-xl p-3">
                        <div className="text-[11px] text-stone-600 leading-relaxed">
                          {!imageConfigured ? (
                            <span className="text-amber-700 font-bold">{imageError || "Agrega tu GEMINI_API_KEY para generar imágenes reales."}</span>
                          ) : imageError ? (
                            <span className="text-rose-700 font-bold">{imageError}</span>
                          ) : generatedImage ? (
                            <span className="text-emerald-700 font-bold">✓ Imagen real generada con Gemini Imagen para este producto y estilo.</span>
                          ) : (
                            <span>La imagen se genera automáticamente al elegir producto o estilo.</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleGenerateImage()}
                          disabled={imageLoading}
                          className="shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
                          id="regenerate-image-btn"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Regenerar Imagen
                        </button>
                      </div>

                      {/* Prompt Output section for Copying to AI models */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-rose-950 block flex items-center gap-1 font-sans">
                            <Layers className="w-3.5 h-3.5 text-pink-500" /> Prompt Pro para Generación (Midjourney, DALL-E, Gemini)
                          </label>
                          <span className="text-[10px] text-pink-600 font-extrabold font-mono">Listo para copiar</span>
                        </div>
                        <div className="relative">
                          <textarea
                            readOnly
                            rows={3}
                            value={`Commercial product photography of ${
                              selectedProductId === "lemme-burn" 
                                ? "a sleek modern white pill bottle labeled 'LEMME BURN 60 CAPS'" 
                                : selectedProductId === "urofem-gomas" 
                                  ? "a neat pharmaceutical pink container labeled 'UROFEM PROBIOTICOS'" 
                                  : "a pristine medical medicine jar labeled 'URO VAGINAL PROBIOTICOS'"
                            }, ${
                              creativeStyle === "cosmetic" ? "high-end minimalist fashion styling, soft shadows, warm beige color palette, ambient sunlight, studio photography, cinematic lighting"
                                : creativeStyle === "organic" ? "fresh green concept, citrus slices of grapefruit, green tea leaves, splash of crystal clear water, eco-friendly branding aesthetic, vibrant natural lighting"
                                : creativeStyle === "medical" ? "clean clinical teal background, professional laboratory concept, waterlily petals, pristine geometric shapes, showing purity and microbiome protection"
                                : "ultra premium prestige black and gold background, elegant dark luxury cosmetic style, podium with warm backlight, golden accents"
                            }, product presentation, centered composition, copy-space on the layout sides, extremely realistic, highly detailed textures, 8k resolution.`}
                            className="w-full text-xs p-3 font-mono bg-[#FCFAF8] border border-[#eee5df] rounded-xl text-stone-600 pr-10 focus:outline-none select-all"
                          />
                          <button
                            onClick={() => {
                              const pText = `Commercial product photography of ${
                                selectedProductId === "lemme-burn" ? "a sleek modern white pill bottle labeled 'LEMME BURN 60 CAPS'" : selectedProductId === "urofem-gomas" ? "a neat pharmaceutical pink container labeled 'UROFEM PROBIOTICOS'" : "a pristine medical medicine jar labeled 'URO VAGINAL PROBIOTICOS'"
                              }, ${
                                creativeStyle === "cosmetic" ? "high-end minimalist fashion styling, soft shadows, warm beige color palette, ambient sunlight, studio photography, cinematic lighting" : creativeStyle === "organic" ? "fresh green concept, citrus slices of grapefruit, green tea leaves, splash of crystal clear water, eco-friendly branding aesthetic, vibrant natural lighting" : creativeStyle === "medical" ? "clean clinical teal background, professional laboratory concept, waterlily petals, pristine geometric shapes, showing purity and microbiome protection" : "ultra premium prestige black and gold background, elegant dark luxury cosmetic style, podium with warm backlight, golden accents"
                              }, product presentation, centered composition, copy-space on the layout sides, extremely realistic, highly detailed textures, 8k resolution.`;
                              handleCopyToClipboard(pText, "ai-prompt");
                            }}
                            className="absolute top-2.5 right-2.5 p-2 bg-white border border-rose-100 hover:bg-rose-50 rounded-lg text-pink-500 shadow-sm transition-all cursor-pointer"
                            title="Copiar prompt"
                            id="copy-prompt-btn"
                          >
                            {copiedText === "ai-prompt" ? (
                              <Check className="w-4 h-4 text-pink-600 font-extrabold" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed italic font-sans animate-fade-in">
                          "Ingresa este prompt en tu generador preferido para generar imágenes complementarias y fotos fotorrealistas de producto de alta calidad en 1 segundo."
                        </p>
                      </div>

                    </div>
                  </div>

                </div>

                {/* AUTOMATED CAMPAIGN LAUNCHER PANEL */}
                <div className="bg-white rounded-2xl border border-rose-100 p-5 space-y-4 shadow-sm text-rose-950 mt-6">
                  <div className="flex items-center gap-2 border-b border-rose-50 pb-3">
                    <div className="p-2 bg-[#FFF4F5] rounded-xl text-pink-500">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-rose-950">
                        🚀 Lanzamiento Rápido en Meta Ads (Borrador Seguro)
                      </h3>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Crea la campaña estructurada en tu cuenta real de Facebook e Instagram. Se creará en estado <strong>Pausado (Borrador)</strong> para que solo pagues y apruebes al final en el panel oficial de Meta.
                      </p>
                    </div>
                  </div>

                  {facebookPages.length === 0 ? (
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                      ⚠️ <strong>Para lanzar la campaña:</strong> Primero conecta tu cuenta real de Meta Ads agregando tus credenciales en el panel de Render. Si ya lo hiciste, asegúrate de que tu Token de Acceso tenga el permiso de páginas (`pages_show_list` o `pages_read_engagement` si es una cuenta comercial) o usa un Token de Usuario del Explorador que administre tu página de Facebook.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-3.5">
                        {/* Page selection */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Seleccionar Página de Facebook</label>
                          <select
                            value={selectedPageId}
                            onChange={(e) => setSelectedPageId(e.target.value)}
                            className="w-full p-2.5 bg-[#FCFAF8] border border-rose-100 rounded-xl text-rose-950 focus:outline-none focus:border-rose-350"
                          >
                            {facebookPages.map(page => (
                              <option key={page.id} value={page.id}>{page.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Custom Campaign Name */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-extrabold text-[#7c5d4b] block">Nombre de la Campaña</label>
                          <input
                            type="text"
                            placeholder={`${selectedProduct.name} - Campaña IA`}
                            value={customCampaignName}
                            onChange={(e) => setCustomCampaignName(e.target.value)}
                            className="w-full p-2.5 bg-[#FCFAF8] border border-rose-100 rounded-xl text-rose-950 focus:outline-none focus:border-rose-350"
                          />
                        </div>
                      </div>

                      <div className="space-y-3.5 flex flex-col justify-between">
                        {/* Summary of configurations */}
                        <div className="p-3.5 bg-stone-50 border border-stone-150 rounded-xl space-y-1.5 leading-relaxed text-[11px] text-stone-605">
                          <div><strong>Presupuesto Diario:</strong> {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(metrics.dailyBudget)} COP</div>
                          <div><strong>Máximo diario protegido:</strong> {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(STARTER_META_BUDGET_COP)} COP</div>
                          <div><strong>Audiencia recomendada:</strong> Mujeres de 25-45 años en Colombia.</div>
                          <div><strong>Creativo:</strong> Foto seleccionada de {selectedProduct.name}.</div>
                          <div><strong>Texto de Anuncio:</strong> {adsData?.primaryTexts?.[0]?.substring(0, 80)}...</div>
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-2">
                          <button
                            onClick={handleLaunchCampaign}
                            disabled={launchingCampaign || !selectedPageId}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-100 disabled:opacity-50"
                          >
                            {launchingCampaign ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Subiendo creativo y creando estructura en Meta...
                              </>
                            ) : (
                              <>
                                🚀 Lanzar Campaña Borrador en Facebook
                              </>
                            )}
                          </button>

                          {launchResult && (
                            <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${launchResult.success ? "bg-emerald-50 border-emerald-250 text-emerald-800" : "bg-rose-50 border-rose-250 text-rose-800"}`}>
                              {launchResult.success ? (
                                <div>
                                  🎉 <strong>¡Éxito!</strong> La campaña se ha creado en estado Pausado. Puedes verla e iniciarla directamente en tu <a href="https://adsmanager.facebook.com/" target="_blank" rel="noreferrer" className="underline font-bold">Administrador de Anuncios de Meta</a>. <br/>
                                  <span className="font-mono text-[9px] opacity-75">ID de Campaña: {launchResult.campaignId}</span>
                                </div>
                              ) : (
                                <div>
                                  ❌ <strong>Error:</strong> {launchResult.message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB CONTENT: OMNICHANNEL OPERATIONS */}
            {activeTab === "omnichannel" && (
              <div className="space-y-6 animate-fade-in" id="tab-content-omnichannel">
                <OmnichannelPanel />
              </div>
            )}

            {/* TAB CONTENT: REAL META ADS ACCOUNT CONNECTION (TRAFICKER MODE) */}
            {activeTab === "ads-account" && (
              <div className="space-y-6 animate-fade-in" id="tab-content-ads-account">
                <AutomationPanel />
                <MetaAdsPanel />
              </div>
            )}

            {/* TAB CONTENT: 2-WEEK TIMELINE IMPLEMENTATION AND OPTIMIZATION CHECKS */}
            {activeTab === "timeline" && (
              <div className="space-y-6" id="tab-content-timeline">
                
                {/* Timeline Header introduction */}
                <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-2 shadow-sm text-rose-950 animate-fade-in">
                  <h2 className="text-base font-black text-rose-950 flex items-center gap-2">
                    Plan de Seguimiento y Optimización Directa (Primeras 2 Semanas)
                  </h2>
                  <p className="text-xs text-stone-600 leading-relaxed font-sans">
                    Las campañas de dropshipping requieren disciplina. No toques tus presupuestos el primer día; deja que el algoritmo compile perfiles y sigue esta lista táctica paso a paso para recortar pérdidas rápido.
                  </p>
                </div>

                {/* Day-by-day Checklists */}
                <div className="space-y-3.5" id="timeline-checklist-group">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 shadow-sm ${
                        task.checked 
                          ? "bg-[#FFF9FA]/30 border-rose-100/50 opacity-70" 
                          : "bg-white border-rose-100 hover:border-pink-200"
                      }`}
                      id={`task-wrapper-${task.id}`}
                    >
                      {/* Checkbox */}
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`mt-1 h-5 w-5 shrink-0 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          task.checked 
                            ? "bg-pink-500 border-pink-500 text-white font-extrabold shadow" 
                            : "border-stone-200 bg-[#FCFAF8] hover:border-pink-400 text-transparent"
                        }`}
                        id={`task-check-${task.id}`}
                      >
                        <Check className="w-3.5 h-3.5 font-black" />
                      </button>

                      <div className="flex-1 space-y-1.5 text-left text-rose-950">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] uppercase font-sans font-extrabold tracking-wider bg-[#FCFAF8] px-2.5 py-0.5 rounded-lg text-[#7c5d4b] border border-stone-200/50">
                            {task.day}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold ${
                            task.phase === "week1" ? "bg-pink-50 text-pink-600 border-pink-100" : "bg-purple-50 text-purple-600 border-purple-100"
                          }`}>
                            {task.phase === "week1" ? "Semana 1: Lanzamiento" : "Semana 2: Ampliación / ROI"}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-rose-950">{task.title}</h4>
                        <p className="text-xs text-stone-600 leading-relaxed font-sans">{task.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Practical Advice Tips footer block */}
                <div className="bg-[#FFF5F6] p-5 rounded-2xl border border-rose-100/90 space-y-3 shadow-sm text-rose-950" id="optimization-bestpractice-panel">
                  <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">A/B Testing de Anuncios Recomendado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    <div className="p-4 bg-white rounded-xl border border-rose-100 shadow-sm space-y-2">
                      <p className="font-extrabold text-pink-600 flex items-center gap-1">
                        📦 Test A: Enfoque de Logística Fuerte (Garantías)
                      </p>
                      <p className="text-stone-605 leading-relaxed text-[11px]">
                        Enfoca títulos en <strong className="text-rose-950 font-bold">"Paga al Recibir en Casa"</strong> y <strong className="text-rose-950 font-bold">"Envío 100% Gratis hoy"</strong>. Atrae compradores escépticos que desconfían de compras en línea en LatAm. 
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-rose-100 shadow-sm space-y-2">
                      <p className="font-extrabold text-[#7042a3] flex items-center gap-1">
                        🌱 Test B: Enfoque Clínico y de Confianza
                      </p>
                      <p className="text-stone-605 leading-relaxed text-[11px]">
                        Enfoca títulos en la <strong className="text-rose-950 font-bold">"Fórmula Masticable Activa"</strong>, <strong className="text-rose-950 font-bold">"Suplemento Libre de Hormonas"</strong>, o la duración completa del ciclo diario. Convierte audiencias interesadas en alta calidad de salud.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* Informative Footer Credits and Setup help */}
        <footer className="mt-12 pt-6 border-t border-rose-100 text-center text-xs text-stone-500 space-y-2 font-sans" id="planner-footer">
          <p className="font-semibold text-stone-500">© 2026 Dropshipping Meta Ads Suite de Salud & Bienestar.</p>
          <p className="leading-relaxed text-[11px] max-w-2xl mx-auto text-stone-400">
            Los datos son simulaciones basadas en el panorama de dropshipping nacional y regulaciones de anuncios de Meta de Junio de 2026. 
            El rendimiento final de las campañas depende de la correcta configuración de conversiones de compra en Shopify/WooCommerce y velocidad de carga de tu Landing page o embudo contra entrega.
          </p>
        </footer>

      </main>
    </div>
  );
}
