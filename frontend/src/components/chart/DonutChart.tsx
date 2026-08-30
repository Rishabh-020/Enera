import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { Activity } from "lucide-react";
import { cn } from "../../lib/utils";

interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

const PALETTE = [
  "#0d9488", // Teal
  "#0284c7", // Sky/Electric Blue
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

export function DonutChart({
  title = "Load distribution",
  description = "By common area facility",
  segments = [],
  loading = false,
}: {
  title?: string;
  description?: string;
  segments?: DonutSegment[];
  loading?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);

  if (loading) return <Card className="h-full min-h-[380px] animate-pulse bg-slate-50" />;

  const rawData = segments ?? [];
  const total = rawData.reduce((s, d) => s + (d.value || 0), 0);

  // Assign distinct curated palette colors
  const data = rawData.map((seg, idx) => ({
    ...seg,
    color: seg.color || PALETTE[idx % PALETTE.length],
  }));

  const activeItem = active !== null ? data[active] : null;

  if (data.length === 0) {
    return (
      <Card className="h-full flex flex-col justify-between">
        <CardHeader>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <div className="flex flex-1 min-h-[260px] flex-col items-center justify-center text-xs text-slate-400 gap-2">
          <Activity size={24} className="text-slate-300 animate-pulse" />
          <span>No active common area load recorded</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-slate-200/80 bg-white overflow-hidden flex flex-col justify-between">
      <CardHeader className="pb-2.5 pt-4 px-4 sm:px-5 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900">{title}</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">{description}</CardDescription>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
            {data.length} Facilities
          </span>
        </div>
      </CardHeader>

      <div className="flex flex-col items-center px-4 pb-3 pt-1 flex-1 min-h-0 justify-between">
        {/* Donut graphic with rich center badge */}
        <div className="h-40 w-full max-w-[190px] relative flex items-center justify-center my-0.5 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={66}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
                cornerRadius={4}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                {data.map((s, i) => (
                  <Cell
                    key={i}
                    fill={s.color}
                    opacity={active !== null && active !== i ? 0.35 : 1}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      filter: active === i ? "drop-shadow(0 4px 12px rgba(0,0,0,0.22))" : "none",
                      transform: active === i ? "scale(1.04)" : "scale(1)",
                      transformOrigin: "center center",
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Interactive center status hub */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            {activeItem ? (
              <div className="animate-fade-in flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 max-w-[90px] truncate">
                  {activeItem.name}
                </span>
                <span className="font-mono-data text-base font-bold text-slate-900 leading-tight">
                  {activeItem.value.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">kW</span>
                </span>
                <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1 py-0.2 rounded mt-0.5">
                  {total > 0 ? ((activeItem.value / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Load</span>
                <span className="font-mono-data text-base font-bold text-slate-900 leading-tight">
                  {total.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">kW</span>
                </span>
                <span className="text-[9px] font-medium text-slate-400 mt-0.5">100% Monitored</span>
              </div>
            )}
          </div>
        </div>

        {/* Facility breakdown items list with overflow controller */}
        <div className="w-full max-h-[145px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar mt-1">
          {data.map((s, i) => {
            const isHovered = active === i;
            const pct = total > 0 ? Math.round(((s.value || 0) / total) * 100) : 0;
            return (
              <div
                key={s.name}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-all duration-150 cursor-pointer border",
                  isHovered
                    ? "bg-slate-100 border-slate-300/80 shadow-xs"
                    : "bg-slate-50/70 border-slate-200/60 hover:bg-slate-100/70 hover:border-slate-300"
                )}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0 transition-transform duration-150"
                    style={{
                      backgroundColor: s.color,
                      transform: isHovered ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-medium text-slate-700 truncate group-hover:text-slate-900 block">
                      {s.name}
                    </span>
                    {/* Mini progress fill track */}
                    <div className="h-1 w-full bg-slate-200/80 rounded-full mt-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(4, pct))}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1 text-right">
                  <span className="font-mono-data text-[11px] font-semibold text-slate-800">
                    {s.value.toFixed(1)} kW
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 bg-white border border-slate-200 rounded px-1 py-0.2">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
