import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/primitives";

export interface HourlyDataPoint {
  hour: string;
  base: number;
  society: number;
  common: number;
  peak: number;
}

interface TimeOfDayChartProps {
  data?: HourlyDataPoint[];
  filterName?: string;
  title?: string;
  description?: string;
}

export function generateHourlyStackedData(filterName: string = "Whole society"): HourlyDataPoint[] {
  let seed = 0;
  for (let i = 0; i < filterName.length; i++) {
    seed = (seed * 31 + filterName.charCodeAt(i)) % 10000;
  }

  const isCommonArea = filterName.toLowerCase().includes("common");
  const isBlock = filterName.toLowerCase().includes("block");
  const blockIndex = filterName.toLowerCase().charCodeAt(filterName.length - 1) % 5;

  return Array.from({ length: 24 }, (_, h) => {
    const pseudo = Math.sin(h * 13.37 + seed) * 0.5 + 0.5;
    const pseudo2 = Math.cos(h * 7.77 + seed) * 0.5 + 0.5;

    let baseScale = 15;
    let societyScale = 10;
    let commonScale = 5;
    let peakScale = 20;

    if (filterName.includes("Whole") || filterName.includes("All")) {
      baseScale = 25;
      societyScale = 20;
      commonScale = 10;
      peakScale = 35;
    } else if (isCommonArea) {
      baseScale = 8;
      societyScale = 3;
      commonScale = 25 + pseudo * 10;
      peakScale = 12;
    } else if (isBlock) {
      baseScale = 12 + (blockIndex % 3) * 3;
      societyScale = 8 + (blockIndex % 2) * 4;
      commonScale = 3;
      peakScale = 15 + ((blockIndex * 7) % 15);
    } else {
      baseScale = 14 + (seed % 8);
      societyScale = 9 + (seed % 6);
      commonScale = 4 + (seed % 4);
      peakScale = 18 + (seed % 12);
    }

    const base = h >= 6 && h <= 22 
      ? baseScale + pseudo * 6 
      : (baseScale * 0.4) + pseudo * 3;

    const isMorningPeak = h >= 7 && h <= 10;
    const isEveningPeak = h >= 18 && h <= 22;
    const isMiddayPeak = h >= 12 && h <= 15;

    let peak = 3 + pseudo2 * 5;
    if (isMorningPeak) {
      peak = peakScale * (0.7 + pseudo * 0.5);
    } else if (isEveningPeak) {
      peak = (peakScale * 1.2) * (0.8 + pseudo * 0.4);
    } else if (isMiddayPeak && blockIndex % 2 === 1) {
      peak = (peakScale * 0.8) * (0.6 + pseudo * 0.4);
    }

    const society = isCommonArea 
      ? Math.round(societyScale + pseudo * 2) 
      : Math.round(base * (0.4 + (seed % 3) * 0.1) + pseudo2 * 4);

    const common = isCommonArea 
      ? Math.round(commonScale + (h >= 18 && h <= 23 ? 12 : 0)) 
      : Math.round(commonScale + (h >= 18 && h <= 22 ? 5 : 0) + pseudo * 3);

    return {
      hour: `${h}:00`,
      base: Math.max(1, Math.round(base)),
      society: Math.max(1, Math.round(society)),
      common: Math.max(1, Math.round(common)),
      peak: Math.max(1, Math.round(peak)),
    };
  });
}

const BARS = [
  { key: "base", label: "Base Load", color: "#0d9488", radius: [0, 0, 0, 0] as [number, number, number, number] },
  { key: "society", label: "Society Units", color: "#dc2626", radius: [0, 0, 0, 0] as [number, number, number, number] },
  { key: "common", label: "Common Amenities", color: "#f59e0b", radius: [0, 0, 0, 0] as [number, number, number, number] },
  { key: "peak", label: "Peak Demand", color: "#7c3aed", radius: [4, 4, 0, 0] as [number, number, number, number] },
];

export function TimeOfDayChart({
  data,
  filterName = "Whole society",
  title = "How power is used through the day",
  description = "Average kWh by hour · Last 4 weeks",
}: TimeOfDayChartProps) {
  const chartData = useMemo(() => {
    if (data && data.length > 0) return data;
    return generateHourlyStackedData(filterName);
  }, [data, filterName]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description} {filterName ? `· ${filterName}` : ""}</CardDescription>
        </div>
      </CardHeader>
      <div className="h-80 px-3 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={280}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v} kWh`} />
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
      </div>
    </Card>
  );
}
