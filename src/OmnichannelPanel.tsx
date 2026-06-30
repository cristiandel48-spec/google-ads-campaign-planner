import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileText,
  MessageCircle,
  RefreshCw,
  Shield,
  Store,
  TrendingUp,
  XCircle,
} from "lucide-react";

type ConnectorStatus = {
  label: string;
  configured: boolean;
  missing: string[];
};

type DailyReport = {
  id: string;
  ts: string;
  date: string;
  meta: {
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
  commerce: {
    source: string;
    totalRevenue: number;
    ordersProcessed: number;
    newCustomers: number;
    recurrentCustomers: number;
  };
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

type OrderEvent = {
  id: string;
  ts: string;
  event: string;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  total: number;
};

type StatusResponse = {
  mode: "off" | "shadow" | "live";
  connectors: {
    meta: ConnectorStatus;
    gemini: ConnectorStatus;
    mastershop: ConnectorStatus;
    whatsapp: ConnectorStatus;
  };
  guardrails: {
    dailySpendCapAccount: number;
    maxBudgetIncreasePct: number;
    autoExecuteRules: string[];
  };
  latestReport: DailyReport | null;
  recentOrders: OrderEvent[];
};

const connectorIcons = {
  meta: TrendingUp,
  mastershop: Store,
  whatsapp: MessageCircle,
  gemini: Bot,
};

const connectorNames = {
  meta: "Meta Ads",
  mastershop: "Mastershop",
  whatsapp: "WhatsApp",
  gemini: "Gemini",
};

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value || 0);
}

function statusClass(configured: boolean) {
  return configured ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";
}

export default function OmnichannelPanel() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, reportData] = await Promise.all([
        fetch("/api/omnichannel/status").then((r) => r.json()),
        fetch("/api/omnichannel/reports?limit=7").then((r) => r.json()),
      ]);
      setStatus(statusData);
      setReports(reportData.reports || []);
    } catch {
      setError("No se pudo cargar la operación omnicanal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const runReport = async () => {
    setRunning(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/omnichannel/report/run", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "No se pudo generar el reporte.");
      } else {
        setMessage("Reporte consolidado generado.");
        await loadAll();
      }
    } catch {
      setError("No se pudo generar el reporte.");
    } finally {
      setRunning(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-6 text-center text-xs text-stone-500 shadow-sm">
        {loading ? "Cargando operación omnicanal..." : error || "Sin datos."}
      </div>
    );
  }

  const latest = status.latestReport || reports[0] || null;
  const connectors = Object.entries(status.connectors) as Array<[keyof StatusResponse["connectors"], ConnectorStatus]>;

  return (
    <div className="space-y-6" id="omnichannel-panel">
      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-xl text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-950 flex items-center gap-2">
                Centro Omnicanal
                <span className={"text-[10px] px-2 py-0.5 rounded-full border font-extrabold " + statusClass(status.mode === "live")}>
                  {status.mode.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Publicidad, tienda, pedidos, WhatsApp y reportes en una sola operación.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runReport}
              disabled={running}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <FileText className={"w-3.5 h-3.5 " + (running ? "animate-pulse" : "")} />
              {running ? "Generando..." : "Generar reporte"}
            </button>
            <button
              onClick={loadAll}
              disabled={loading}
              className="text-xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={"w-3.5 h-3.5 " + (loading ? "animate-spin" : "")} />
              Refrescar
            </button>
          </div>
        </div>
        {message && (
          <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> {message}
          </div>
        )}
        {error && (
          <div className="mt-3 text-[11px] text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {connectors.map(([key, item]) => {
          const Icon = connectorIcons[key];
          return (
            <div key={key} className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-rose-950">
                  <Icon className="w-4 h-4 text-pink-500" />
                  {connectorNames[key]}
                </div>
                <span className={"text-[9px] px-1.5 py-0.5 rounded border font-bold " + statusClass(item.configured)}>
                  {item.configured ? "CONECTADO" : "PENDIENTE"}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed min-h-8">
                {item.configured ? "Listo para operar dentro de los límites configurados." : "Falta: " + item.missing.join(", ")}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Metric label="Ingresos" value={latest ? formatCOP(latest.consolidated.revenue) : formatCOP(0)} />
        <Metric label="Gasto Ads" value={latest ? formatCOP(latest.consolidated.adSpend) : formatCOP(0)} />
        <Metric label="ROAS" value={latest ? formatNumber(latest.consolidated.roas) + "x" : "0x"} accent={latest ? latest.consolidated.roas >= 3 : false} />
        <Metric label="Pedidos" value={latest ? formatNumber(latest.consolidated.ordersProcessed) : "0"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3 overflow-x-auto">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Reportes diarios</h3>
            <span className="text-[10px] text-stone-500">{reports.length} registros</span>
          </div>
          {reports.length === 0 ? (
            <div className="text-xs text-stone-500 py-6 text-center flex flex-col items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-stone-300" />
              Aún no hay reportes consolidados.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-stone-500 border-b border-rose-50">
                  <th className="py-2 pr-3 font-bold">Fecha</th>
                  <th className="py-2 pr-3 font-bold">Ingresos</th>
                  <th className="py-2 pr-3 font-bold">Ads</th>
                  <th className="py-2 pr-3 font-bold">ROAS</th>
                  <th className="py-2 pr-3 font-bold">CPM</th>
                  <th className="py-2 pr-3 font-bold">CPC</th>
                  <th className="py-2 pr-3 font-bold">CVR</th>
                  <th className="py-2 pr-3 font-bold">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-stone-50 align-top">
                    <td className="py-2 pr-3 font-mono text-[10px] text-stone-600 whitespace-nowrap">{report.date}</td>
                    <td className="py-2 pr-3 font-semibold text-rose-950">{formatCOP(report.consolidated.revenue)}</td>
                    <td className="py-2 pr-3">{formatCOP(report.consolidated.adSpend)}</td>
                    <td className="py-2 pr-3 font-bold text-pink-600">{formatNumber(report.consolidated.roas)}x</td>
                    <td className="py-2 pr-3">{formatCOP(report.meta.cpm)}</td>
                    <td className="py-2 pr-3">{formatCOP(report.meta.cpc)}</td>
                    <td className="py-2 pr-3">{formatNumber(report.meta.conversionRate)}%</td>
                    <td className="py-2 pr-3 text-[10px] text-stone-600 max-w-72">
                      {report.alerts.length ? report.alerts.join(" | ") : "Sin alertas"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Pedidos recientes</h3>
          {status.recentOrders.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">Sin eventos de Mastershop todavía.</p>
          ) : (
            <div className="space-y-2">
              {status.recentOrders.map((order) => (
                <div key={order.id} className="p-3 rounded-xl border border-stone-150 bg-stone-50/40 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-rose-950">#{order.orderId}</span>
                    <span className="text-[9px] uppercase font-bold text-stone-500">{order.event}</span>
                  </div>
                  <div className="text-[11px] text-stone-600 flex items-center justify-between gap-2">
                    <span>{order.customerName || order.customerPhone || "Cliente"}</span>
                    <span className="font-mono">{formatCOP(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">Flujo operativo</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
          {["Meta Ads", "Landing", "Checkout", "Mastershop", "WhatsApp"].map((step, index) => (
            <div key={step} className="p-3 rounded-xl border border-rose-100 bg-[#FFFDFB] text-center text-rose-950 font-bold">
              <span className="text-[10px] text-stone-400 font-mono block mb-1">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm space-y-1.5">
      <p className="text-[11px] text-rose-900/60 uppercase font-bold">{label}</p>
      <div className={"text-xl font-mono font-black " + (accent ? "text-emerald-600" : "text-rose-950")}>{value}</div>
    </div>
  );
}
