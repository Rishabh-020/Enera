import { useEffect, useState } from "react";
import * as api from "../lib/api";
import { MonthlyBarChart } from "./chart/MonthlyBarChart";
import { TrendLineChart } from "./chart/TrendLineChart";
import { HourlyProfileChart } from "./chart/HourlyProfileChart";
import { StatCard } from "./chart/StatCard";
import { Zap, BarChart3, TrendingUp, Cpu } from "lucide-react";
import { formatCost, timeAgo } from "../lib/utils";
import type { FlatHourlyProfile, FlatLive, FlatSummary, FlatTrend, FlatDetail } from "../lib/types";
import { useWebSocketReading } from "../context/WebSocketContext";

export function FlatDashboardView({ flatId }: { flatId: string }) {
  const { latestReading, isConnected } = useWebSocketReading();
  const [live, setLive] = useState<FlatLive | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [summary, setSummary] = useState<FlatSummary | null>(null);
  const [trend, setTrend] = useState<FlatTrend | null>(null);
  const [hourly, setHourly] = useState<FlatHourlyProfile | null>(null);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [flatDetails, setFlatDetails] = useState<FlatDetail | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("SATURDAY");

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
    setHourlyLoading(true);

    async function load() {
      const [liveData, summaryData, trendData, detail, hourlyData] = await Promise.all([
        api.getFlatLive(flatId).catch(() => null),
        api.getFlatSummary(flatId).catch(() => null),
        api.getFlatTrend(flatId).catch(() => null),
        api.getFlatDetail(flatId).catch(() => null),
        api.getFlatHourlyProfile(flatId).catch(() => null),
      ]);
      if (cancelled) return;
      setLive(liveData);
      setLiveLoading(false);
      setSummary(summaryData);
      setTrend(trendData);
      setFlatDetails(detail);
      setHourly(hourlyData);
      setHourlyLoading(false);

      if (summaryData?.peakDay) {
        setSelectedDay(summaryData.peakDay.toUpperCase());
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, [flatId]);

  const greeting = getGreeting();
  const kw = live?.kw ?? 0;
  const firstName = flatDetails?.residentName ? flatDetails.residentName.split(" ")[0] : "there";

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Responsive Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-grid-900">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Flat {flatDetails?.flatNumber || "—"} · Block {flatDetails?.blockName || "—"} {flatDetails?.bhkType ? `· ${flatDetails.bhkType}` : ""} {flatDetails?.floorNumber !== undefined ? `· Floor ${flatDetails.floorNumber}` : ""}
          </p>
        </div>
        {isConnected && (
          <span className="inline-flex self-start sm:self-auto items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Stream
          </span>
        )}
      </div>

      {/* Row 1: 4 real stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Right now in your flat"
          value={liveLoading ? "—" : `${(Number(kw) || 0).toFixed(2)} kW`}
          sub={
            live
              ? `${(live.pctVsUsual ?? 0) < 0 ? "↓" : "↑"} ${Math.abs(live.pctVsUsual ?? 0)}% vs usual · ${(live.level || "normal").charAt(0).toUpperCase() + (live.level || "normal").slice(1)}`
              : ""
          }
          icon={<Zap size={16} />}
          loading={liveLoading}
          accent={live?.level === "normal"}
        />
        <StatCard
          label="This month so far"
          value={summary ? `${(Number(summary.totalKwh) || 0).toFixed(1)} kWh` : "—"}
          sub={summary ? `${formatCost(Number(summary.estCost) || Number(summary.totalKwh) * 8)} incurred` : ""}
          icon={<BarChart3 size={16} />}
          loading={!summary}
        />
        <StatCard
          label="Projected month-end"
          value={summary ? `${(Number(summary.projectedTotal) || 0).toFixed(1)} kWh` : "—"}
          sub={summary ? `${formatCost(Number(summary.projectedCost) || Number(summary.projectedTotal) * 8)} estimated` : ""}
          icon={<TrendingUp size={16} />}
          loading={!summary}
        />
        <StatCard
          label="Smart meter status"
          value={liveLoading ? "—" : (live?.status || live?.online ? "Online" : "Standby")}
          sub={live?.lastReadingAt ? `Synced ${timeAgo(live.lastReadingAt)}` : "Telemetry stream"}
          icon={<Cpu size={16} />}
          loading={liveLoading}
          accent={Boolean(live?.status || live?.online)}
        />
      </div>

      {/* Row 2: Full-width Monthly Consumption Chart */}
      <div className="w-full">
        <MonthlyBarChart
          summary={summary}
          loading={!summary}
          selectedDayName={selectedDay}
          onSelectDay={(dayKey) => {
            setSelectedDay(dayKey);
          }}
        />
      </div>

      {/* Row 3: Monthly Trend + Today's 24-Hour Profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendLineChart
          trend={trend}
          loading={!trend && !summary}
          summarySeries={summary?.series}
        />
        <HourlyProfileChart
          data={hourly}
          loading={hourlyLoading}
        />
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
