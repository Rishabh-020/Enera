import { useEffect, useState } from "react";
import * as api from "../lib/api";
import { LiveMeterCard } from "./chart/LiveMeterCard";
import { MonthlyBarChart } from "./chart/MonthlyBarChart";
import { TrendLineChart } from "./chart/TrendLineChart";
import { HourlyProfileChart } from "./chart/HourlyProfileChart";
import type { FlatHourlyProfile, FlatLive, FlatSummary, FlatTrend, FlatDetail } from "../lib/types";

const POLL_MS = 24 * 60 * 60 * 1000; // per spec: poll every 24h in V0

export function FlatDashboardView({ flatId }: { flatId: string }) {
  const [live, setLive] = useState<FlatLive | null>(null);
  const [liveLoading, setLiveLoading] = useState(true);
  const [summary, setSummary] = useState<FlatSummary | null>(null);
  const [trend, setTrend] = useState<FlatTrend | null>(null);
  const [hourly, setHourly] = useState<FlatHourlyProfile | null>(null);
  const [flatDetails, setFlatDetails] = useState<FlatDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLiveLoading(true);
    setSummary(null);
    setTrend(null);
    setHourly(null);
    setFlatDetails(null);

    async function load() {
      const [live, summary, trend, hourlyProfile, detail] = await Promise.all([
        api.getFlatLive(flatId),
        api.getFlatSummary(flatId),
        api.getFlatTrend(flatId),
        api.getFlatHourlyProfile(flatId),
        api.getFlatDetail(flatId)
      ]);
      if (cancelled) return;
      setLive(live);
      setLiveLoading(false);
      setSummary(summary);
      setTrend(trend);
      setHourly(hourlyProfile);
      setFlatDetails(detail)
    }
    load();

    const interval = setInterval(async () => {
      const l = await api.getFlatLive(flatId);
      if (!cancelled) setLive(l);
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [flatId]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {flatDetails?.blockName} · Floor {flatDetails?.floorNumber}
        </p>
        <h1 className="font-display text-2xl font-bold text-grid-900">Flat {flatDetails?.flatNumber}</h1>
        <p className="text-sm text-slate-500">{flatDetails?.residentName ?? "Vacant unit"} · {flatDetails?.bhkType}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <LiveMeterCard data={live} loading={liveLoading} />
        </div>
        <div className="lg:col-span-2">
          <MonthlyBarChart summary={summary} loading={!summary} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TrendLineChart trend={trend} loading={!trend} />
        <HourlyProfileChart data={hourly} loading={!hourly} />
      </div>
    </div>
  );
}
