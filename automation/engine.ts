// automation/engine.ts
// Glue between Meta rules and the governance layer. One cycle:
//   1. read config
//   2. if mode === "off", do nothing
//   3. fetch campaigns + run rule engine
//   4. for each suggestion, decide a concrete action, check caps,
//      log the decision, and (only in live mode) execute.

import { metaAdsClient, type MetaAdsSuggestion, type MetaCampaignMetric } from "../metaAdsClient";
import { loadConfig, type AutomationConfig } from "./config";
import { appendDecision, type DecisionRecord } from "./decisionLog";

export interface CycleResult {
  cycleId: string;
  mode: AutomationConfig["mode"];
  evaluated: number;
  proposed: number;
  executed: number;
  skipped: number;
  errors: string[];
}

function newCycleId(): string {
  return `cyc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function totalDailyBudget(campaigns: MetaCampaignMetric[]): number {
  return campaigns
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + (c.dailyBudget || 0), 0);
}

function snapshot(c: MetaCampaignMetric): DecisionRecord["metricsSnapshot"] {
  return {
    spend: c.spend,
    results: c.results,
    ctr: c.ctr,
    frequency: c.frequency,
    dailyBudget: c.dailyBudget,
  };
}

// Translate a suggestion + campaign state into a concrete action plus
// whatever governance check blocks it. Returns the proposed action and an
// optional blockedReason. Never executes anything.
function planAction(
  suggestion: MetaAdsSuggestion,
  campaign: MetaCampaignMetric,
  config: AutomationConfig,
  accountBudgetSoFar: number
): { action: DecisionRecord["proposedAction"]; blockedReason?: string } {
  // Noise floor: ignore suggestions on campaigns with too little spend to
  // be statistically meaningful, except for "pause" which we want even at
  // zero results (the rule itself already gates on spend).
  if (
    suggestion.type !== "pause" &&
    campaign.spend < config.minSpendForDecision
  ) {
    return {
      action: { type: "noop", note: `Gasto ${campaign.spend} < mínimo ${config.minSpendForDecision} para decidir.` },
      blockedReason: "below_min_spend",
    };
  }

  switch (suggestion.type) {
    case "pause":
      return { action: { type: "pause", campaignId: campaign.id } };

    case "increase_budget": {
      const currentBudget = campaign.dailyBudget;
      if (currentBudget <= 0) {
        return {
          action: { type: "noop", note: "Presupuesto actual no disponible." },
          blockedReason: "missing_budget",
        };
      }
      const cap = currentBudget * (1 + config.maxBudgetIncreasePct / 100);
      const requested = suggestion.suggestedDailyBudget ?? cap;
      const next = Math.min(requested, cap);
      const delta = next - currentBudget;

      // Reject if the account-wide cap would be breached.
      if (accountBudgetSoFar + delta > config.dailySpendCapAccount) {
        return {
          action: {
            type: "set_budget",
            campaignId: campaign.id,
            dailyBudget: next,
          },
          blockedReason: `account_cap_exceeded (sum=${accountBudgetSoFar + delta} > cap=${config.dailySpendCapAccount})`,
        };
      }
      return {
        action: { type: "set_budget", campaignId: campaign.id, dailyBudget: next },
      };
    }

    case "decrease_budget": {
      const currentBudget = campaign.dailyBudget;
      if (currentBudget <= 0) {
        return {
          action: { type: "noop", note: "Presupuesto actual no disponible." },
          blockedReason: "missing_budget",
        };
      }
      const next = Math.max(1000, Math.round(currentBudget * 0.7));
      return {
        action: { type: "set_budget", campaignId: campaign.id, dailyBudget: next },
      };
    }

    case "refresh_creative":
    case "reduce_frequency":
      // These don't have a programmatic equivalent yet — surface as noop so
      // they show up in the log for human follow-up.
      return {
        action: { type: "noop", note: `Sugerencia ${suggestion.type} requiere acción humana (no auto-aplicable).` },
        blockedReason: "manual_only",
      };
  }
}

export async function runCycle(): Promise<CycleResult> {
  const cycleId = newCycleId();
  const config = loadConfig();
  const result: CycleResult = {
    cycleId,
    mode: config.mode,
    evaluated: 0,
    proposed: 0,
    executed: 0,
    skipped: 0,
    errors: [],
  };

  if (config.mode === "off") {
    return result;
  }

  if (!metaAdsClient.isConfigured()) {
    result.errors.push("Meta Ads no está configurado (faltan META_ACCESS_TOKEN / META_AD_ACCOUNT_ID).");
    return result;
  }

  let campaigns: MetaCampaignMetric[];
  try {
    campaigns = await metaAdsClient.fetchCampaigns();
  } catch (e: any) {
    result.errors.push(`fetchCampaigns: ${e?.message || e}`);
    return result;
  }

  result.evaluated = campaigns.length;
  const suggestions = metaAdsClient.evaluateRules(campaigns);
  result.proposed = suggestions.length;

  const campaignsById = new Map(campaigns.map((c) => [c.id, c]));
  let accountBudgetRunning = totalDailyBudget(campaigns);
  let executedThisCycle = 0;

  for (const suggestion of suggestions) {
    const campaign = campaignsById.get(suggestion.campaignId);
    if (!campaign) continue;

    const { action, blockedReason: planBlocked } = planAction(
      suggestion,
      campaign,
      config,
      accountBudgetRunning
    );

    let blockedReason = planBlocked;
    let executed = false;

    // Only certain rule types are allowed to auto-execute, and only in live.
    const ruleAllowed = config.autoExecuteRules.includes(suggestion.type);
    if (config.mode !== "live") {
      blockedReason = blockedReason ?? "shadow_mode";
    } else if (!ruleAllowed) {
      blockedReason = blockedReason ?? "rule_not_in_autoexecute_list";
    } else if (executedThisCycle >= config.maxActionsPerCycle) {
      blockedReason = blockedReason ?? "max_actions_per_cycle_reached";
    } else if (action.type === "noop") {
      // nothing to do
    } else if (!blockedReason) {
      try {
        await metaAdsClient.applyAction(action);
        executed = true;
        executedThisCycle++;
        if (action.type === "set_budget") {
          const delta = action.dailyBudget - campaign.dailyBudget;
          accountBudgetRunning += delta;
        }
      } catch (e: any) {
        blockedReason = `apply_error: ${e?.message || e}`;
        result.errors.push(`${suggestion.id}: ${blockedReason}`);
      }
    }

    appendDecision({
      ts: new Date().toISOString(),
      mode: config.mode,
      cycleId,
      campaignId: campaign.id,
      campaignName: campaign.name,
      ruleType: suggestion.type,
      severity: suggestion.severity,
      reason: suggestion.reason,
      spendAffecting: suggestion.spendAffecting,
      proposedAction: action,
      executed,
      blockedReason,
      metricsSnapshot: snapshot(campaign),
    });

    if (executed) result.executed++;
    else result.skipped++;
  }

  return result;
}
