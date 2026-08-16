import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { cn } from "../../lib/utils";

interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

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

  if (loading) return <Card className="h-72 animate-pulse bg-slate-50" />;

  const data = segments ?? [];
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  const activeItem = active !== null ? data[active] : null;

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        <div className="flex h-64 items-center justify-center text-xs text-slate-400">
          No active common area load recorded
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <div className="flex flex-col items-center px-5 pb-5 pt-2">
        <div className="h-48 w-full max-w-[200px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
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
                      filter: active === i ? "drop-shadow(0 2px 8px rgba(0,0,0,0.18))" : "none",
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Clean HTML center badge (shows hovered slice or Total 100%) */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[90px]">
              {activeItem ? (activeItem.name.includes("(") ? activeItem.name.split("(")[0].trim() : activeItem.name.split(" ")[0]) : "Total"}
            </span>
            <span className="font-mono-data text-base font-bold text-slate-900">
              {activeItem
                ? `${total > 0 ? Math.round(((activeItem.value || 0) / total) * 100) : 0}%`
                : "100%"}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 w-full max-w-xs">
          {data.map((s, i) => {
            const isHovered = active === i;
            const pct = total > 0 ? Math.round(((s.value || 0) / total) * 100) : 0;
            return (
              <div
                key={s.name}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1 transition-all duration-150 cursor-pointer select-none",
                  isHovered ? "bg-slate-100 font-semibold shadow-xs" : "hover:bg-slate-50"
                )}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform duration-150"
                  style={{
                    backgroundColor: s.color,
                    transform: isHovered ? "scale(1.35)" : "scale(1)",
                  }}
                />
                <span className="text-[11px] text-slate-600 truncate">{s.name}</span>
                <span className="text-[11px] font-semibold text-slate-800 ml-auto">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
