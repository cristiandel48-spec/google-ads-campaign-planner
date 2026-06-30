import React, { useEffect, useState } from "react";
import {
  RefreshCw,
  AlertCircle,
  Pause,
  TrendingUp,
  ShieldAlert,
  Link2,
  Repeat,
} from "lucide-react";
import { MetaCampaignMetric, MetaAdsSuggestion } from "./types";

const severityStyles: Record<string, string> = {
  critical: "bg-red-50 border-red-200 text-red-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  opportunity: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

const typeLabel: Record<string, string> = {
  pause: "Pausar campaña",
  increase_budget: "Subir presupuesto +20%",
  decrease_budget: "Bajar presupuesto",
  refresh_creative: "Renovar creativo",
  reduce_frequency: "Reducir frecuencia / ampliar audiencia",
};

export default function MetaAdsPanel() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaignMetric[]>([]);
  const [suggestions, setSuggestions] = useState<MetaAdsSuggestion[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const loadAccountStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch("/api/meta-account/campaigns").then((r) => r.json());
      setConfigured(data.configured);
      if (data.configured && data.success) {
        setCampaigns(data.campaigns || []);
        setSuggestions(data.suggestions || []);
      } else if (data.configured && !data.success) {
        setError(data.message || "No se pudo conectar con tu cuenta de Meta Ads.");
      }
    } catch (e) {
      setError("No se pudo consultar el estado de la cuenta de Meta Ads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountStatus();
  }, []);

  const handleApply = async (s: MetaAdsSuggestion) => {
    setApplyingId(s.id);
    try {
      let action: any = null;
      if (s.type === "pause") {
        action = { type: "pause", campaignId: s.campaignId };
      } else if (s.type === "increase_budget" || s.type === "decrease_budget") {
        if (!s.suggestedDailyBudget) throw new Error("No hay un presupuesto sugerido para esta campaña.");
        action = {
          type: "set_budget",
          campaignId: s.campaignId,
          dailyBudget: s.suggestedDailyBudget,
        };
      } else {
        // Non-mutating suggestion types (refresh_creative, reduce_frequency)
        // are informational only — mark as acknowledged locally.
        setAppliedIds((prev) => new Set(prev).add(s.id));
        setApplyingId(null);
        return;
      }

      const res = await fetch("/api/meta-account/apply-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedIds((prev) => new Set(prev).add(s.id));
        loadAccountStatus();
      } else {
        setError(data.message || "No se pudo aplicar la acción.");
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo aplicar la acción.");
    } finally {
      setApplyingId(null);
    }
  };

  const formatCOP = (val: number) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

  if (configured === false) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center space-y-4 shadow-sm" id="ads-account-not-connected">
        <div className="p-3 bg-rose-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-rose-500">
          <Link2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-extrabold text-rose-950">Tu cuenta real de Meta Ads no está conectada</h3>
        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
          Agrega las variables <code className="text-rose-600 font-mono font-bold">META_ACCESS_TOKEN</code> y{" "}
          <code className="text-rose-600 font-mono font-bold">META_AD_ACCOUNT_ID</code> en tus Secrets. Mira el
          README para la guía paso a paso (Meta Business Suite → System User → permiso ads_management).
        </p>
        <button
          onClick={loadAccountStatus}
          className="text-xs bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-xl font-bold hover:bg-rose-100 transition-colors"
        >
          Reintentar conexión
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="meta-ads-panel">
      <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-2 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-pink-500" />
            <h2 className="text-base font-black text-rose-950">Cuenta Real de Meta Ads — Modo Traficker</h2>
          </div>
          <button
            onClick={loadAccountStatus}
            disabled={loading}
            className="text-xs bg-[#FFF4F5] hover:bg-[#FFE8EA] text-rose-950 border border-rose-200/80 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar datos
          </button>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          Lee métricas reales de los últimos 7 días (Facebook e Instagram) y aplica reglas de optimización como lo
          haría un media buyer. Ninguna acción que afecte tu gasto se ejecuta sola: cada sugerencia requiere que
          hagas clic en "Aplicar".
        </p>
      </div>

      {error && (
        <div className="bg-[#FFF4F5] border border-rose-100 p-4 rounded-2xl flex items-start gap-3 shadow-sm text-rose-950">
          <AlertCircle className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
          <p className="text-xs text-stone-700">{error}</p>
        </div>
      )}

      {/* Suggestions / rule engine output */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-3 shadow-sm">
        <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Sugerencias Automáticas de Optimización</h3>
        {suggestions.length === 0 ? (
          <p className="text-xs text-stone-500">
            {loading ? "Cargando..." : "No hay sugerencias por ahora. Actualiza datos para volver a evaluar."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {suggestions.map((s) => {
              const isApplied = appliedIds.has(s.id);
              return (
                <div key={s.id} className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${severityStyles[s.severity]}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      {s.type === "pause" ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : s.type === "increase_budget" ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : s.type === "reduce_frequency" ? (
                        <Repeat className="w-3.5 h-3.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5" />
                      )}
                      {s.campaignName} — {typeLabel[s.type]}
                      {s.spendAffecting && (
                        <span className="text-[9px] bg-white/70 px-1.5 py-0.5 rounded font-bold">AFECTA GASTO</span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{s.reason}</p>
                  </div>
                  <button
                    onClick={() => handleApply(s)}
                    disabled={applyingId === s.id || isApplied}
                    className="shrink-0 text-[11px] font-bold bg-white border border-current px-3 py-1.5 rounded-lg hover:bg-white/70 transition-colors disabled:opacity-50"
                  >
                    {isApplied ? "Aplicado" : applyingId === s.id ? "Aplicando..." : "Aplicar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campaign table */}
      <div className="bg-white p-5 rounded-2xl border border-rose-100 space-y-3 shadow-sm overflow-x-auto">
        <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Campañas (Últimos 7 Días)</h3>
        {campaigns.length === 0 ? (
          <p className="text-xs text-stone-500">{loading ? "Cargando campañas..." : "Sin campañas para mostrar."}</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-stone-500 border-b border-rose-50">
                <th className="py-2 pr-3 font-bold">Campaña</th>
                <th className="py-2 pr-3 font-bold">Estado</th>
                <th className="py-2 pr-3 font-bold">Presup. Diario</th>
                <th className="py-2 pr-3 font-bold">Alcance</th>
                <th className="py-2 pr-3 font-bold">Frecuencia</th>
                <th className="py-2 pr-3 font-bold">CTR</th>
                <th className="py-2 pr-3 font-bold">Gasto</th>
                <th className="py-2 pr-3 font-bold">Ingresos</th>
                <th className="py-2 pr-3 font-bold">ROAS</th>
                <th className="py-2 pr-3 font-bold">Resultados</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-stone-50">
                  <td className="py-2 pr-3 font-semibold text-rose-950">{c.name}</td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{formatCOP(c.dailyBudget)}</td>
                  <td className="py-2 pr-3">{c.reach.toLocaleString("es-CO")}</td>
                  <td className="py-2 pr-3">{c.frequency.toFixed(2)}x</td>
                  <td className="py-2 pr-3">{c.ctr.toFixed(2)}%</td>
                  <td className="py-2 pr-3">{formatCOP(c.spend)}</td>
                  <td className="py-2 pr-3">{formatCOP(c.purchaseValue)}</td>
                  <td className="py-2 pr-3 font-bold text-pink-600">{c.roas.toFixed(2)}x</td>
                  <td className="py-2 pr-3">{c.results}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
