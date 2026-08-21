import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Building2, Users, PlugZap, AlertTriangle, ChevronRight, Layers, Cpu, ShieldCheck, ArrowRight, Trash2, Plus, X, CheckCircle2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import * as api from "../../../lib/api";
import { StatCard } from "../../../components/chart/StatCard";
import { DonutChart } from "../../../components/chart/DonutChart";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { DeleteConfirmModal } from "../../../components/ui/DeleteConfirmModal";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, ProgressStat,
  Table, Thead, Th, Td, Tr, StatusDot, Button, Input
} from "../../../components/ui/primitives";

import type { SocietyOverview, SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow, DailyTrendPoint } from "../../../lib/types";
import { cn } from "../../../lib/utils";
import { useWebSocketReading } from "../../../context/WebSocketContext";

interface DashboardTabProps {
  societyId: string;
  onSelectBlock: (id: string, name: string) => void;
  onSelectFlat: (id: string, flatNumber: string) => void;
  anomalies: any[];
  setAnomalies: React.Dispatch<React.SetStateAction<any[]>>;
  flats: SocietyFlatRow[] | null;
}

export function DashboardTab({
  societyId,
  onSelectBlock,
  onSelectFlat,
  anomalies,
  setAnomalies,
  flats,
}: DashboardTabProps) {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<SocietyOverview | null>(null);
  const [blocks, setBlocks] = useState<SocietyBlockRow[] | null>(null);
  const [commonAreas, setCommonAreas] = useState<SocietyCommonAreaRow[] | null>(null);
  const [trendData, setTrendData] = useState<DailyTrendPoint[] | null>(null);
  const [dateRange, setDateRange] = useState("Last 7 days");

  // Block management states
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<SocietyBlockRow | null>(null);
  const [newBlockName, setNewBlockName] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockSuccess, setBlockSuccess] = useState<string | null>(null);

  const { latestReading } = useWebSocketReading();

  // Handle live WebSocket telemetry updates
  useEffect(() => {
    if (!latestReading) return;

    const matchesSociety = String(latestReading.societyId) === String(societyId) || latestReading.isDemo;

    if (matchesSociety) {
      setOverview((prev) =>
        prev
          ? {
            ...prev,
            liveKw: Number((prev.liveKw + (latestReading.kw ?? 0) * 0.05).toFixed(1)),
          }
          : prev
      );

      if (latestReading.kwh) {
        setTrendData((prev) => {
          if (!prev || prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          const isCommon = Boolean(latestReading.commonAreaId || latestReading.deviceType === "COMMON_AREA_METER");
          updated[lastIdx] = {
            ...updated[lastIdx],
            total: Number((updated[lastIdx].total + latestReading.kwh).toFixed(1)),
            common: isCommon
              ? Number((updated[lastIdx].common + latestReading.kwh).toFixed(1))
              : updated[lastIdx].common,
          };
          return updated;
        });
      }
    }

    if (latestReading.commonAreaId || latestReading.deviceType === "COMMON_AREA_METER") {
      setCommonAreas((prev) =>
        prev
          ? prev.map((ca) =>
            String(ca.id) === String(latestReading.commonAreaId)
              ? { ...ca, currentKw: latestReading.kw }
              : ca
          )
          : prev
      );
    }

    if (latestReading.flatNumber) {
      setBlocks((prev) =>
        prev
          ? prev.map((block) =>
            latestReading.flatNumber?.startsWith(block.name.replace("Block ", ""))
              ? {
                ...block,
                liveKw: Number((block.liveKw + (latestReading.kw ?? 0) * 0.05).toFixed(1)),
              }
              : block
          )
          : prev
      );
    }
  }, [latestReading, societyId]);

  // Fetch initial data from backend API
  useEffect(() => {
    setOverview(null);
    setBlocks(null);
    setCommonAreas(null);

    api.getSocietyOverview(societyId).then(setOverview).catch(() => { });
    api.getSocietyBlocks(societyId).then(setBlocks).catch(() => { });
    api.getSocietyCommonAreas(societyId).then(setCommonAreas).catch(() => { });
  }, [societyId]);

  // Fetch real daily trend strictly from backend API
  useEffect(() => {
    if (!societyId) return;

    let days = 7;
    if (dateRange === "Last 30 days") days = 30;
    else if (dateRange === "Month to date") days = Math.max(1, new Date().getDate());

    api.getSocietyDailyTrend(societyId, days)
      .then(setTrendData)
      .catch(() => setTrendData([]));
  }, [societyId, dateRange]);

  // Derived metrics from backend response
  const totalFlats = overview?.totalFlats ?? (flats?.length || 0);
  const occupiedFlats = overview?.occupiedFlats ?? (flats?.filter((f) => f.occupied || f.residentName).length || 0);
  const devicesOnline = overview?.devicesOnline ?? (flats?.filter((f) => f.meterStatus === "live").length || 0);
  const registeredResidents = flats?.filter((f) => Boolean(f.residentName)).length || 0;

  // Block comparison for bar chart
  const blockComparisonData = useMemo(() => {
    return (blocks ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      flatCount: b.flatCount || 0,
      liveKw: b.liveKw,
      todayKwh: b.todayKwh,
      mtdKwh: b.mtdKwh,
      aboveAverage: b.aboveAverage,
      kwh: b.flatCount > 0 ? Math.round(b.mtdKwh / b.flatCount) : 0,
    }));
  }, [blocks]);

  // Common areas breakdown for donut chart (strictly non-zero real kW)
  const dynamicLoadSegments = useMemo(() => {
    if (!commonAreas || commonAreas.length === 0) return [];
    const hasAnyLoad = commonAreas.some((ca) => (ca.currentKw ?? 0) > 0);
    if (!hasAnyLoad) return [];

    const colors = ["#0d9488", "#0284c7", "#f59e0b", "#7c3aed", "#ec4899", "#10b981"];
    return commonAreas
      .filter((ca) => (ca.currentKw ?? 0) > 0)
      .map((ca, idx) => ({
        name: ca.name,
        value: Number((ca.currentKw ?? 0).toFixed(2)),
        color: colors[idx % colors.length],
      }));
  }, [commonAreas]);

  // Average flat consumption and top 5 consuming flats
  const avgFlatMtd = useMemo(() => {
    if (!flats || flats.length === 0) return 0;
    const total = flats.reduce((sum, f) => sum + (f.mtdKwh || 0), 0);
    return Math.round(total / flats.length) || 1;
  }, [flats]);

  const topConsumers = useMemo(() => {
    return [...(flats ?? [])]
      .sort((a, b) => (b.mtdKwh || 0) - (a.mtdKwh || 0))
      .slice(0, 5);
  }, [flats]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            {overview?.name ? `${overview.name} — Live view` : "Society live view"}
          </h1>
          <p className="text-sm text-slate-500">
            {overview ? `${totalFlats} flats · ${blocks?.length || 0} blocks` : "Connecting to society meters..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomSelect
            value={dateRange}
            onChange={setDateRange}
            options={["Last 7 days", "Last 30 days", "Month to date"]}
          />
        </div>
      </div>

      {/* Row 1: 5 Primary Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Live load"
          value={overview ? `${overview.liveKw.toFixed(1)} kW` : "—"}
          sub={overview ? `Peak today · ${Math.round(overview.liveKw * 1.2)} kW` : ""}
          icon={<Zap size={16} />}
          loading={!overview}
          accent
        />
        <StatCard
          label="Total flats"
          value={overview ? `${overview.totalFlats}` : "—"}
          sub={overview ? `${occupiedFlats} occupied` : ""}
          icon={<Building2 size={16} />}
          loading={!overview}
        />
        <StatCard
          label="Meters online"
          value={overview ? `${devicesOnline}/${totalFlats}` : "—"}
          sub={overview && totalFlats > 0 ? `${((devicesOnline / totalFlats) * 100).toFixed(0)}% online` : ""}
          icon={<PlugZap size={16} />}
          loading={!overview}
        />
        <StatCard
          label="Active alerts"
          value={anomalies.filter((a) => !a.resolved).length.toString()}
          sub={`${anomalies.filter((a) => !a.resolved).length} active`}
          icon={<AlertTriangle size={16} className={anomalies.some((a) => !a.resolved) ? "text-red-500 animate-glow" : ""} />}
          loading={!overview}
        />
        <StatCard
          label="Registered"
          value={flats ? `${registeredResidents}` : "—"}
          sub="Residents registered"
          icon={<Users size={16} />}
          loading={!flats}
        />
      </div>

      {/* Row 2: Daily Consumption Trend + Load Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Daily consumption trend</CardTitle>
              <CardDescription>Society total · Common areas stacked</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {!trendData ? (
              <div className="h-full w-full skeleton-box rounded-xl" />
            ) : trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No daily telemetry recorded for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorCommon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                    unit=" kWh"
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    formatter={(value: any, name: any) => [`${value} kWh`, name]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Society Total"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    dot={{ r: 4, fill: "#0d9488" }}
                    activeDot={{ r: 6 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="common"
                    name="Common Areas"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCommon)"
                    dot={{ r: 4, fill: "#7c3aed" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {dynamicLoadSegments.length > 0 ? (
          <DonutChart
            title="Load distribution"
            description="By common area facility"
            segments={dynamicLoadSegments}
          />
        ) : (
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle>Load distribution</CardTitle>
              <CardDescription>By common area facility</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
              {!commonAreas ? (
                <div className="h-44 w-44 rounded-full skeleton-box" />
              ) : (
                <span className="text-xs text-slate-400">No common area load data</span>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 3: Block Comparison (Redesigned) + Anomalies Detected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100/80">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-teal-600" />
                  <CardTitle>Block Comparison</CardTitle>
                </div>
                <CardDescription className="mt-0.5">Per-flat average consumption vs society baseline</CardDescription>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                Avg: {avgFlatMtd.toFixed(2)} kWh/flat
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="flex flex-col gap-2.5 max-h-[305px] overflow-y-auto pr-1">
              {!blocks ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 skeleton-box rounded-xl" />
                ))
              ) : blockComparisonData.length === 0 ? (
                <div className="flex h-44 items-center justify-center text-xs text-slate-400">
                  No block telemetry provisioned
                </div>
              ) : (
                (() => {
                  const maxKwh = Math.max(...blockComparisonData.map((b) => b.kwh), 1);
                  return blockComparisonData.map((b, idx) => {
                    const pct = Math.min(100, Math.round((b.kwh / maxKwh) * 100));
                    const isTop = idx === 0 && b.kwh > 0;
                    const isAbove = avgFlatMtd > 0 && b.kwh > avgFlatMtd;

                    return (
                      <div
                        key={b.name}
                        onClick={() => b.id && onSelectBlock(String(b.id), b.name)}
                        className={cn(
                          "group p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-2",
                          b.kwh > 0
                            ? "bg-white border-slate-200 hover:border-teal-400 hover:shadow-md hover:shadow-teal-500/5"
                            : "bg-slate-50/60 border-slate-200/70 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-transform duration-200 group-hover:scale-105",
                                b.kwh > 0
                                  ? isTop
                                    ? "bg-teal-500 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-slate-100 text-slate-400"
                              )}
                            >
                              {b.name}
                            </div>
                            <div>
                              <span className="font-semibold text-xs text-slate-800 group-hover:text-teal-700 transition-colors">
                                {`Block ${b.name}`}
                              </span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                {b.flatCount} Flats · {b.liveKw != null ? `${b.liveKw.toFixed(2)} kW live` : "Standby"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {b.kwh > 0 ? (
                              <>
                                <span className="font-mono-data text-xs font-bold text-slate-900">
                                  {b.kwh.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">kWh/flat</span>
                                </span>
                                <span
                                  className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                    isAbove
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  )}
                                >
                                  {isAbove ? "Above avg" : "Optimal"}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                Standby · 0 kWh
                              </span>
                            )}
                            <ChevronRight size={13} className="text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>

                        {/* Progress Fill Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              b.kwh > 0
                                ? isTop
                                  ? "bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400"
                                  : "bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-300"
                                : "bg-transparent"
                            )}
                            style={{ width: b.kwh > 0 ? `${Math.max(6, pct)}%` : "0%" }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Anomalies detected</CardTitle>
              <CardDescription>{anomalies.filter((a) => !a.resolved).length} active alerts</CardDescription>
            </div>
            {anomalies.filter((a) => !a.resolved).length > 0 && <Badge variant="high">Active</Badge>}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3.5 max-h-[305px] overflow-y-auto pr-2">
              {anomalies.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-xs text-slate-400">No active anomalies</div>
              ) : (
                anomalies.map((a) => (
                  <div
                    key={a.id}
                    className={cn(
                      "p-3 rounded-xl border transition-all flex flex-col justify-between gap-1.5",
                      a.resolved ? "border-slate-100 bg-slate-50/50 opacity-60" : "border-red-100 bg-red-50/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-800">{a.flat}</span>
                      <Badge variant={a.resolved ? "neutral" : "high"}>{a.resolved ? "Handled" : a.multiplier}</Badge>
                    </div>
                    <p className="text-xs text-slate-600">{a.desc}</p>
                    {!a.resolved && (
                      <div className="flex gap-3 mt-1">
                        <button
                          onClick={() => setAnomalies(anomalies.map((an) => (an.id === a.id ? { ...an, resolved: true } : an)))}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-600 cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Common Areas Grid + Onboarding Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Common areas</CardTitle>
              <CardDescription>Live status of shared assets</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {!commonAreas ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[100px] skeleton-box rounded-xl" />
              ))
            ) : commonAreas.length === 0 ? (
              <div className="col-span-3 text-center py-6 text-xs text-slate-400">No common area devices found</div>
            ) : (
              commonAreas.map((ca) => (
                <div
                  key={ca.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white relative flex flex-col justify-between h-[110px]"
                >
                  <div className="absolute top-4 right-4">
                    <StatusDot status={ca.currentKw && ca.currentKw > 0 ? "live" : "offline"} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-slate-800 block truncate pr-4">{ca.name}</span>
                    <span className="text-2xl font-bold text-slate-900 block mt-1">
                      {ca.currentKw ?? 0} <span className="text-xs font-medium text-slate-400">kW</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{ca.category || "Common Facility"}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Onboarding & Deployment Readiness (Redesigned) */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100/80">
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-indigo-600" />
                  <CardTitle>Onboarding & Meters</CardTitle>
                </div>
                <CardDescription className="mt-0.5">Society device rollout status</CardDescription>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {totalFlats > 0 ? Math.round(((devicesOnline + registeredResidents) / (totalFlats * 2 || 1)) * 100) : 0}% Ready
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex flex-col gap-3">
            {/* Metric 1: Smart Meters Active */}
            <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold">
                    <Zap size={14} />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block leading-tight">Meters Live</span>
                    <span className="text-[10px] text-slate-400">{devicesOnline} of {totalFlats} flats</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-data text-xs font-bold text-slate-900">
                    {totalFlats > 0 ? Math.round((devicesOnline / totalFlats) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">{totalFlats - devicesOnline} pending</span>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalFlats > 0 ? Math.round((devicesOnline / totalFlats) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Resident App Accounts */}
            <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                    <Users size={14} />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block leading-tight">Residents Registered</span>
                    <span className="text-[10px] text-slate-400">{registeredResidents} of {totalFlats} registered</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-data text-xs font-bold text-slate-900">
                    {totalFlats > 0 ? Math.round((registeredResidents / totalFlats) * 100) : 0}%
                  </span>
                  <span className="text-[10px] text-slate-400 block">{totalFlats - registeredResidents} pending</span>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-500"
                  style={{ width: `${totalFlats > 0 ? Math.round((registeredResidents / totalFlats) * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Metric 3: Common Area Assets */}
            <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <ShieldCheck size={14} />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block leading-tight">Common Area Meters</span>
                    <span className="text-[10px] text-slate-400">{commonAreas?.length || 0} assets live</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono-data text-xs font-bold text-emerald-600">100%</span>
                  <span className="text-[10px] text-emerald-600 block font-semibold">Active</span>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => navigate(`/society/${societyId}/devices`)}
              className="mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs hover:shadow"
            >
              <Cpu size={14} /> Manage Devices & Meters <ArrowRight size={13} />
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Blocks & Top Consuming Flats */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Society Blocks & Topology</CardTitle>
            <CardDescription>Click any block to drill into floors and flats, or add new blocks</CardDescription>
          </div>
          <Button
            variant="teal"
            size="sm"
            onClick={() => setShowAddBlockModal(true)}
            className="flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus size={14} /> Add Block
          </Button>
        </CardHeader>
        <CardContent>
          {blockSuccess && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50/90 p-3 text-xs font-semibold text-teal-900 shadow-sm animate-fade-in">
              <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
              <span>{blockSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {(blocks ?? []).map((b) => (
              <div
                key={b.id}
                onClick={() => onSelectBlock(String(b.id), b.name)}
                className="group flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:border-teal-500 hover:bg-teal-50/20 text-left transition-all cursor-pointer bg-white"
              >
                <div>
                  <span className="font-semibold text-sm block text-slate-800 group-hover:text-teal-700">{b.name}</span>
                  <span className="text-xs text-slate-400">{b.flatCount} flats</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlockToDelete(b);
                    }}
                    className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title={`Delete ${b.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={15} className="text-slate-400 group-hover:text-teal-600" />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wider">Top Consuming Flats</h4>
            <Table>
              <Thead>
                <tr>
                  <Th>Flat</Th>
                  <Th>Block</Th>
                  <Th>kWh</Th>
                  <Th>vs Avg</Th>
                  <Th>Status</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {!flats ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Tr key={i}>
                      <Td><div className="h-4 w-16 skeleton-box rounded" /></Td>
                      <Td><div className="h-4 w-20 skeleton-box rounded" /></Td>
                      <Td><div className="h-4 w-12 skeleton-box rounded" /></Td>
                      <Td><div className="h-4 w-10 skeleton-box rounded" /></Td>
                      <Td><div className="h-4 w-14 skeleton-box rounded" /></Td>
                      <Td></Td>
                    </Tr>
                  ))
                ) : (
                  topConsumers.map((f) => {
                    const vsAvg = avgFlatMtd > 0 ? Math.round(((f.mtdKwh - avgFlatMtd) / avgFlatMtd) * 100) : 0;
                    const statusVariant = vsAvg > 20 ? "attention" : vsAvg < -5 ? "efficient" : "neutral";
                    const statusLabel = vsAvg > 20 ? "Above avg" : vsAvg < -5 ? "Efficient" : "Normal";
                    return (
                      <Tr key={f.id} onClick={() => onSelectFlat(String(f.id), f.flatNumber)} className="cursor-pointer">
                        <Td className="font-semibold text-slate-900">{f.flatNumber}</Td>
                        <Td>{f.blockName}</Td>
                        <Td className="font-mono-data font-semibold">{f.mtdKwh}</Td>
                        <Td>
                          <span className={vsAvg > 0 ? "text-red-500 font-medium" : "text-teal-600 font-medium"}>
                            {vsAvg > 0 ? "+" : ""}{vsAvg}%
                          </span>
                        </Td>
                        <Td><Badge variant={statusVariant}>{statusLabel}</Badge></Td>
                        <Td>
                          <ChevronRight size={15} className="text-slate-300" />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Block Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(blockToDelete)}
        onClose={() => setBlockToDelete(null)}
        onConfirm={async () => {
          if (!blockToDelete) return;
          try {
            await api.deleteBlock(societyId, blockToDelete.id);
            setBlocks((prev) => (prev ? prev.filter((b) => b.id !== blockToDelete.id) : prev));
            setBlockSuccess(`Block "${blockToDelete.name}" deleted successfully.`);
            setTimeout(() => setBlockSuccess(null), 4000);
          } catch (err: any) {
            console.error("Failed to delete block", err);
          }
        }}
        title="Delete Block"
        itemName={blockToDelete?.name}
        description={
          <p>
            Are you sure you want to delete <strong>"{blockToDelete?.name}"</strong>? All floors and flats inside this block will be deleted, and residents unlinked.
          </p>
        }
        confirmText="Delete Block"
        dangerNote="This action is permanent."
      />

      {/* Add Block Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !blockLoading && setShowAddBlockModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Layers size={18} />
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">Add Block</h3>
              </div>
              <button
                onClick={() => setShowAddBlockModal(false)}
                disabled={blockLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                if (!newBlockName) return;
                setBlockLoading(true);
                try {
                  await api.createBlock({ blockName: newBlockName, societyId: Number(societyId) });
                  setBlocks((prev) => [
                    ...(prev || []),
                    {
                      id: Date.now().toString(),
                      name: newBlockName,
                      flatCount: 24,
                      liveKw: 0,
                      todayKwh: 0,
                      mtdKwh: 0,
                      aboveAverage: false,
                    },
                  ]);
                  setShowAddBlockModal(false);
                  setBlockSuccess(`Block "${newBlockName}" added successfully.`);
                  setTimeout(() => setBlockSuccess(null), 4000);
                  setNewBlockName("");
                } catch {
                } finally {
                  setBlockLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Block Name *</label>
                <Input
                  required
                  placeholder="e.g. Block E / Tower 5"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBlockModal(false)}
                  disabled={blockLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  size="sm"
                  disabled={blockLoading}
                  className="cursor-pointer"
                >
                  {blockLoading ? "Adding..." : "Add Block"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
