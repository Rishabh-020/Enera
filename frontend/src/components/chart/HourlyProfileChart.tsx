import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "../ui/primitives";
import type { FlatHourlyProfile } from "../../lib/types";

function levelColor(kwh: number, max: number): string {
  const ratio = kwh / max;
  if (ratio > 0.7) return "#dc2626"; // coral/high
  if (ratio > 0.4) return "#f5a623"; // amber
  return "#0d9488"; // teal/low
}

interface HourlyProfileChartProps {
  data: FlatHourlyProfile | null;
  loading: boolean;
}

export function HourlyProfileChart({ data, loading }: HourlyProfileChartProps) {
  if (loading || !data) {
    return <Card className="h-64 animate-pulse bg-slate-50" />;
  }

  const max = Math.max(...data.profile.map((d) => d.kwh));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Time-of-day profile</CardTitle>
          <CardDescription>Average kWh per hour, last 30 days</CardDescription>
        </div>
        <div className="flex gap-1">
          {data.peakHours.map((h) => (
            <Badge key={h} variant="high">
              {h}:00
            </Badge>
          ))}
        </div>
      </CardHeader>
      <div className="h-52 px-2 pb-5 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.profile} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} tickFormatter={(h) => `${h}h`} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={34} />
            <Tooltip
              formatter={(v: any) => [`${v} kWh`, "Avg"]}
              labelFormatter={(h: any) => `${h}:00 - ${(h + 1) % 24}:00`}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e5eb", fontSize: 12 }}
            />
            <Bar dataKey="kwh" radius={[4, 4, 0, 0]} maxBarSize={14}>
              {data.profile.map((d, i) => (
                <Cell key={i} fill={levelColor(d.kwh, max)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
