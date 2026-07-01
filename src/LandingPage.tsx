import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  BadgeCheck,
  Star,
  Check,
  ChevronDown,
  Package,
  HandCoins,
  PhoneCall,
  Lock,
  Heart,
  Flame,
} from "lucide-react";

/* ============================================================
 * CONFIGURACIÓN — ⚠️ REEMPLAZA ESTOS VALORES CON LOS REALES
 * ============================================================
 *
 * 1) WHATSAPP_NUMBER: tu número con código de país, SIN "+", espacios ni guiones.
 *    Ejemplo Colombia: "573001234567"
 *
 * 2) En cada producto (LANDING_PRODUCTS) coloca su "mastershopUrl":
 *    el enlace de checkout/producto que te da Mastershop.
 *    Mientras esté vacío (""), el botón "Comprar" usará WhatsApp como respaldo.
 * ============================================================ */
const WHATSAPP_NUMBER = "573044901787"; // <-- PON TU NÚMERO AQUÍ
const BRAND_NAME = "Tienda Bienestar";

interface LandingProduct {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  price: number;
  oldPrice: number;
  benefit: string;
  headline: string;
  subheadline: string;
  bullets: string[];
  images: { src: string; alt: string }[];
  mastershopUrl: string; // <-- enlace de checkout de Mastershop
  accent: "rose" | "amber";
  faqs: { q: string; a: string }[];
  testimonials: { name: string; city: string; text: string }[];
}

const LANDING_PRODUCTS: Record<string, LandingProduct> = {
  "lemme-burn": {
    id: "lemme-burn",
    name: "LEMME BURN 60 CAPS",
    shortName: "Lemme Burn",
    badge: "Metabolismo & Energía",
    price: 119900,
    oldPrice: 159900,
    benefit: "Acelerador metabólico y control de antojos 100% natural",
    headline: "Activa Tu Quema Metabólica Natural con Lemme Burn",
    subheadline:
      "Fórmula botánica de última generación para optimizar tu energía, disminuir los antojos de dulce y potenciar tu bienestar diario.",
    bullets: [
      "Fórmula termogénica avanzada que apoya tu digestión y energía.",
      "Ayuda a controlar el apetito y los antojos nocturnos de azúcar.",
      "Energía limpia y prolongada, sin los bajones bruscos de la cafeína.",
      "60 cápsulas premium: suministro completo para todo un mes.",
    ],
    images: [{ src: "/images/lemme_burn.png", alt: "Lemme Burn 60 cápsulas veganas - Activa tu metabolismo con Actiponin" }],
    mastershopUrl: "", // <-- PON AQUÍ EL LINK DE MASTERSHOP DE LEMME BURN
    accent: "amber",
    faqs: [
      { q: "¿Cómo pago el producto?", a: "Pagas en efectivo cuando recibas tu pedido en la puerta de tu casa (pago contra entrega). No necesitas tarjeta ni pagos por adelantado." },
      { q: "¿Cuánto demora el envío?", a: "El envío es GRATIS a toda Colombia y normalmente llega entre 1 y 3 días hábiles según tu ciudad." },
      { q: "¿Cómo se toma?", a: "Se sugiere 1 a 2 cápsulas al día con un vaso de agua, preferiblemente antes de las comidas. Lee siempre la etiqueta del producto." },
      { q: "¿Es producto original?", a: "Sí, 100% original y sellado. Verificamos cada pedido antes de despacharlo." },
    ],
    testimonials: [
      { name: "Carolina M.", city: "Medellín", text: "Me ayudó muchísimo con la ansiedad por el dulce en las noches. Llegó en 2 días y pagué al recibir, súper fácil." },
      { name: "Andrés P.", city: "Bogotá", text: "Lo uso junto con mi rutina de ejercicio y noto más energía durante el día. Recomendado." },
      { name: "Diana R.", city: "Cali", text: "Excelente atención por WhatsApp, me resolvieron todas las dudas antes de pedir." },
    ],
  },
  "urofem-gomas": {
    id: "urofem-gomas",
    name: "UROFEM PROBIOTICOS X60UND GOMAS",
    shortName: "Urofem Gomas",
    badge: "Bienestar Íntimo Femenino",
    price: 99900,
    oldPrice: 139900,
    benefit: "Probióticos en deliciosas gomas para tu flora urinaria y vaginal",
    headline: "Protege Tu Zona Íntima de Forma Deliciosa con Urofem",
    subheadline:
      "Probióticos activos concentrados en gomitas premium para apoyar el equilibrio de tu flora, tu tracto urinario y fortalecer tus defensas.",
    bullets: [
      "Apoya la barrera urinaria y el equilibrio de tu flora femenina.",
      "Lactobacillus de alta supervivencia que llegan donde tu cuerpo los necesita.",
      "Formato en gomitas ricas: sin tragar pastillas aburridas.",
      "Práctico frasco de 60 unidades: bienestar diario a tu alcance.",
    ],
    images: [{ src: "/images/urofem_gomas.jpg", alt: "Frasco Urofem gomas probióticos" }],
    mastershopUrl: "", // <-- PON AQUÍ EL LINK DE MASTERSHOP DE UROFEM
    accent: "rose",
    faqs: [
      { q: "¿Cómo pago el producto?", a: "Pagas en efectivo al recibir tu pedido (pago contra entrega). Sin pagos por adelantado." },
      { q: "¿El envío tiene costo?", a: "No. El envío es GRATIS a toda Colombia y llega normalmente entre 1 y 3 días hábiles." },
      { q: "¿Cómo se consume?", a: "Se sugiere 1 a 2 gomitas al día. Revisa siempre la indicación de la etiqueta del producto." },
      { q: "¿El empaque es discreto?", a: "Sí, tu pedido llega en empaque discreto y seguro." },
    ],
    testimonials: [
      { name: "Laura G.", city: "Barranquilla", text: "Me encantó que son gomitas, mucho más fáciles de tomar que las pastillas. Las pedí para toda la familia." },
      { name: "Valentina S.", city: "Bogotá", text: "Pago contra entrega y envío gratis, llegó rapidísimo. Repetiré la compra." },
      { name: "Marcela T.", city: "Pereira", text: "La asesoría por WhatsApp fue muy amable y resolvieron mis dudas al instante." },
    ],
  },
  "uro-vaginal": {
    id: "uro-vaginal",
    name: "Probioticos Uro Vaginal",
    shortName: "Uro Vaginal",
    badge: "Equilibrio & Frescura",
    price: 94900,
    oldPrice: 134900,
    benefit: "Restaura tu pH natural y el equilibrio de tu flora íntima",
    headline: "Recupera la Frescura y el Equilibrio Íntimo que Mereces",
    subheadline:
      "Probióticos Uro Vaginal con cepas específicas para apoyar un pH saludable, cuidar tu microbiota y darte confianza día tras día.",
    bullets: [
      "Apoya el equilibrio del pH vaginal de forma natural.",
      "Contribuye a una flora íntima sana y a tus defensas naturales.",
      "Fórmula con cepas de lactobacilos cuidadosamente seleccionadas.",
      "Absorción rápida e higiénica para tu bienestar diario.",
    ],
    images: [
      { src: "/images/uro_floating.png", alt: "Cápsulas Uro Vaginal" },
      { src: "/images/uro_table.jpg", alt: "Frasco Uro Vaginal en mesa" },
      { src: "/images/uro_open.jpg", alt: "Frasco Uro Vaginal abierto" },
      { src: "/images/uro_diagram.png", alt: "Diagrama de la cápsula" },
    ],
    mastershopUrl: "", // <-- PON AQUÍ EL LINK DE MASTERSHOP DE URO VAGINAL
    accent: "rose",
    faqs: [
      { q: "¿Cómo pago el producto?", a: "Pagas en efectivo cuando recibas tu pedido (pago contra entrega). Sin tarjetas ni adelantos." },
      { q: "¿El envío es gratis?", a: "Sí, envío GRATIS a toda Colombia, normalmente entre 1 y 3 días hábiles." },
      { q: "¿Cómo se toma?", a: "Se sugiere 1 cápsula al día con agua. Sigue siempre las indicaciones de la etiqueta." },
      { q: "¿Llega en empaque discreto?", a: "Sí, cuidamos tu privacidad: el empaque es totalmente discreto." },
    ],
    testimonials: [
      { name: "Natalia C.", city: "Bogotá", text: "Muy buena experiencia, llegó en empaque discreto y pagué al recibir. Atención de 10." },
      { name: "Paola V.", city: "Medellín", text: "Me sentí mucho más cómoda y fresca. El envío fue rápido y gratis." },
      { name: "Sara L.", city: "Bucaramanga", text: "Resolvieron mis dudas por WhatsApp antes de comprar, eso me dio mucha confianza." },
    ],
  },
};

const formatCOP = (val: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

const buildWhatsAppLink = (product: LandingProduct) => {
  const msg = `Hola \u{1F44B}, quiero pedir ${product.shortName} (${formatCOP(product.price)}) con pago contra entrega. ¿Me ayudas?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
};

export default function LandingPage({ productId }: { productId: string }) {
  const product = LANDING_PRODUCTS[productId] || LANDING_PRODUCTS["lemme-burn"];
  const [activeImg, setActiveImg] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    document.title = `${product.shortName} | ${BRAND_NAME} · Envío Gratis y Pago Contra Entrega`;
  }, [product]);

  const whatsappLink = buildWhatsAppLink(product);
  // El botón principal va al checkout de Mastershop; si aún no hay URL, usa WhatsApp como respaldo.
  const buyLink = product.mastershopUrl || whatsappLink;
  const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);

  const accent =
    product.accent === "amber"
      ? {
          grad: "from-amber-500 to-orange-500",
          gradHover: "hover:from-amber-600 hover:to-orange-600",
          soft: "bg-amber-50 text-amber-700 border-amber-200",
          ring: "text-amber-500",
          icon: <Flame className="w-full h-full" />,
        }
      : {
          grad: "from-pink-500 to-rose-500",
          gradHover: "hover:from-pink-600 hover:to-rose-600",
          soft: "bg-pink-50 text-pink-700 border-pink-200",
          ring: "text-rose-500",
          icon: <Heart className="w-full h-full" />,
        };

  const BuyButton = ({ label, className = "" }: { label: string; className?: string }) => (
    <a
      href={buyLink}
      target={product.mastershopUrl ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2.5 bg-gradient-to-r ${accent.grad} ${accent.gradHover} text-white font-extrabold rounded-2xl shadow-lg shadow-rose-200/60 transition-all hover:scale-[1.02] active:scale-100 ${className}`}
    >
      <ShoppingCart className="w-5 h-5" />
      {label}
    </a>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F4] via-white to-[#FFFBF7] text-[#3f3330] font-sans">
      {/* Announcement bar */}
      <div className={`w-full bg-gradient-to-r ${accent.grad} text-white text-center text-[12px] md:text-sm font-bold py-2 px-4 flex items-center justify-center gap-2`}>
        <Truck className="w-4 h-4" /> ENVÍO GRATIS a toda Colombia · 💵 Pagas al recibir (Contra Entrega)
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-rose-100/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${accent.grad} text-white p-1.5 flex items-center justify-center shadow-sm`}>
              {accent.icon}
            </span>
            <span className="font-extrabold text-rose-950 tracking-tight">{BRAND_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
            >
              <PhoneCall className="w-4 h-4" /> WhatsApp
            </a>
            <BuyButton label="Pedir" className="text-sm px-4 py-2" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {/* HERO */}
        <section className="grid md:grid-cols-2 gap-8 items-center py-8 md:py-12">
          {/* Gallery */}
          <div className="order-1 md:order-none">
            <div className="relative bg-white rounded-3xl border border-rose-100 shadow-[0_10px_40px_-12px_rgba(244,63,94,0.18)] p-4 overflow-hidden">
              <span className={`absolute top-4 left-4 z-10 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${accent.soft}`}>
                -{discount}% HOY
              </span>
              <img
                src={product.images[activeImg]?.src}
                alt={product.images[activeImg]?.alt}
                className="w-full h-72 md:h-96 object-contain"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 justify-center">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`w-16 h-16 rounded-xl border-2 bg-white overflow-hidden transition-all ${
                      activeImg === idx ? "border-pink-400 shadow-sm" : "border-stone-200 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={img.alt}
                  >
                    <img src={img.src} alt={img.alt} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Copy + price + CTA */}
          <div className="space-y-5">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${accent.soft}`}>
              <BadgeCheck className="w-3.5 h-3.5" /> {product.badge}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-rose-950 leading-tight tracking-tight">
              {product.headline}
            </h1>
            <p className="text-stone-600 leading-relaxed text-sm md:text-base">{product.subheadline}</p>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-xs text-stone-500 font-medium">+1.200 clientes felices en Colombia</span>
            </div>

            {/* Price block */}
            <div className="bg-white rounded-2xl border border-rose-100 p-4 flex items-end gap-3 shadow-sm">
              <div>
                <p className="text-xs text-stone-400 line-through font-medium">{formatCOP(product.oldPrice)}</p>
                <p className="text-3xl font-extrabold text-rose-950">{formatCOP(product.price)}</p>
              </div>
              <span className={`mb-1 text-[11px] font-extrabold px-2 py-1 rounded-lg border ${accent.soft}`}>
                Ahorras {formatCOP(product.oldPrice - product.price)}
              </span>
            </div>

            <BuyButton label="COMPRAR AHORA · Pago Contra Entrega" className="w-full text-base px-6 py-4" />

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-white border border-emerald-300 text-emerald-700 font-bold rounded-2xl px-6 py-3 hover:bg-emerald-50 transition-colors"
            >
              <PhoneCall className="w-5 h-5" /> Pedir por WhatsApp
            </a>

            {/* Trust row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { icon: <HandCoins className="w-5 h-5" />, t: "Pagas al recibir" },
                { icon: <Truck className="w-5 h-5" />, t: "Envío gratis" },
                { icon: <ShieldCheck className="w-5 h-5" />, t: "100% original" },
              ].map((b, i) => (
                <div key={i} className="flex flex-col items-center text-center gap-1 bg-white rounded-xl border border-rose-100 py-3 px-1">
                  <span className={accent.ring}>{b.icon}</span>
                  <span className="text-[11px] font-bold text-stone-600 leading-tight">{b.t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-rose-950 text-center mb-6">
            ¿Por qué elegir {product.shortName}?
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {product.bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-2xl border border-rose-100 p-4 shadow-sm">
                <span className={`shrink-0 w-7 h-7 rounded-full ${accent.soft} border flex items-center justify-center`}>
                  <Check className="w-4 h-4" />
                </span>
                <p className="text-sm text-stone-700 leading-relaxed font-medium">{b}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW COD WORKS */}
        <section className="py-8">
          <div className="bg-gradient-to-br from-rose-50/70 to-white rounded-3xl border border-rose-100 p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-rose-950 text-center mb-6">
              Comprar es muy fácil y seguro
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: <ShoppingCart className="w-6 h-6" />, t: "1. Haz tu pedido", d: "Toca “Comprar ahora” y completa tus datos de envío en pocos segundos." },
                { icon: <Package className="w-6 h-6" />, t: "2. Lo enviamos gratis", d: "Despachamos tu pedido a toda Colombia sin costo de envío." },
                { icon: <HandCoins className="w-6 h-6" />, t: "3. Pagas al recibir", d: "Pagas en efectivo cuando el producto llegue a tu puerta. Sin riesgos." },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-rose-100 p-5 text-center shadow-sm">
                  <span className={`inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr ${accent.grad} text-white items-center justify-center mb-3`}>
                    {s.icon}
                  </span>
                  <h3 className="font-extrabold text-rose-950 text-sm mb-1">{s.t}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-rose-950 text-center mb-6">
            Lo que dicen nuestros clientes
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {product.testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm flex flex-col gap-3">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed italic">“{t.text}”</p>
                <div className="mt-auto flex items-center gap-2 pt-2 border-t border-rose-50">
                  <span className={`w-8 h-8 rounded-full ${accent.soft} border flex items-center justify-center text-xs font-extrabold`}>
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-rose-950">{t.name}</p>
                    <p className="text-[11px] text-stone-500">{t.city} · Compra verificada</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* OFFER BAND */}
        <section className="py-6">
          <div className={`rounded-3xl bg-gradient-to-r ${accent.grad} text-white p-6 md:p-8 text-center shadow-lg`}>
            <p className="text-sm font-semibold opacity-90 mb-1">Oferta por tiempo limitado</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-white/70 line-through text-lg font-medium">{formatCOP(product.oldPrice)}</span>
              <span className="text-3xl md:text-4xl font-extrabold">{formatCOP(product.price)}</span>
            </div>
            <a
              href={buyLink}
              target={product.mastershopUrl ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-rose-600 font-extrabold rounded-2xl px-8 py-4 shadow-md hover:scale-[1.02] transition-transform"
            >
              <ShoppingCart className="w-5 h-5" /> QUIERO EL MÍO AHORA
            </a>
            <p className="text-xs opacity-90 mt-3 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Pago 100% seguro contra entrega · Envío gratis
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-rose-950 text-center mb-6">Preguntas frecuentes</h2>
          <div className="max-w-2xl mx-auto space-y-2">
            {product.faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="font-bold text-sm text-rose-950">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-rose-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-4 -mt-1 text-sm text-stone-600 leading-relaxed">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-rose-100 bg-white/70 py-6 px-4 mt-4">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p className="font-extrabold text-rose-950">{BRAND_NAME}</p>
          <p className="text-[11px] text-stone-500 leading-relaxed max-w-xl mx-auto">
            Este producto es un suplemento / producto de bienestar y no reemplaza el tratamiento médico.
            Los resultados pueden variar de una persona a otra. Consulta a tu médico ante cualquier duda.
          </p>
          <p className="text-[11px] text-stone-400">© {new Date().getFullYear()} {BRAND_NAME}. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-[#25D366] text-white font-bold rounded-full shadow-xl shadow-emerald-300/50 pl-3 pr-4 py-3 hover:scale-105 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.59 5.392l-1 3.648 3.91-1.737zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
        <span className="hidden sm:inline text-sm">WhatsApp</span>
      </a>
    </div>
  );
}
