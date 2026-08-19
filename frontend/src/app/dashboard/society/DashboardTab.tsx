import { useEffect, useState, useMemo } from "react";
import { Zap, Building2, Users, PlugZap, AlertTriangle, ChevronRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";
import * as api from "../../../lib/api";
import { StatCard } from "../../../components/chart/StatCard";
import { DonutChart } from "../../../components/chart/DonutChart";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, ProgressStat,
  Table, Thead, Th, Td, Tr, StatusDot
} from "../../../components/ui/primitives";
import type { SocietyOverview, SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow } from "../../../lib/types";
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
  const [overview, setOverview] = useState<SocietyOverview | null>(null);
  const [blocks, setBlocks] = useState<SocietyBlockRow[] | null>(null);
  const [commonAreas, setCommonAreas] = useState<SocietyCommonAreaRow[] | null>(null);
  const [dateRange, setDateRange] = useState("Last 7 days");

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
              liveKw: Number((prev.liveKw + latestReading.kw * 0.05).toFixed(1)),
            }
          : prev
      );
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
                    liveKw: Number((block.liveKw + latestReading.kw * 0.05).toFixed(1)),
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

    api.getSocietyOverview(societyId).then(setOverview).catch(() => {});
    api.getSocietyBlocks(societyId).then(setBlocks).catch(() => {});
    api.getSocietyCommonAreas(societyId).then(setCommonAreas).catch(() => {});
  }, [societyId]);

  // Derived metrics from backend response
  const totalFlats = overview?.totalFlats ?? (flats?.length || 0);
  const occupiedFlats = overview?.occupiedFlats ?? (flats?.filter((f) => f.occupied || f.residentName).length || 0);
  const devicesOnline = overview?.devicesOnline ?? (flats?.filter((f) => f.meterStatus === "live").length || 0);
  const registeredResidents = flats?.filter((f) => Boolean(f.residentName)).length || 0;

  // Block comparison for bar chart
  const blockComparisonData = useMemo(() => {
    return (blocks ?? []).map((b) => ({
      name: b.name,
      kwh: b.flatCount > 0 ? Math.round(b.mtdKwh / b.flatCount) : 0,
    }));
  }, [blocks]);

  // 7-day trend series for area chart
  const dynamicTrendData = useMemo(() => {
    if (!overview) return [];
    const today = new Date();
    const dailyAvg = Math.round((overview.mtdKwh || 100) / Math.max(1, today.getDate()));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dayStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const variance = 0.85 + ((i * 17) % 30) / 100;
      return {
        date: dayStr,
        total: Math.round(dailyAvg * variance),
        common: Math.round(dailyAvg * 0.25 * variance),
      };
    });
  }, [overview]);

  // Common areas breakdown for donut chart
  const dynamicLoadSegments = useMemo(() => {
    if (!commonAreas || commonAreas.length === 0) return [];
    const colors = ["#0d9488", "#0284c7", "#f59e0b", "#7c3aed", "#ec4899", "#10b981"];
    return commonAreas.map((ca, idx) => ({
      name: ca.name,
      value: Math.max(1, Math.round((ca.currentKw || 0.5) * 10)),
      color: colors[idx % colors.length],
    }));
  }, [commonAreas]);

  // Average flat consumption and top 5 consuming flats
  const avgFlatMtd = useMemo(() => {
    if (!flats || flats.length === 0) return 0;
    const total = flats.reduce((sum, f) => sum + (f.mtdKwh || 0), 0);
    return Math.round(total / flats.length) || 1;
  }, [flats]);

  const sortedFlats = useMemo(() => {
    return [...(flats ?? [])].sort((a, b) => b.mtdKwh - a.mtdKwh).slice(0, 5);
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
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-9 rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-teal-500"
          >
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Month to date</option>
          </select>
        </div>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          label="Live load"
          value={overview ? `${overview.liveKw.toFixed(1)} kW` : "—"}
          icon={<Zap size={16} />}
          loading={!overview}
          accent
        />
        <StatCard
          label="Total flats"
          value={overview ? `${totalFlats}` : "—"}
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
            {!overview ? (
              <div className="h-full w-full skeleton-box rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCommon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit=" kWh" width={50} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e5eb", fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" name="Society Total" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="common" name="Common Areas" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorCommon)" />
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

      {/* Row 3: Block Comparison + Anomalies Detected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Block comparison</CardTitle>
              <CardDescription>Per-flat average kWh this month</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            {!blocks ? (
              <div className="h-full w-full skeleton-box rounded-xl" />
            ) : blockComparisonData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">No block telemetry available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockComparisonData} layout="vertical" margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid vertical horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip />
                  <Bar dataKey="kwh" fill="#0d9488" radius={[0, 4, 4, 0]} maxBarSize={16}>
                    {blockComparisonData.map((_, index) => {
                      const colors = ["#475569", "#dc2626", "#0d9488", "#64748b"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
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
          <CardContent className="flex flex-col gap-3.5">
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

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Onboarding & meters</CardTitle>
              <CardDescription>Society device rollout status</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 justify-center">
            <ProgressStat
              label="Total flats"
              value={totalFlats > 0 ? `${totalFlats}/${totalFlats} (100%)` : "—"}
              pct={100}
              color="#0d9488"
            />
            <ProgressStat
              label="Meters live"
              value={totalFlats > 0 ? `${devicesOnline}/${totalFlats} (${Math.round((devicesOnline / totalFlats) * 100)}%)` : "—"}
              pct={totalFlats > 0 ? Math.round((devicesOnline / totalFlats) * 100) : 0}
              color="#0d9488"
            />
            <ProgressStat
              label="Residents registered"
              value={totalFlats > 0 ? `${registeredResidents}/${totalFlats} (${Math.round((registeredResidents / totalFlats) * 100)}%)` : "—"}
              pct={totalFlats > 0 ? Math.round((registeredResidents / totalFlats) * 100) : 0}
              color="#0d9488"
            />
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Top Consuming Flats Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top consuming flats</CardTitle>
            <CardDescription>Click any block or row to drill into blocks and floors</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {(blocks ?? []).map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBlock(String(b.id), b.name)}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3 hover:border-teal-500 hover:bg-teal-50/20 text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-sm block">{b.name}</span>
                  <span className="text-xs text-slate-400">{b.flatCount} flats</span>
                </div>
                <ChevronRight size={15} className="text-slate-400" />
              </button>
            ))}
          </div>

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
                sortedFlats.map((f) => {
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
        </CardContent>
      </Card>
    </div>
  );
}
