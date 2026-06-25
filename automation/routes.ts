// automation/routes.ts
// HTTP surface for the automation agent: read/update config, see decisions,
// trigger a cycle manually, hit the kill switch.

import type { Express } from "express";
import { loadConfig, saveConfig, killSwitch, type AutomationConfig } from "./config";
import { readRecentDecisions } from "./decisionLog";
import { runCycle } from "./engine";

export function mountAutomationRoutes(app: Express): void {
  app.get("/api/automation/config", (_req, res) => {
    res.json(loadConfig());
  });

  app.post("/api/automation/config", (req, res) => {
    const patch = req.body as Partial<AutomationConfig>;

    // Reject obviously bad input.
    if (patch.mode && !["off", "shadow", "live"].includes(patch.mode)) {
      return res.status(400).json({ error: "mode debe ser off | shadow | live" });
    }
    if (patch.maxBudgetIncreasePct != null && (patch.maxBudgetIncreasePct < 0 || patch.maxBudgetIncreasePct > 100)) {
      return res.status(400).json({ error: "maxBudgetIncreasePct fuera de rango (0-100)" });
    }
    if (patch.dailySpendCapAccount != null && patch.dailySpendCapAccount < 0) {
      return res.status(400).json({ error: "dailySpendCapAccount no puede ser negativo" });
    }

    const next = saveConfig(patch);
    res.json(next);
  });

  app.get("/api/automation/decisions", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    res.json({ decisions: readRecentDecisions(limit) });
  });

  // Manual trigger — useful for testing without waiting for the cron.
  app.post("/api/automation/run", async (_req, res) => {
    try {
      const result = await runCycle();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "cycle failed" });
    }
  });

  // Kill switch: flips mode to "off" immediately.
  app.post("/api/automation/kill", (_req, res) => {
    const next = killSwitch();
    res.json({ killed: true, config: next });
  });
}
