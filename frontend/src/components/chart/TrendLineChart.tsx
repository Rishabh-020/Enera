import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { formatDate } from "../../lib/utils";
import type { FlatTrend } from "../../lib/types";

interface TrendLineChartProps {
  trend?: FlatTrend | null;
  loading?: boolean;
  summarySeries?: Array<{ day?: string | number; kwh?: number }> | null;
}

export function TrendLineChart({
  trend = null,
  loading = false,
  summarySeries = null,
}: TrendLineChartProps) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute monthly trend points from Day 1 to current date
  const { data, pctChange, isUp, maxKwh, currentDateLabel } = useMemo(() => {
    const now = new Date();
    const currentDay = now.getDate(); // e.g. 24
    const year = 2026;

    // 1. If API returned trend points with data
    if (trend && Array.isArray(trend.points) && trend.points.length > 0) {
      let maxK = 0;
      let total = 0;
      const pts = trend.points.map((p) => {
        const k = Math.round((Number(p.kwh) || 0) * 100) / 100;
        total += k;
        if (k > maxK) maxK = k;
        const dObj = new Date(p.date);
        const dayNum = !isNaN(dObj.getTime()) ? dObj.getDate() : 1;
        const dayStr = String(dayNum).padStart(2, "0");
        return {
          day: dayNum,
          label: `${dayStr} Aug`,
          shortLabel: `${dayStr}`,
          fullDate: formatDate(p.date) || String(p.date),
          kwh: k,
          rollingAvg: Math.round((Number(p.rollingAvg) || 0) * 100) / 100,
        };
      });
      return {
        data: pts,
        pctChange: Math.round(Number(trend.pctChange) || 0),
        isUp: (Number(trend.pctChange) || 0) >= 0,
        maxKwh: maxK,
        totalKwh: Math.round(total * 100) / 100,
        currentDateLabel: `${String(currentDay).padStart(2, "0")} Aug`,
      };
    }

    // 2. If summarySeries is provided
    if (Array.isArray(summarySeries) && summarySeries.length > 0) {
      const dayTotals: Record<string, number> = {
        FRIDAY: 0,
        SATURDAY: 0,
        SUNDAY: 0,
      };

      summarySeries.forEach((s) => {
        const k = String(s.day || "").toUpperCase();
        const val = Number(s.kwh) || 0;
        if (dayTotals[k] !== undefined) {
          dayTotals[k] += val;
        }
      });

      const pts = [];
      let runningSum = 0;
      let maxK = 0;
      let total = 0;

      for (let day = 1; day <= currentDay; day++) {
        let kwh = 0;
        if (day === 7) {
          kwh = Math.round(dayTotals["FRIDAY"] * 100) / 100;
        } else if (day === 8) {
          kwh = Math.round(dayTotals["SATURDAY"] * 100) / 100;
        } else if (day === 9) {
          kwh = Math.round(dayTotals["SUNDAY"] * 100) / 100;
        }

        total += kwh;
        if (kwh > maxK) maxK = kwh;

        runningSum += kwh;
        const rollingAvg = Math.round((runningSum / day) * 100) / 100;

        const dayStr = String(day).padStart(2, "0");
        pts.push({
          day,
          label: `${dayStr} Aug`,
          shortLabel: `${dayStr}`,
          fullDate: `${dayStr} Aug ${year}`,
          kwh,
          rollingAvg,
        });
      }

      const recordedDays = pts.filter((p) => p.kwh > 0);
      const firstVal = recordedDays[0]?.kwh || 1;
      const lastVal = recordedDays[recordedDays.length - 1]?.kwh || 1;
      const pct = Math.round(((lastVal - firstVal) / firstVal) * 100);

      return {
        data: pts,
        pctChange: pct,
        isUp: pct >= 0,
        maxKwh: maxK,
        totalKwh: Math.round(total * 100) / 100,
        currentDateLabel: `${String(currentDay).padStart(2, "0")} Aug`,
      };
    }

    // 3. Default empty state
    return {
      data: [],
      pctChange: 0,
      isUp: false,
      maxKwh: 0,
      totalKwh: 0,
      currentDateLabel: `${String(currentDay).padStart(2, "0")} Aug`,
    };
  }, [trend, summarySeries]);

  if (loading) {
    return <Card className="h-72 border border-slate-200/90 bg-white animate-pulse" />;
  }

  const hasData = data.length > 0;

  return (
    <Card className="border border-slate-200/90 bg-white shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 tracking-tight">Monthly Consumption Trend</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Day 1 to current date (01 Aug – {currentDateLabel})
          </CardDescription>
        </div>
        {hasData && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold shrink-0">
            {isUp ? (
              <span className="flex items-center gap-1 text-rose-600">
                <TrendingUp size={13} /> +{Math.abs(pctChange)}% variance
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600">
                <TrendingDown size={13} /> -{Math.abs(pctChange)}% variance
              </span>
            )}
          </div>
        )}
      </CardHeader>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 px-2 sm:px-4 pb-3 pt-3">
        {!hasData ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400 gap-1.5 text-center px-4">
            <Activity size={22} className="text-slate-300 mb-0.5" />
            <span className="font-medium text-slate-600">No monthly trend readings recorded yet</span>
            <span className="text-[11px] text-slate-400">Readings will appear as daily telemetry is logged</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 2 }}>
              <defs>
                <linearGradient id="monthlyTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" strokeOpacity={0.6} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: isMobile ? 8 : 10, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1", strokeOpacity: 0.5 }}
                tickLine={false}
                interval={isMobile ? 3 : 2}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 9 : 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 26 : 30}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(8px)",
                }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ""}
                formatter={(v: any, name: any) => [
                  `${Number(v).toFixed(2)} kWh`,
                  name === "kwh" ? "Daily Consumption" : "Rolling Average"
                ]}
              />
              <Area
                type="monotone"
                dataKey="kwh"
                name="kwh"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#monthlyTrendGrad)"
                dot={false}
                activeDot={{ r: 6, fill: "#8b5cf6" }}
              />
              <Line
                type="monotone"
                dataKey="rollingAvg"
                name="rollingAvg"
                stroke="#0d9488"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Footer */}
      {hasData && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Daily Total
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" /> Rolling Average
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
            <span>Peak:</span>
            <span className="font-mono font-semibold text-slate-800">{maxKwh.toFixed(1)} kWh</span>
          </div>
        </div>
      )}
    </Card>
  );
}
