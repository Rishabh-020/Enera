import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, Badge } from "../ui/primitives";
import { Award, Zap, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import type { BuilderSocietyRow } from "../../lib/types";

interface BenchmarkChartProps {
  societies: (BuilderSocietyRow | any)[] | null;
  loading?: boolean;
}

export function BenchmarkChart({ societies, loading = false }: BenchmarkChartProps) {
  const [metric, setMetric] = useState<"avgPerFlat" | "mtdKwh">("avgPerFlat");

  const list = useMemo(() => {
    return (societies ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city || "Mumbai",
      totalFlats: s.totalFlats || 0,
      occupiedFlats: s.occupiedFlats || 0,
      mtdKwh: typeof s.mtdKwh === "number" ? s.mtdKwh : (s.total ?? 0),
      avgPerFlat: typeof s.avgPerFlat === "number" ? s.avgPerFlat : (s.totalFlats > 0 ? (s.mtdKwh || 0) / s.totalFlats : 0),
      mom: s.mom,
    }));
  }, [societies]);

  // Compute portfolio benchmarks
  const stats = useMemo(() => {
    if (!list.length) return { avgPerFlat: 0, totalKwh: 0, bestSociety: null, highestSociety: null };

    const validWithData = list.filter((s) => s.mtdKwh > 0 || s.avgPerFlat > 0);
    const totalKwh = list.reduce((sum, s) => sum + s.mtdKwh, 0);
    const totalFlats = list.reduce((sum, s) => sum + (s.occupiedFlats || s.totalFlats || 1), 0);
    const avgPerFlat = totalFlats > 0 ? totalKwh / totalFlats : 0;

    let bestSociety = null;
    let highestSociety = null;

    if (validWithData.length > 0) {
      const sortedByAvg = [...validWithData].sort((a, b) => a.avgPerFlat - b.avgPerFlat);
      bestSociety = sortedByAvg[0];
      highestSociety = sortedByAvg[sortedByAvg.length - 1];
    }

    return {
      avgPerFlat: Number(avgPerFlat.toFixed(1)),
      totalKwh: Math.round(totalKwh),
      bestSociety,
      highestSociety,
    };
  }, [list]);

  if (loading || !societies) {
    return <Card className="h-96 animate-pulse bg-slate-50" />;
  }

  const chartData = list.map((s) => {
    const value = metric === "avgPerFlat" ? Number(s.avgPerFlat.toFixed(2)) : Math.round(s.mtdKwh);
    const benchmarkVal = metric === "avgPerFlat" ? stats.avgPerFlat : (list.length > 0 ? stats.totalKwh / list.length : 0);
    const isEfficient = s.mtdKwh > 0 && benchmarkVal > 0 ? value <= benchmarkVal : true;

    return {
      id: s.id,
      name: s.name.length > 16 ? s.name.slice(0, 15) + "…" : s.name,
      fullName: s.name,
      city: s.city,
      flats: `${s.occupiedFlats}/${s.totalFlats}`,
      value,
      mtdKwh: s.mtdKwh,
      avgPerFlat: s.avgPerFlat,
      isEfficient,
      isZero: s.mtdKwh === 0 && s.avgPerFlat === 0,
      diffPercent: benchmarkVal > 0 && value > 0 ? Number((((value - benchmarkVal) / benchmarkVal) * 100).toFixed(1)) : 0,
    };
  });

  const benchmarkRefLine = metric === "avgPerFlat" ? stats.avgPerFlat : (list.length > 0 ? Math.round(stats.totalKwh / list.length) : 0);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Portfolio Benchmarking</CardTitle>
            <Badge variant="teal" className="text-[11px] font-semibold py-0.5">
              {list.length} {list.length === 1 ? "Society" : "Societies"}
            </Badge>
          </div>
          <CardDescription className="mt-1">
            Comparative energy intensity against portfolio baseline
          </CardDescription>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center rounded-xl bg-slate-100/90 p-1 border border-slate-200/70 shrink-0">
          <button
            type="button"
            onClick={() => setMetric("avgPerFlat")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${metric === "avgPerFlat"
              ? "bg-white text-teal-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Avg / Flat (kWh)
          </button>
          <button
            type="button"
            onClick={() => setMetric("mtdKwh")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${metric === "mtdKwh"
              ? "bg-white text-teal-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            Total MTD (kWh)
          </button>
        </div>
      </CardHeader>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pt-4 pb-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100/70 text-teal-700">
            <Zap size={16} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Portfolio Avg</div>
            <div className="text-sm font-bold text-slate-900 font-mono-data">
              {metric === "avgPerFlat" ? `${stats.avgPerFlat} kWh/flat` : `${stats.totalKwh.toLocaleString()} kWh`}
            </div>
          </div>
        </div>

        {stats.bestSociety && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Award size={16} />
            </div>
            <div className="truncate">
              <div className="text-[11px] text-emerald-800 font-medium">Top Performer</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {stats.bestSociety.name}
              </div>
            </div>
          </div>
        )}

        {stats.highestSociety && stats.highestSociety.id !== stats.bestSociety?.id && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle size={16} />
            </div>
            <div className="truncate">
              <div className="text-[11px] text-rose-800 font-medium">Highest Demand</div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {stats.highestSociety.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-64 px-4 pb-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 6 }}>
            <defs>
              <linearGradient id="gradient-efficient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradient-attention" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#fb7185" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="gradient-zero" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              dy={6}
            />

            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              width={46}
              tickFormatter={(val: number) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`;
                return `${val}`;
              }}
            />

            {benchmarkRefLine > 0 && (
              <ReferenceLine
                y={benchmarkRefLine}
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Benchmark Avg (${benchmarkRefLine}${metric === "avgPerFlat" ? " kWh" : "k"})`,
                  fill: "#64748b",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-slate-200 bg-slate-900/95 p-3.5 text-white shadow-xl backdrop-blur-xs min-w-[200px]">
                    <div className="font-semibold text-xs text-slate-100 flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                      <span>{d.fullName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{d.city}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Flats:</span>
                        <span className="font-mono-data font-semibold text-white">{d.flats}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Avg / Flat:</span>
                        <span className="font-mono-data font-semibold text-teal-300">{d.avgPerFlat.toFixed(2)} kWh</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Total MTD:</span>
                        <span className="font-mono-data font-semibold text-white">{d.mtdKwh.toLocaleString()} kWh</span>
                      </div>
                    </div>

                    {d.value > 0 && benchmarkRefLine > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Vs Portfolio Avg:</span>
                        <span className={`font-semibold flex items-center gap-0.5 ${d.diffPercent <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {d.diffPercent <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                          {d.diffPercent > 0 ? `+${d.diffPercent}%` : `${d.diffPercent}%`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.isZero
                      ? "url(#gradient-zero)"
                      : entry.isEfficient
                        ? "url(#gradient-efficient)"
                        : "url(#gradient-attention)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="flex items-center justify-center gap-6 py-2.5 px-4 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-xs bg-teal-600 shadow-xs" />
          <span>Optimal / Below Avg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-xs bg-rose-500 shadow-xs" />
          <span>High Demand / Above Avg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-5 border-b-2 border-dashed border-slate-500" />
          <span>Portfolio Benchmark</span>
        </div>
      </div>
    </Card>
  );
}
