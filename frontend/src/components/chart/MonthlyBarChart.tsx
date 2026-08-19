import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { formatCost } from "../../lib/utils";
import type { DaySeriesPoint, FlatSummary } from "../../lib/types";

interface MonthlyBarChartProps {
  summary: FlatSummary | null;
  loading: boolean;
}

// Multi-color palette matching VoltWise: teal base, amber mid, red high
function barColor(kwh: number, max: number, isWeekend: boolean, isSelected: boolean): string {
  if (isSelected) return "#0d9488";
  if (isWeekend) return "#c9d0dd";
  const ratio = kwh / max;
  if (ratio > 0.85) return "#dc2626";
  if (ratio > 0.6) return "#7c3aed";
  if (ratio > 0.35) return "#f59e0b";
  return "#0d9488";
}

export function MonthlyBarChart({ summary, loading }: MonthlyBarChartProps) {
  const [selected, setSelected] = useState<DaySeriesPoint | null>(null);

  if (loading || !summary) {
    return (
      <Card className="h-96 animate-pulse bg-slate-50">
        <div className="h-full" />
      </Card>
    );
  }

  const data = summary.series.map((d) => ({ ...d, label: d.day }));
  const maxKwh = Math.max(...data.map((d) => d.kwh));
  const active = selected ?? data[data.length - 1];

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>This month so far</CardTitle>
          <CardDescription>Day-by-day consumption · {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</CardDescription>
        </div>
        <div className="text-right">
          <p className="font-mono-data text-lg font-bold text-grid-900">{summary.totalKwh} kWh</p>
          <p className="text-xs text-slate-500">{formatCost(summary.totalKwh)} so far</p>
        </div>
      </CardHeader>
      <div className="grid grid-cols-1 gap-4 px-5 pb-2 sm:grid-cols-3">
        <MiniStat label="Projected month total" value={`${summary.projectedTotal} kWh`} sub={formatCost(summary.projectedTotal)} />
        <MiniStat label="Peak day" value={`Day ${summary.peakDay.day}`} sub={`${summary.peakDay.kwh} kWh`} />
        <MiniStat
          label="Selected"
          value={active ? `Day ${active.day}` : "—"}
          sub={active ? `${active.kwh} kWh · ${formatCost(active.kwh)}` : ""}
        />
      </div>
      <div className="h-64 px-2 pb-5 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            onClick={(e: any) => e?.activePayload && setSelected(e.activePayload[0].payload)}
            margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              formatter={(v: any) => [`${v} kWh`, "Usage"]}
              labelFormatter={(l: any) => `Day ${l}`}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e5eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
            />
            <Bar dataKey="kwh" radius={[5, 5, 0, 0]} maxBarSize={22}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={barColor(d.kwh, maxKwh, d.isWeekend, selected?.day === d.day)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-display text-sm font-semibold text-grid-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
