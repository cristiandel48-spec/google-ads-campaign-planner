// automation/config.ts
// Governance config for the automated traffic agent. Everything here is a
// guardrail: caps, kill switch, mode. The engine reads this on every cycle
// and refuses to act if anything is out of bounds.

import fs from "fs";
import path from "path";

export type AutomationMode = "off" | "shadow" | "live";

export interface AutomationConfig {
  // off    = engine does nothing at all (kill switch).
  // shadow = engine evaluates and logs decisions but never calls Meta.
  // live   = engine executes decisions that pass the caps below.
  mode: AutomationMode;

  // Hard daily ceiling across the whole account, in account currency units
  // (COP by default). If the sum of dailyBudget across active campaigns
  // already exceeds this, the engine refuses any further budget increases.
  dailySpendCapAccount: number;

  // Max % a single campaign's daily budget can be raised per cycle.
  maxBudgetIncreasePct: number;

  // Min spend on a campaign before any rule fires (avoids reacting to noise).
  minSpendForDecision: number;

  // Per-cycle throttle: at most N spend-affecting actions executed per run.
  maxActionsPerCycle: number;

  // Which rule types are allowed to auto-execute when mode === "live".
  // Anything not in this set is logged-only even in live mode.
  autoExecuteRules: Array<
    "pause" | "increase_budget" | "decrease_budget" | "refresh_creative" | "reduce_frequency"
  >;
}

const DEFAULTS: AutomationConfig = {
  mode: "shadow",
  dailySpendCapAccount: 500_000, // 500k COP/day total
  maxBudgetIncreasePct: 20,
  minSpendForDecision: 30_000, // 30k COP minimum spend before acting
  maxActionsPerCycle: 5,
  autoExecuteRules: ["pause"], // start conservative: only auto-pause
};

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_PATH = path.join(DATA_DIR, "automation-config.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadConfig(): AutomationConfig {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULTS, null, 2));
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AutomationConfig>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(patch: Partial<AutomationConfig>): AutomationConfig {
  const current = loadConfig();
  const next: AutomationConfig = { ...current, ...patch };
  ensureDataDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
  return next;
}

export function killSwitch(): AutomationConfig {
  return saveConfig({ mode: "off" });
}
