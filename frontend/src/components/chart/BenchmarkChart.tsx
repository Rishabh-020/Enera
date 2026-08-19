import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";

interface BenchmarkSociety {
  name: string;
  efficient: number;
  total: number;
}

interface BenchmarkChartProps {
  societies: BenchmarkSociety[];
  loading?: boolean;
}

export function BenchmarkChart({ societies, loading = false }: BenchmarkChartProps) {
  if (loading || !societies.length) {
    return <Card className="h-72 animate-pulse bg-slate-50" />;
  }

  const data = societies.map((s) => ({
    name: s.name.length > 8 ? s.name.slice(0, 8) + "…" : s.name,
    fullName: s.name,
    efficient: s.efficient,
    excess: Math.max(0, s.total - s.efficient),
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Benchmarking</CardTitle>
          <CardDescription>Efficient vs excess consumption per society</CardDescription>
        </div>
      </CardHeader>
      <div className="h-56 px-3 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(val: number) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 100000) return `${(val / 100000).toFixed(1)}L`
                if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
                return `${val}`;
              }}
            />
            <Tooltip
              formatter={(v: any, name: string) => [
                `${typeof v === "number" ? v.toLocaleString() : v} kWh`,
                name === "efficient" ? "Efficient" : "Excess",
              ]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e2e5eb",
                fontSize: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value: string) => (value === "efficient" ? "Efficient" : "Excess")}
            />
            <Bar dataKey="efficient" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} maxBarSize={32} />
            <Bar dataKey="excess" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
