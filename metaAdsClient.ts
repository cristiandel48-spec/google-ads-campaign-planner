// metaAdsClient.ts
// Thin wrapper around the Meta Marketing API (Graph API) using plain fetch —
// no extra SDK dependency required, since Node 18+ ships a global fetch.
//
// IMPORTANT - Real money / live account:
// This module can read real campaign performance from your Meta (Facebook /
// Instagram) Ads account and can ALSO submit real changes (pause a
// campaign, change a daily budget) if you explicitly call applyAction().
// Nothing here runs automatically in the background — every spend-affecting
// action requires an explicit POST from the UI after you click "Aplicar".
//
// Required environment variables (see .env.example):
//   META_ACCESS_TOKEN   — long-lived token with ads_management/ads_read
//   META_AD_ACCOUNT_ID  — e.g. "act_1234567890" (the "act_" prefix is added
//                          automatically if you only provide the numeric id)

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface MetaCampaignMetric {
  id: string;
  name: string;
  status: string;
  objective: string;
  dailyBudget: number;
  spend: number;
  reach: number;
  impressions: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpm: number;
  results: number;
  costPerResult: number;
}

export interface MetaAdsSuggestion {
  id: string;
  campaignId: string;
  campaignName: string;
  type: "pause" | "increase_budget" | "decrease_budget" | "refresh_creative" | "reduce_frequency";
  severity: "critical" | "warning" | "opportunity";
  reason: string;
  spendAffecting: boolean;
  suggestedDailyBudget?: number;
}

function isConfigured(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

function getAccountId(): string {
  const raw = (process.env.META_AD_ACCOUNT_ID as string).trim();
  return raw.startsWith("act_") ? raw : `act_${raw}`;
}

function getToken(): string {
  return process.env.META_ACCESS_TOKEN as string;
}

async function graphGet(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", getToken());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data?.error?.message || `Error HTTP ${res.status} consultando la API de Meta.`;
    throw new Error(msg);
  }
  return data;
}

async function graphPost(path: string, body: Record<string, string>) {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", getToken());
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data?.error?.message || `Error HTTP ${res.status} aplicando el cambio en Meta.`;
    throw new Error(msg);
  }
  return data;
}

// Fetch campaigns + last 7 day insights
async function fetchCampaigns(): Promise<MetaCampaignMetric[]> {
  const accountId = getAccountId();

  const campaignsData = await graphGet(`/${accountId}/campaigns`, {
    fields: "id,name,status,objective,daily_budget",
    limit: "100",
  });

  const campaigns = campaignsData.data || [];

  const results: MetaCampaignMetric[] = [];

  for (const c of campaigns) {
    let insight: any = {};
    try {
      const insightsData = await graphGet(`/${c.id}/insights`, {
        fields: "spend,reach,impressions,frequency,clicks,ctr,cpm,actions,cost_per_action_type",
        date_preset: "last_7d",
      });
      insight = insightsData.data?.[0] || {};
    } catch {
      insight = {};
    }

    // "results" = sum of purchase / lead / on-facebook-lead actions, falling
    // back to link clicks if no conversion action is configured yet.
    const conversionAction = (insight.actions || []).find((a: any) =>
      ["purchase", "lead", "onsite_conversion.purchase", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type)
    );
    const resultsCount = conversionAction ? Number(conversionAction.value) : 0;

    const costPerResultEntry = (insight.cost_per_action_type || []).find((a: any) =>
      ["purchase", "lead", "onsite_conversion.purchase", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type)
    );

    results.push({
      id: c.id,
      name: c.name,
      status: c.status,
      objective: c.objective || "N/A",
      dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : 0,
      spend: Number(insight.spend || 0),
      reach: Number(insight.reach || 0),
      impressions: Number(insight.impressions || 0),
      frequency: Number(insight.frequency || 0),
      clicks: Number(insight.clicks || 0),
      ctr: Number(insight.ctr || 0),
      cpm: Number(insight.cpm || 0),
      results: resultsCount,
      costPerResult: costPerResultEntry ? Number(costPerResultEntry.value) : 0,
    });
  }

  return results;
}

// Simple rule-based "traffic manager" engine, adapted to the metrics that
// matter for Meta/Facebook/Instagram campaigns (frequency, CTR, CPM, results).
function evaluateRules(campaigns: MetaCampaignMetric[]): MetaAdsSuggestion[] {
  const suggestions: MetaAdsSuggestion[] = [];

  for (const c of campaigns) {
    if (c.status !== "ACTIVE") continue;

    // Rule 1: meaningful spend with zero results -> pause
    if (c.spend > 50000 && c.results === 0) {
      suggestions.push({
        id: `${c.id}-pause-noresults`,
        campaignId: c.id,
        campaignName: c.name,
        type: "pause",
        severity: "critical",
        reason: `Gastó ${c.spend.toLocaleString("es-CO")} en 7 días sin ningún resultado registrado. Riesgo de pérdida continua.`,
        spendAffecting: true,
      });
    }

    // Rule 2: ad fatigue — frequency too high erodes CTR and raises CPM
    if (c.frequency > 3.5) {
      suggestions.push({
        id: `${c.id}-fatigue`,
        campaignId: c.id,
        campaignName: c.name,
        type: "refresh_creative",
        severity: "warning",
        reason: `Frecuencia de ${c.frequency.toFixed(1)}x: tu público ya vio el anuncio demasiadas veces. Cambia el creativo o amplía la audiencia.`,
        spendAffecting: false,
      });
    }

    // Rule 3: low CTR -> creative or targeting issue
    if (c.impressions > 1000 && c.ctr < 1.0) {
      suggestions.push({
        id: `${c.id}-lowctr`,
        campaignId: c.id,
        campaignName: c.name,
        type: "refresh_creative",
        severity: "warning",
        reason: `CTR de ${c.ctr.toFixed(2)}% está por debajo del 1% saludable para Feed/Reels. Prueba un nuevo ángulo creativo.`,
        spendAffecting: false,
      });
    }

    // Rule 4: healthy results and controlled cost -> scale budget +20%
    if (c.results >= 5 && c.dailyBudget > 0) {
      suggestions.push({
        id: `${c.id}-scale`,
        campaignId: c.id,
        campaignName: c.name,
        type: "increase_budget",
        severity: "opportunity",
        reason: `${c.results} resultados en 7 días con costo controlado. Candidata a escalar presupuesto diario +20%.`,
        spendAffecting: true,
        suggestedDailyBudget: Math.round(c.dailyBudget * 1.2),
      });
    }
  }

  return suggestions;
}

type ApplyActionInput =
  | { type: "pause"; campaignId: string }
  | { type: "enable"; campaignId: string }
  | { type: "set_budget"; campaignId: string; dailyBudget: number };

async function applyAction(action: ApplyActionInput): Promise<{ success: boolean; message: string }> {
  if (action.type === "pause" || action.type === "enable") {
    await graphPost(`/${action.campaignId}`, {
      status: action.type === "pause" ? "PAUSED" : "ACTIVE",
    });
    return { success: true, message: action.type === "pause" ? "Campaña pausada." : "Campaña activada." };
  }

  if (action.type === "set_budget") {
    await graphPost(`/${action.campaignId}`, {
      daily_budget: String(Math.round(action.dailyBudget * 100)), // Meta expects budgets in cents
    });
    return { success: true, message: "Presupuesto diario actualizado." };
  }

  throw new Error("Acción no soportada.");
}

export const metaAdsClient = {
  isConfigured,
  fetchCampaigns,
  evaluateRules,
  applyAction,
};
