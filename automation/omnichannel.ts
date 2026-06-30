import fs from "fs";
import path from "path";
import type { Express, Request, Response } from "express";
import { metaAdsClient, type MetaCampaignMetric } from "../metaAdsClient";
import { loadConfig } from "./config";

type ConnectorStatus = {
  configured: boolean;
  missing: string[];
  label: string;
};

type OrderEvent = {
  id: string;
  ts: string;
  event: string;
  orderId: string;
  status?: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
  raw: unknown;
};

type MastershopSummary = {
  configured: boolean;
  source: "mastershop" | "local_events";
  totalRevenue: number;
  ordersProcessed: number;
  newCustomers: number;
  recurrentCustomers: number;
  errors: string[];
};

export type DailyReport = {
  id: string;
  ts: string;
  date: string;
  meta: {
    configured: boolean;
    campaigns: number;
    adSpend: number;
    impressions: number;
    clicks: number;
    results: number;
    cpm: number;
    cpc: number;
    conversionRate: number;
    attributedRevenue: number;
    roas: number;
  };
  commerce: MastershopSummary;
  consolidated: {
    revenue: number;
    adSpend: number;
    roas: number;
    ordersProcessed: number;
    newCustomers: number;
    recurrentCustomers: number;
  };
  alerts: string[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const ORDER_LOG_PATH = path.join(DATA_DIR, "mastershop-order-events.jsonl");
const WHATSAPP_LOG_PATH = path.join(DATA_DIR, "whatsapp-outbox.jsonl");
const REPORT_LOG_PATH = path.join(DATA_DIR, "daily-reports.jsonl");
const DAILY_MARKER_PATH = path.join(DATA_DIR, "last-daily-report.json");
const DEFAULT_GRAPH_VERSION = "v21.0";

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function env(name: string): string {
  return (process.env[name] || "").trim();
}

function connector(label: string, names: string[]): ConnectorStatus {
  const missing = names.filter((name) => !env(name));
  return { label, configured: missing.length === 0, missing };
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function appendJsonl(filePath: string, value: unknown): void {
  ensureDataDir();
  fs.appendFileSync(filePath, JSON.stringify(value) + "\n");
}

function readJsonl<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => {
      try {
        return JSON.parse(line) as T;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as T[];
}

function numberFrom(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function normalizePhone(raw: unknown): string | undefined {
  if (!raw) return undefined;
  const digits = String(raw).replace(/[^0-9]/g, "");
  return digits.length >= 8 ? digits : undefined;
}

function findFirst<T = any>(...values: any[]): T | undefined {
  return values.find((value) => value !== undefined && value !== null && value !== "") as T | undefined;
}

function extractOrderEvent(payload: any): OrderEvent {
  const order = payload?.order || payload?.data?.order || payload?.data || payload || {};
  const customer = order?.customer || order?.client || payload?.customer || payload?.client || {};
  const event = String(findFirst(payload?.event, payload?.type, order?.event, order?.status, payload?.status, "order_event")).toLowerCase();
  const orderId = String(findFirst(order?.id, order?.order_id, order?.orderId, payload?.order_id, payload?.id, "evt_" + Date.now()));
  const total = numberFrom(findFirst(order?.total, order?.total_amount, order?.totalPrice, order?.amount, payload?.total));
  return {
    id: "ordevt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
    ts: new Date().toISOString(),
    event,
    orderId,
    status: findFirst(order?.status, payload?.status),
    customerName: findFirst(customer?.name, customer?.full_name, order?.customer_name, payload?.customer_name),
    customerPhone: normalizePhone(findFirst(customer?.phone, customer?.mobile, order?.phone, payload?.phone, payload?.wa_id)),
    total,
    raw: payload,
  };
}

function messageForOrder(event: OrderEvent): string | null {
  const name = event.customerName ? " " + event.customerName : "";
  const orderRef = event.orderId ? "#" + event.orderId : "";
  if (event.event.includes("abandon")) {
    return "Hola" + name + ", vimos que dejaste tu pedido " + orderRef + " pendiente. Si quieres, te ayudamos a terminarlo y confirmar disponibilidad.";
  }
  if (event.event.includes("ship") || event.event.includes("envio") || event.event.includes("despach")) {
    return "Hola" + name + ", tu pedido " + orderRef + " ya va en camino. Te avisaremos cualquier cambio de estado por este mismo chat.";
  }
  if (event.event.includes("deliver") || event.event.includes("entreg")) {
    return "Hola" + name + ", confirmamos la entrega de tu pedido " + orderRef + ". Gracias por comprar con nosotros.";
  }
  if (event.event.includes("cancel") || event.event.includes("refund")) {
    return "Hola" + name + ", recibimos una novedad sobre tu pedido " + orderRef + ". Nuestro equipo revisara el caso y te confirmara el siguiente paso.";
  }
  if (event.event.includes("paid") || event.event.includes("confirm") || event.event.includes("created") || event.event.includes("order")) {
    return "Hola" + name + ", recibimos tu pedido " + orderRef + ". Quedo registrado correctamente y te avisaremos cuando avance el envio.";
  }
  return null;
}

function faqReply(text: string): string {
  const q = text.toLowerCase();
  if (q.includes("envio") || q.includes("envío") || q.includes("llega") || q.includes("tiempo")) {
    return "Los envios se confirman despues del pedido y te avisamos cada cambio de estado por WhatsApp.";
  }
  if (q.includes("devol") || q.includes("cambio") || q.includes("garantia") || q.includes("garantía")) {
    return "Podemos ayudarte con cambios o devoluciones segun el estado del pedido. Enviame tu numero de pedido para revisarlo.";
  }
  if (q.includes("precio") || q.includes("pago") || q.includes("contra entrega")) {
    return "Tenemos checkout simplificado y, si aplica para tu ciudad, pago contra entrega. Te confirmo disponibilidad con tu pedido.";
  }
  if (q.includes("estado") || q.includes("pedido") || q.includes("guia") || q.includes("guía")) {
    return "Para consultar el estado, enviame tu numero de pedido y te comparto la informacion registrada.";
  }
  return "Hola, soy el asistente automatico. Puedo ayudarte con productos, envios, pagos, devoluciones o estado de pedidos.";
}

async function sendWhatsAppText(to: string | undefined, body: string, reason: string): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const phone = normalizePhone(to);
  if (!phone) return { sent: false, skipped: "missing_phone" };

  const status = connector("WhatsApp Business", ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]);
  const logBase = { ts: new Date().toISOString(), to: phone, body, reason };
  if (!status.configured) {
    appendJsonl(WHATSAPP_LOG_PATH, { ...logBase, sent: false, skipped: "not_configured", missing: status.missing });
    return { sent: false, skipped: "not_configured" };
  }

  try {
    const graphVersion = env("WHATSAPP_GRAPH_VERSION") || DEFAULT_GRAPH_VERSION;
    const res = await fetch("https://graph.facebook.com/" + graphVersion + "/" + env("WHATSAPP_PHONE_NUMBER_ID") + "/messages", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env("WHATSAPP_ACCESS_TOKEN"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { preview_url: false, body },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data?.error?.message || "WhatsApp HTTP " + res.status);
    appendJsonl(WHATSAPP_LOG_PATH, { ...logBase, sent: true, providerResponse: data });
    return { sent: true };
  } catch (e: any) {
    appendJsonl(WHATSAPP_LOG_PATH, { ...logBase, sent: false, error: e?.message || String(e) });
    return { sent: false, error: e?.message || String(e) };
  }
}

async function mastershopGet(pathName: string, params: Record<string, string>): Promise<any> {
  const baseUrl = env("MASTERSHOP_API_BASE_URL").replace(/\/$/, "");
  const normalizedPath = pathName.startsWith("/") ? pathName : "/" + pathName;
  const url = new URL(baseUrl + normalizedPath);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: "Bearer " + env("MASTERSHOP_API_TOKEN"),
  };
  if (env("MASTERSHOP_STORE_ID")) headers["X-Store-Id"] = env("MASTERSHOP_STORE_ID");
  const res = await fetch(url.toString(), { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || "Mastershop HTTP " + res.status);
  return data;
}

function localMastershopSummary(startIso = startOfTodayIso()): MastershopSummary {
  const events = readJsonl<OrderEvent>(ORDER_LOG_PATH).filter((event) => event.ts >= startIso);
  const orderIds = new Set(events.map((event) => event.orderId));
  const revenueByOrder = new Map<string, number>();
  const customersToday = new Set<string>();
  for (const event of events) {
    if (event.customerPhone) customersToday.add(event.customerPhone);
    if (event.total > 0) revenueByOrder.set(event.orderId, event.total);
  }

  const allEvents = readJsonl<OrderEvent>(ORDER_LOG_PATH);
  const firstSeen = new Map<string, string>();
  for (const event of allEvents) {
    if (!event.customerPhone) continue;
    const current = firstSeen.get(event.customerPhone);
    if (!current || event.ts < current) firstSeen.set(event.customerPhone, event.ts);
  }

  let newCustomers = 0;
  let recurrentCustomers = 0;
  for (const phone of customersToday) {
    const first = firstSeen.get(phone);
    if (first && first >= startIso) newCustomers++;
    else recurrentCustomers++;
  }

  return {
    configured: connector("Mastershop", ["MASTERSHOP_API_BASE_URL", "MASTERSHOP_API_TOKEN"]).configured,
    source: "local_events",
    totalRevenue: Array.from(revenueByOrder.values()).reduce((sum, value) => sum + value, 0),
    ordersProcessed: orderIds.size,
    newCustomers,
    recurrentCustomers,
    errors: [],
  };
}

async function fetchMastershopSummary(startIso = startOfTodayIso(), endIso = new Date().toISOString()): Promise<MastershopSummary> {
  const status = connector("Mastershop", ["MASTERSHOP_API_BASE_URL", "MASTERSHOP_API_TOKEN"]);
  if (!status.configured || !env("MASTERSHOP_REPORTS_PATH")) return localMastershopSummary(startIso);

  try {
    const data = await mastershopGet(env("MASTERSHOP_REPORTS_PATH"), { start: startIso, end: endIso });
    const summary = data?.summary || data?.data || data;
    return {
      configured: true,
      source: "mastershop",
      totalRevenue: numberFrom(findFirst(summary?.totalRevenue, summary?.total_revenue, summary?.revenue, summary?.sales)),
      ordersProcessed: numberFrom(findFirst(summary?.ordersProcessed, summary?.orders_processed, summary?.orders, summary?.orders_count)),
      newCustomers: numberFrom(findFirst(summary?.newCustomers, summary?.new_customers)),
      recurrentCustomers: numberFrom(findFirst(summary?.recurrentCustomers, summary?.recurrent_customers, summary?.returning_customers)),
      errors: [],
    };
  } catch (e: any) {
    const fallback = localMastershopSummary(startIso);
    return { ...fallback, errors: ["Mastershop report fallback: " + (e?.message || e)] };
  }
}

function summarizeMeta(campaigns: MetaCampaignMetric[], configured: boolean): DailyReport["meta"] {
  const adSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const results = campaigns.reduce((sum, c) => sum + c.results, 0);
  const attributedRevenue = campaigns.reduce((sum, c) => sum + c.purchaseValue, 0);
  return {
    configured,
    campaigns: campaigns.length,
    adSpend,
    impressions,
    clicks,
    results,
    cpm: impressions > 0 ? Number(((adSpend / impressions) * 1000).toFixed(2)) : 0,
    cpc: clicks > 0 ? Number((adSpend / clicks).toFixed(2)) : 0,
    conversionRate: clicks > 0 ? Number(((results / clicks) * 100).toFixed(2)) : 0,
    attributedRevenue,
    roas: adSpend > 0 && attributedRevenue > 0 ? Number((attributedRevenue / adSpend).toFixed(2)) : 0,
  };
}

function buildAlerts(report: DailyReport): string[] {
  const minRoas = numberFrom(env("OMNICHANNEL_MIN_ROAS")) || 1.5;
  const targetRoas = numberFrom(env("OMNICHANNEL_TARGET_ROAS")) || 3;
  const alerts: string[] = [];
  if (!report.meta.configured) alerts.push("Meta Ads no esta conectado; el agente no puede optimizar campanas reales.");
  if (!connector("Gemini", ["GEMINI_API_KEY"]).configured) alerts.push("Gemini no esta configurado; se usaran textos de respaldo.");
  if (!connector("WhatsApp Business", ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]).configured) alerts.push("WhatsApp Business no esta conectado; las respuestas quedan en outbox local.");
  if (report.consolidated.adSpend > 0 && report.consolidated.roas > 0 && report.consolidated.roas < minRoas) {
    alerts.push("ROAS consolidado " + report.consolidated.roas + "x por debajo del minimo " + minRoas + "x.");
  }
  if (report.consolidated.roas >= targetRoas) alerts.push("ROAS consolidado " + report.consolidated.roas + "x supera el objetivo " + targetRoas + "x; revisar escalamiento.");
  if (report.meta.campaigns > 0 && report.meta.conversionRate < 1 && report.meta.clicks >= 100) alerts.push("Conversion rate bajo 1% con volumen suficiente de clics.");
  alerts.push(...report.commerce.errors);
  return alerts;
}

export function getOmnichannelStatus() {
  const cfg = loadConfig();
  const metaConfigured = metaAdsClient.isConfigured();
  return {
    mode: cfg.mode,
    connectors: {
      meta: { label: "Meta Ads", configured: metaConfigured, missing: metaConfigured ? [] : ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"] },
      gemini: connector("Gemini", ["GEMINI_API_KEY"]),
      mastershop: connector("Mastershop", ["MASTERSHOP_API_BASE_URL", "MASTERSHOP_API_TOKEN"]),
      whatsapp: connector("WhatsApp Business", ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]),
    },
    guardrails: {
      dailySpendCapAccount: cfg.dailySpendCapAccount,
      maxBudgetIncreasePct: cfg.maxBudgetIncreasePct,
      autoExecuteRules: cfg.autoExecuteRules,
    },
    latestReport: readRecentReports(1)[0] || null,
    recentOrders: readJsonl<OrderEvent>(ORDER_LOG_PATH).slice(-10).reverse(),
  };
}

export async function buildDailyReport(): Promise<DailyReport> {
  const configured = metaAdsClient.isConfigured();
  let campaigns: MetaCampaignMetric[] = [];
  if (configured) {
    try {
      campaigns = await metaAdsClient.fetchCampaigns();
    } catch {
      campaigns = [];
    }
  }

  const commerce = await fetchMastershopSummary();
  const meta = summarizeMeta(campaigns, configured);
  const revenue = commerce.totalRevenue || meta.attributedRevenue;
  const report: DailyReport = {
    id: "rep_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7),
    ts: new Date().toISOString(),
    date: todayKey(),
    meta,
    commerce,
    consolidated: {
      revenue,
      adSpend: meta.adSpend,
      roas: meta.adSpend > 0 && revenue > 0 ? Number((revenue / meta.adSpend).toFixed(2)) : 0,
      ordersProcessed: commerce.ordersProcessed,
      newCustomers: commerce.newCustomers,
      recurrentCustomers: commerce.recurrentCustomers,
    },
    alerts: [],
  };
  report.alerts = buildAlerts(report);
  appendJsonl(REPORT_LOG_PATH, report);

  const alertTo = env("WHATSAPP_ALERT_TO");
  if (alertTo && report.alerts.length > 0) {
    await sendWhatsAppText(alertTo, formatReportForWhatsApp(report), "daily_report_alert");
  }

  return report;
}

export function readRecentReports(limit = 14): DailyReport[] {
  return readJsonl<DailyReport>(REPORT_LOG_PATH).slice(-limit).reverse();
}

export async function maybeRunDailyReport(): Promise<DailyReport | null> {
  ensureDataDir();
  const today = todayKey();
  try {
    if (fs.existsSync(DAILY_MARKER_PATH)) {
      const marker = JSON.parse(fs.readFileSync(DAILY_MARKER_PATH, "utf8"));
      if (marker?.date === today) return null;
    }
  } catch {
    // Ignore corrupt marker and rebuild below.
  }
  const report = await buildDailyReport();
  fs.writeFileSync(DAILY_MARKER_PATH, JSON.stringify({ date: today, reportId: report.id }, null, 2));
  return report;
}

function formatReportForWhatsApp(report: DailyReport): string {
  return [
    "Reporte " + report.date,
    "Ingresos: " + report.consolidated.revenue.toLocaleString("es-CO"),
    "Gasto Ads: " + report.consolidated.adSpend.toLocaleString("es-CO"),
    "ROAS: " + report.consolidated.roas + "x",
    "Pedidos: " + report.consolidated.ordersProcessed,
    "Clientes nuevos/recurrentes: " + report.consolidated.newCustomers + "/" + report.consolidated.recurrentCustomers,
    report.alerts.length ? "Alertas: " + report.alerts.join(" | ") : "Sin alertas criticas.",
  ].join("\n");
}

export function mountOmnichannelRoutes(app: Express): void {
  app.get("/api/omnichannel/status", (_req, res) => {
    res.json(getOmnichannelStatus());
  });

  app.get("/api/omnichannel/reports", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 14, 60);
    res.json({ reports: readRecentReports(limit) });
  });

  app.post("/api/omnichannel/report/run", async (_req, res) => {
    try {
      const report = await buildDailyReport();
      res.json({ success: true, report });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message || "No se pudo generar el reporte." });
    }
  });

  app.post("/api/mastershop/webhook", async (req, res) => {
    const expectedSecret = env("MASTERSHOP_WEBHOOK_SECRET");
    if (expectedSecret && req.header("x-mastershop-webhook-secret") !== expectedSecret) {
      return res.status(401).json({ success: false, message: "Webhook secret invalido." });
    }

    const event = extractOrderEvent(req.body);
    appendJsonl(ORDER_LOG_PATH, event);
    const message = messageForOrder(event);
    const whatsapp = message ? await sendWhatsAppText(event.customerPhone, message, event.event) : { sent: false, skipped: "no_message_rule" };
    res.json({ success: true, eventId: event.id, whatsapp });
  });

  app.get("/api/whatsapp/webhook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === env("WHATSAPP_VERIFY_TOKEN")) return res.status(200).send(challenge);
    return res.sendStatus(403);
  });

  app.post("/api/whatsapp/webhook", async (req, res) => {
    const entries = req.body?.entry || [];
    for (const entry of entries) {
      for (const change of entry?.changes || []) {
        const messages = change?.value?.messages || [];
        for (const message of messages) {
          const from = message?.from;
          const body = message?.text?.body || "";
          if (from && body) await sendWhatsAppText(from, faqReply(body), "inbound_faq");
        }
      }
    }
    res.json({ success: true });
  });

  app.post("/api/whatsapp/test-message", async (req, res) => {
    const { to, body } = req.body || {};
    if (!to || !body) return res.status(400).json({ success: false, message: "Falta to/body." });
    const result = await sendWhatsAppText(to, body, "manual_test");
    res.json({ success: result.sent, ...result });
  });
}
