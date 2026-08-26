import { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "../ui/primitives";
import { Zap, TrendingUp, AlertCircle } from "lucide-react";
import type { FlatHourlyProfile } from "../../lib/types";

function levelColor(kwh: number, max: number): string {
  if (max <= 0) return "#0d9488";
  const ratio = kwh / max;
  if (ratio > 0.8) return "#ef4444"; // red - peak
  if (ratio > 0.6) return "#8b5cf6"; // purple - elevated
  if (ratio > 0.35) return "#f59e0b"; // amber - mid
  return "#0d9488"; // teal - base / normal
}

interface HourlyProfileChartProps {
  data: FlatHourlyProfile | null;
  loading: boolean;
  title?: string;
}

export function HourlyProfileChart({
  data,
  loading,
  title = "Today's 24-Hour Consumption",
}: HourlyProfileChartProps) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }, []);

  // Compute stats for today
  const { profileData, stats, maxKwh, peakHours } = useMemo(() => {
    if (!data || !data.profile || data.profile.length === 0) {
      return {
        profileData: [],
        stats: { totalKwh: 0, peakHour: "--:--", peakKwh: 0 },
        maxKwh: 0,
        peakHours: [],
      };
    }

    let total = 0;
    let maxK = 0;
    let peakH = 0;

    data.profile.forEach((d) => {
      const val = Number(d.kwh) || 0;
      total += val;
      if (val > maxK) {
        maxK = val;
        peakH = d.hour;
      }
    });

    return {
      profileData: data.profile,
      stats: {
        totalKwh: Math.round(total * 100) / 100,
        peakHour: `${String(peakH).padStart(2, "0")}:00`,
        peakKwh: Math.round(maxK * 100) / 100,
      },
      maxKwh: maxK,
      peakHours: data.peakHours || (maxK > 0 ? [peakH] : []),
    };
  }, [data]);

  const hasData = profileData.length > 0;

  return (
    <Card className="border border-slate-200/90 bg-white shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
      {/* Clean Header: Today's Consumption */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 tracking-tight">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            {todayFormatted} · Live hourly telemetry
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasData && !loading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs font-semibold text-amber-900">
              <Zap size={13} className="text-amber-500 shrink-0" />
              <span className="font-mono">{stats.totalKwh.toFixed(1)} kWh</span>
            </div>
          )}

          {hasData && !loading && stats.peakKwh > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50/80 border border-purple-200/60 text-xs font-semibold text-purple-900">
              <TrendingUp size={13} className="text-purple-600 shrink-0" />
              <span>Peak {stats.peakHour}</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Chart Canvas */}
      <div className="h-56 sm:h-64 px-2 sm:px-4 pb-3 pt-3">
        {loading ? (
          <div className="h-full w-full bg-slate-100/70 rounded-xl animate-pulse" />
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400 gap-1.5 text-center px-4">
            <AlertCircle size={22} className="text-slate-300 mb-0.5" />
            <span className="font-medium text-slate-600">No telemetry readings recorded today ({todayFormatted})</span>
            <span className="text-[11px] text-slate-400">Hourly bars will appear as meter data streams in</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={profileData} margin={{ top: 8, right: isMobile ? 4 : 12, left: isMobile ? -16 : -10, bottom: 2 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" strokeOpacity={0.6} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: isMobile ? 9 : 10, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1", strokeOpacity: 0.5 }}
                tickLine={false}
                interval={isMobile ? 3 : 2}
                tickFormatter={(h) => `${h}:00`}
              />
              <YAxis
                tick={{ fontSize: isMobile ? 9 : 10, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 26 : 30}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(13, 148, 136, 0.05)", radius: 6 }}
                formatter={(v: any) => [`${Number(v).toFixed(2)} kWh`, "Energy Draw"]}
                labelFormatter={(h: any) => `${String(h).padStart(2, "0")}:00 - ${String((Number(h) + 1) % 24).padStart(2, "0")}:00`}
                contentStyle={{
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  backgroundColor: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(8px)",
                }}
              />
              <Bar dataKey="kwh" radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 14 : 18}>
                {profileData.map((d, i) => (
                  <Cell key={i} fill={levelColor(d.kwh, maxKwh)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend Footer */}
      {hasData && !loading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-600 gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" /> Low / Base
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Normal
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Elevated
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" /> Peak Draw
            </span>
          </div>

          {peakHours.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-slate-500 font-medium">Peak Hour:</span>
              {peakHours.slice(0, 3).map((h) => (
                <Badge key={h} variant="attention" className="text-[11px] py-0 px-2 font-bold">
                  {String(h).padStart(2, "0")}:00
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
