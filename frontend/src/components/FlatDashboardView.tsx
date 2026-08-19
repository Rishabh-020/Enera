import { useEffect, useState } from "react";
import * as api from "../lib/api";
import { MonthlyBarChart } from "./chart/MonthlyBarChart";
import { TrendLineChart } from "./chart/TrendLineChart";
import { HourlyProfileChart } from "./chart/HourlyProfileChart";
import { DonutChart } from "./chart/DonutChart";
import { PeerComparisonBar } from "./chart/PeerComparisonBar";
import { PersonalisedInsights } from "./chart/PersonalisedInsights";
import { StatCard } from "./chart/StatCard";
import { Zap, BarChart3, TrendingUp, Award } from "lucide-react";
import { formatCost } from "../lib/utils";
import type { FlatHourlyProfile, FlatLive, FlatSummary, FlatTrend, FlatDetail } from "../lib/types";
import { useWebSocketReading } from "../context/WebSocketContext";

export function FlatDashboardView({ flatId }: { flatId: string }) {
  const { latestReading, isConnected } = useWebSocketReading();
  const [live, setLive] = useState<FlatLive | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [summary, setSummary] = useState<FlatSummary | null>(null);
  const [trend, setTrend] = useState<FlatTrend | null>(null);
  const [hourly, setHourly] = useState<FlatHourlyProfile | null>(null);
  const [flatDetails, setFlatDetails] = useState<FlatDetail | null>(null);

  // Handle live WebSocket telemetry updates
  useEffect(() => {
    if (!latestReading) return;

    const isExactFlatMatch = latestReading.flatId != null && String(latestReading.flatId) === String(flatId);
    const isDemoFlatMatch = (latestReading.isDemo || !latestReading.flatId) && latestReading.deviceType === "FLAT_METER";

    if (isExactFlatMatch || isDemoFlatMatch) {
      setLive((prev) => ({
        online: true,
        kw: latestReading.kw,
        lastReadingAt: new Date(latestReading.timestamp),
        level: latestReading.kw > 3.5 ? "high" :
          latestReading.kw > 2.0 ? "amber" : "normal",
        pctVsUsual: prev?.pctVsUsual ?? 0,
      }));
    }
  }, [latestReading, flatId]);

  useEffect(() => {
    let cancelled = false;
    setLiveLoading(true);

    async function load() {
      const [liveData, summaryData, trendData, hourlyProfile, detail] = await Promise.all([
        api.getFlatLive(flatId),
        api.getFlatSummary(flatId),
        api.getFlatTrend(flatId),
        api.getFlatHourlyProfile(flatId),
        api.getFlatDetail(flatId)
      ]);
      if (cancelled) return;
      setLive(liveData);
      setLiveLoading(false);
      setSummary(summaryData);
      setTrend(trendData);
      setHourly(hourlyProfile);
      setFlatDetails(detail);
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [flatId]);

  const greeting = getGreeting();
  const kw = live?.kw ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-grid-900">
          {greeting}, {flatDetails?.residentName?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-slate-500">
          Flat {flatDetails?.flatNumber} · {flatDetails?.blockName}
        </p>
      </div>
      {
        isConnected && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Demo Stream
          </span>
        )
      }

      {/* Row 1: 4 stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Right now in your flat"
          value={liveLoading ? "—" : `${kw.toFixed(1)} kW`}
          icon={<Zap size={16} />}
          loading={liveLoading}
          accent
        />
        <StatCard
          label="This month so far"
          value={summary ? `${summary.totalKwh} kWh` : "—"}
          sub={live ? `↑ ${Math.abs(live.pctVsUsual ?? 0)}% vs daily avg · ${(live.pctVsUsual ?? 0) > 10 ? "Slightly above usual" : "Normal"}` : ""}
          icon={<BarChart3 size={16} />}
          loading={!summary}
        />
        <StatCard
          label="Projected month-end"
          value={summary ? `${summary.projectedTotal} kWh` : "—"}
          sub={summary ? `${formatCost(summary.projectedTotal)} estimated` : ""}
          icon={<TrendingUp size={16} />}
          loading={!summary}
        />
        <StatCard
          label="How you compare"
          value="Top 20%"
          sub="More efficient than 80% of similar flats"
          icon={<Award size={16} />}
          loading={!summary}
        />
      </div>

      {/* Row 2: Monthly bar chart + Donut chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyBarChart summary={summary} loading={!summary} />
        </div>
        <div className="lg:col-span-1">
          <DonutChart loading={!summary} />
        </div>
      </div>

      {/* Row 3: Trend + Hourly profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendLineChart trend={trend} loading={!trend} />
        <HourlyProfileChart data={hourly} loading={!hourly} />
      </div>

      {/* Row 4: Peer comparison + Personalised insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PeerComparisonBar
          peerMin={280}
          peerMax={620}
          userValue={summary?.totalKwh ?? 384}
          bhkType={flatDetails?.bhkType ?? "2BHK"}
          loading={!summary}
        />
        <PersonalisedInsights loading={!summary} />
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
