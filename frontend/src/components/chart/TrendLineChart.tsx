import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, TabPills } from "../ui/primitives";
import { formatDate } from "../../lib/utils";
import type { FlatTrend } from "../../lib/types";

interface TrendLineChartProps {
  trend: FlatTrend | null;
  loading: boolean;
}

export function TrendLineChart({ trend, loading }: TrendLineChartProps) {
  const [period, setPeriod] = useState("30d");

  if (loading || !trend) {
    return <Card className="h-72 animate-pulse bg-slate-50" />;
  }

  const data = trend.points.map((p) => ({ ...p, label: formatDate(p.date) }));
  const up = trend.pctChange >= 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Your 30-day trend</CardTitle>
          <CardDescription>Daily usage with 7-day rolling average</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-sm font-semibold ${up ? "text-high-500" : "text-live-500"}`}>
            {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend.pctChange)}%
          </div>
          <TabPills tabs={["30d", "90d"]} active={period} onChange={setPeriod} />
        </div>
      </CardHeader>
      <div className="h-64 px-2 pb-5 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={34} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e5eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="kwh" name="Daily kWh" stroke="#c9d0dd" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="rollingAvg" name="7-day avg" stroke="#0d9488" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
