import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "../ui/primitives";
import { Zap, TrendingUp, Clock } from "lucide-react";
import type { HourlyDataPoint } from "../../lib/types";

export type { HourlyDataPoint };

interface TimeOfDayChartProps {
  data?: HourlyDataPoint[];
  loading?: boolean;
  filterName?: string;
  title?: string;
  description?: string;
}

// Classic color palette (Teal -> Crimson -> Amber -> Purple)
const BARS = [
  { key: "base", label: "Base Load", color: "#0d9488" },
  { key: "society", label: "Society Units", color: "#dc2626" },
  { key: "common", label: "Common Amenities", color: "#f59e0b" },
  { key: "peak", label: "Peak Demand", color: "#7c3aed" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);

  return (
    <div className="rounded-xl border border-[var(--color-sage-mist,#afc4bf)] bg-white/95 backdrop-blur-md p-3.5 shadow-md min-w-[200px] text-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Clock size={13} className="text-slate-400" />
          {label}
        </span>
        <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full font-mono text-[11px]">
          {total.toFixed(1)} kW
        </span>
      </div>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-700">{entry.name}</span>
            </div>
            <span className="font-mono font-medium text-slate-900">{Number(entry.value).toFixed(1)} kW</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeOfDayChart({
  data,
  loading = false,
  filterName = "Whole society",
  title = "How power is used through the day",
  description = "24-Hour consumption breakdown",
}: TimeOfDayChartProps) {
  const hasData = data && data.length > 0;

  // Calculate summary metrics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { totalKwh: 0, peakHour: "--:--", peakKw: 0, avgKw: 0 };
    let total = 0;
    let maxKw = 0;
    let peakH = "00:00";

    data.forEach((d) => {
      const sum = (d.base || 0) + (d.society || 0) + (d.common || 0) + (d.peak || 0);
      total += sum;
      if (sum > maxKw) {
        maxKw = sum;
        peakH = d.hour || "00:00";
      }
    });

    return {
      totalKwh: Math.round(total * 10) / 10,
      peakHour: peakH,
      peakKw: Math.round(maxKw * 10) / 10,
      avgKw: Math.round((total / data.length) * 10) / 10,
    };
  }, [data]);

  return (
    <Card className="border border-[var(--color-sage-mist,#afc4bf)] bg-white overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            {description} {filterName ? `· ${filterName}` : ""}
          </CardDescription>
        </div>

        {hasData && !loading && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-cream-paper,#f3f1ec)] border border-[var(--color-sage-mist,#afc4bf)] text-xs text-slate-700">
              <Zap size={13} className="text-amber-500" />
              <span>Total:</span>
              <span className="font-bold text-slate-900 font-mono">{stats.totalKwh.toLocaleString()} kWh</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-cream-paper,#f3f1ec)] border border-[var(--color-sage-mist,#afc4bf)] text-xs text-slate-700">
              <TrendingUp size={13} className="text-purple-600" />
              <span>Peak:</span>
              <span className="font-bold text-slate-900 font-mono">{stats.peakHour} ({stats.peakKw} kW)</span>
            </div>
          </div>
        )}
      </CardHeader>

      <div className="h-80 px-4 pb-4 pt-3">
        {loading ? (
          <div className="h-full w-full bg-slate-100/70 rounded-xl animate-pulse" />
        ) : !hasData ? (
          <div className="flex h-full flex-col items-center justify-center text-xs text-slate-400 gap-1">
            <Clock size={24} className="text-slate-300 mb-1" />
            <span>No hourly telemetry recorded for this filter</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="#afc4bf" strokeOpacity={0.25} strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#535e5d" }}
                axisLine={{ stroke: "#afc4bf", strokeOpacity: 0.4 }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#535e5d" }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => `${v} kW`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16, 67, 54, 0.04)" }} />
              <Bar dataKey="base" stackId="a" name="Base Load" fill="#0d9488" maxBarSize={24} />
              <Bar dataKey="society" stackId="a" name="Society Units" fill="#dc2626" maxBarSize={24} />
              <Bar dataKey="common" stackId="a" name="Common Amenities" fill="#f59e0b" maxBarSize={24} />
              <Bar dataKey="peak" stackId="a" name="Peak Demand" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Clean Arcadia Legend Bar */}
      {hasData && !loading && (
        <div className="flex items-center justify-center gap-6 py-2.5 border-t border-slate-100 bg-[var(--color-cream-paper,#f3f1ec)]/50 text-xs text-slate-600 flex-wrap px-4">
          {BARS.map((b) => (
            <div key={b.key} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm shadow-xs" style={{ backgroundColor: b.color }} />
              <span className="font-medium text-slate-700">{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
