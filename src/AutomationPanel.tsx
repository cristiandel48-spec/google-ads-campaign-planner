import React, { useEffect, useState } from "react";
import {
  Power,
  Eye,
  Zap,
  RefreshCw,
  AlertTriangle,
  Save,
  PlayCircle,
  ShieldOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";

type Mode = "off" | "shadow" | "live";

interface AutomationConfig {
  mode: Mode;
  dailySpendCapAccount: number;
  maxBudgetIncreasePct: number;
  minSpendForDecision: number;
  maxActionsPerCycle: number;
  autoExecuteRules: string[];
}

interface DecisionRecord {
  ts: string;
  mode: Mode;
  cycleId: string;
  campaignId: string;
  campaignName: string;
  ruleType: string;
  severity: string;
  reason: string;
  spendAffecting: boolean;
  proposedAction:
    | { type: "pause"; campaignId: string }
    | { type: "enable"; campaignId: string }
    | { type: "set_budget"; campaignId: string; dailyBudget: number }
    | { type: "noop"; note: string };
  executed: boolean;
  blockedReason?: string;
  metricsSnapshot: {
    spend: number;
    results: number;
    ctr: number;
    frequency: number;
    dailyBudget: number;
  };
}

const ALL_RULES: { id: string; label: string }[] = [
  { id: "pause", label: "Pausar campañas perdedoras" },
  { id: "increase_budget", label: "Subir presupuesto a ganadoras" },
  { id: "decrease_budget", label: "Bajar presupuesto a flojas" },
];

const modeMeta: Record<Mode, { label: string; color: string; description: string }> = {
  off: {
    label: "APAGADO",
    color: "bg-stone-100 text-stone-700 border-stone-200",
    description: "El agente no hace nada — ni evalúa ni ejecuta.",
  },
  shadow: {
    label: "SHADOW",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Evalúa y loguea decisiones, pero NO toca tu cuenta de Meta.",
  },
  live: {
    label: "LIVE",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Ejecuta acciones de la lista blanca dentro de los topes definidos.",
  },
};

export default function AutomationPanel() {
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, decRes] = await Promise.all([
        fetch("/api/automation/config").then((r) => r.json()),
        fetch("/api/automation/decisions?limit=50").then((r) => r.json()),
      ]);
      setConfig(cfgRes);
      setDecisions(decRes.decisions || []);
    } catch {
      setError("No se pudo cargar el estado de automatización.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const flashStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const saveConfig = async (patch: Partial<AutomationConfig>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setConfig(data);
        flashStatus("Configuración guardada.");
      }
    } catch {
      setError("No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/automation/run", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        flashStatus(
          `Ciclo ${data.cycleId} — evaluadas: ${data.evaluated}, propuestas: ${data.proposed}, ejecutadas: ${data.executed}, saltadas: ${data.skipped}.`
        );
        await loadAll();
      }
    } catch {
      setError("No se pudo ejecutar el ciclo.");
    } finally {
      setRunning(false);
    }
  };

  const killSwitch = async () => {
    if (!confirm("¿Apagar el agente de automatización? Pasará a modo OFF inmediatamente.")) return;
    await saveConfig({ mode: "off" });
  };

  const toggleRule = (ruleId: string) => {
    if (!config) return;
    const next = config.autoExecuteRules.includes(ruleId)
      ? config.autoExecuteRules.filter((r) => r !== ruleId)
      : [...config.autoExecuteRules, ruleId];
    saveConfig({ autoExecuteRules: next as any });
  };

  if (!config) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-6 text-center text-xs text-stone-500 shadow-sm">
        {loading ? "Cargando agente de automatización..." : error || "Sin datos."}
      </div>
    );
  }

  const meta = modeMeta[config.mode];

  return (
    <div className="space-y-6" id="automation-panel">
      {/* Header / mode banner */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-xl text-white shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-950 flex items-center gap-2">
                Agente de Automatización
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-extrabold ${meta.color}`}>
                  {meta.label}
                </span>
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">{meta.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runNow}
              disabled={running || config.mode === "off"}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <PlayCircle className={`w-3.5 h-3.5 ${running ? "animate-pulse" : ""}`} />
              {running ? "Ejecutando..." : "Ejecutar ciclo ahora"}
            </button>
            <button
              onClick={killSwitch}
              disabled={config.mode === "off"}
              className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Kill switch
            </button>
            <button
              onClick={loadAll}
              disabled={loading}
              className="text-xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refrescar
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {statusMsg}
          </div>
        )}
        {error && (
          <div className="mt-3 text-[11px] text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
      </div>

      {/* Mode picker */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Modo de operación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(["off", "shadow", "live"] as Mode[]).map((m) => {
            const isActive = config.mode === m;
            const icon = m === "off" ? Power : m === "shadow" ? Eye : Zap;
            const Icon = icon;
            return (
              <button
                key={m}
                onClick={() => saveConfig({ mode: m })}
                disabled={saving}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-gradient-to-tr from-[#FFF0F2] to-white border-pink-300 shadow-sm"
                    : "bg-stone-50/50 border-stone-150 hover:bg-rose-50/40"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-950">
                  <Icon className="w-4 h-4" />
                  {modeMeta[m].label}
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{modeMeta[m].description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Governance caps */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Límites (Gobernanza)</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Cap diario de cuenta (COP)"
            help="Suma máxima de presupuestos diarios. Si se supera, no se permiten subidas."
            value={config.dailySpendCapAccount}
            onCommit={(v) => saveConfig({ dailySpendCapAccount: v })}
          />
          <NumberField
            label="Máx % de subida por ciclo"
            help="Tope al incremento de presupuesto de una sola campaña en un ciclo."
            value={config.maxBudgetIncreasePct}
            min={0}
            max={100}
            onCommit={(v) => saveConfig({ maxBudgetIncreasePct: v })}
          />
          <NumberField
            label="Gasto mínimo para decidir (COP)"
            help="Bajo este gasto, el agente no actúa (evita decisiones con datos ruidosos)."
            value={config.minSpendForDecision}
            onCommit={(v) => saveConfig({ minSpendForDecision: v })}
          />
          <NumberField
            label="Máx acciones por ciclo"
            help="Throttle: cuántas acciones que afectan gasto puede ejecutar el agente por corrida."
            value={config.maxActionsPerCycle}
            min={0}
            max={50}
            onCommit={(v) => saveConfig({ maxActionsPerCycle: v })}
          />
        </div>
      </div>

      {/* Auto-execute rules */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3">
        <div>
          <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Reglas auto-aplicables</h3>
          <p className="text-[11px] text-stone-500 mt-1">
            Solo estas se ejecutarán en modo LIVE. El resto queda como sugerencia en el log.
          </p>
        </div>
        <div className="space-y-2">
          {ALL_RULES.map((r) => {
            const on = config.autoExecuteRules.includes(r.id);
            return (
              <label
                key={r.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  on ? "bg-emerald-50 border-emerald-200" : "bg-stone-50/40 border-stone-150 hover:bg-rose-50/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleRule(r.id)}
                  disabled={saving}
                  className="w-4 h-4 accent-pink-500"
                />
                <span className="text-xs font-semibold text-rose-950">{r.label}</span>
                <span className="ml-auto text-[10px] font-mono text-stone-500">{r.id}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Decision log */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Últimas decisiones del agente</h3>
          <span className="text-[10px] text-stone-500">{decisions.length} registros</span>
        </div>
        {decisions.length === 0 ? (
          <div className="text-xs text-stone-500 py-6 text-center flex flex-col items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-stone-300" />
            Aún no hay decisiones registradas. Ejecuta un ciclo para empezar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-stone-500 border-b border-rose-50">
                  <th className="py-2 pr-3 font-bold">Hora</th>
                  <th className="py-2 pr-3 font-bold">Modo</th>
                  <th className="py-2 pr-3 font-bold">Campaña</th>
                  <th className="py-2 pr-3 font-bold">Regla</th>
                  <th className="py-2 pr-3 font-bold">Acción</th>
                  <th className="py-2 pr-3 font-bold">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d, i) => (
                  <tr key={`${d.cycleId}-${i}`} className="border-b border-stone-50 align-top">
                    <td className="py-2 pr-3 font-mono text-[10px] text-stone-600 whitespace-nowrap">
                      {new Date(d.ts).toLocaleString("es-CO")}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${modeMeta[d.mode].color}`}>
                        {modeMeta[d.mode].label}
                      </span>
                    </td>
                    <td className="py-2 pr-3 font-semibold text-rose-950">{d.campaignName}</td>
                    <td className="py-2 pr-3 text-stone-700">{d.ruleType}</td>
                    <td className="py-2 pr-3 text-stone-700">{describeAction(d.proposedAction)}</td>
                    <td className="py-2 pr-3">
                      {d.executed ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
                          ✓ Ejecutado
                        </span>
                      ) : (
                        <span
                          className="text-[10px] text-stone-700 bg-stone-50 border border-stone-100 px-1.5 py-0.5 rounded font-bold"
                          title={d.blockedReason || ""}
                        >
                          ⊘ {d.blockedReason || "no-op"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function describeAction(a: DecisionRecord["proposedAction"]): string {
  switch (a.type) {
    case "pause":
      return "Pausar";
    case "enable":
      return "Activar";
    case "set_budget":
      return `Presupuesto → ${a.dailyBudget.toLocaleString("es-CO")}`;
    case "noop":
      return a.note;
  }
}

// Editable number field that commits only on blur / Enter to avoid spamming the API.
function NumberField({
  label,
  help,
  value,
  min,
  max,
  onCommit,
}: {
  label: string;
  help: string;
  value: number;
  min?: number;
  max?: number;
  onCommit: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string>(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    if (n !== value) onCommit(n);
  };

  return (
    <div>
      <label className="text-[11px] font-bold text-rose-900/80 uppercase tracking-wide block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="flex-1 text-xs p-2 bg-[#FFFDFB] border border-rose-100 rounded-lg text-stone-750 focus:outline-none focus:border-pink-300 focus:ring-1 focus:ring-pink-200"
        />
        <Save className="w-3.5 h-3.5 text-stone-400" />
      </div>
      <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">{help}</p>
    </div>
  );
}
