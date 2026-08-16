import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import type { HourlyDataPoint } from "../../lib/types";

export type { HourlyDataPoint };

interface TimeOfDayChartProps {
  data?: HourlyDataPoint[];
  loading?: boolean;
  filterName?: string;
  title?: string;
  description?: string;
}

const BARS = [
  { key: "base", label: "Base Load", color: "#0d9488", radius: [0, 0, 0, 0] as [number, number, number, number] },
  { key: "society", label: "Society Units", color: "#dc2626", radius: [0, 0, 0, 0] as [number, number, number, number] },
  { key: "common", label: "Common Amenities", color: "#f59e0b", radius: [0, 0, 0, 0] as [number, number, number, number] },
  { key: "peak", label: "Peak Demand", color: "#7c3aed", radius: [4, 4, 0, 0] as [number, number, number, number] },
];

export function TimeOfDayChart({
  data,
  loading = false,
  filterName = "Whole society",
  title = "How power is used through the day",
  description = "Average kWh by hour · 24h Breakdown",
}: TimeOfDayChartProps) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description} {filterName ? `· ${filterName}` : ""}</CardDescription>
        </div>
      </CardHeader>
      <div className="h-80 px-3 pb-4 pt-2">
        {loading ? (
          <div className="h-full w-full skeleton-box rounded-xl" />
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            No hourly telemetry recorded for this filter
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={280}>
            <BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `${v} kWh`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e5eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                formatter={(v: any, name: string) => [`${v} kWh`, name]}
                cursor={{ fill: "rgba(148,163,184,0.08)" }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {BARS.map((b) => (
                <Bar key={b.key} dataKey={b.key} stackId="a" name={b.label} fill={b.color} radius={b.radius} maxBarSize={18} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
