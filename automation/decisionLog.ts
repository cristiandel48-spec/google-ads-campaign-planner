// automation/decisionLog.ts
// Append-only JSONL log of every decision the agent considered. One line per
// decision. This is the audit trail — read it before trusting the agent.

import fs from "fs";
import path from "path";
import type { AutomationMode } from "./config";

export interface DecisionRecord {
  ts: string; // ISO timestamp
  mode: AutomationMode;
  cycleId: string;
  campaignId: string;
  campaignName: string;
  ruleType: string;
  severity: string;
  reason: string;
  spendAffecting: boolean;
  // What we would do / did.
  proposedAction:
    | { type: "pause"; campaignId: string }
    | { type: "enable"; campaignId: string }
    | { type: "set_budget"; campaignId: string; dailyBudget: number }
    | { type: "noop"; note: string };
  // Outcome: did the engine execute it?
  executed: boolean;
  // Why not, if blocked.
  blockedReason?: string;
  // Snapshot of key metrics at decision time.
  metricsSnapshot: {
    spend: number;
    results: number;
    ctr: number;
    frequency: number;
    dailyBudget: number;
    purchaseValue: number;
    roas: number;
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const LOG_PATH = path.join(DATA_DIR, "agent-decisions.jsonl");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function appendDecision(record: DecisionRecord): void {
  ensureDataDir();
  fs.appendFileSync(LOG_PATH, JSON.stringify(record) + "\n");
}

export function readRecentDecisions(limit = 100): DecisionRecord[] {
  ensureDataDir();
  if (!fs.existsSync(LOG_PATH)) return [];
  const raw = fs.readFileSync(LOG_PATH, "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  const tail = lines.slice(-limit);
  const out: DecisionRecord[] = [];
  for (const line of tail) {
    try {
      out.push(JSON.parse(line) as DecisionRecord);
    } catch {
      // skip corrupt line
    }
  }
  return out.reverse(); // newest first
}
