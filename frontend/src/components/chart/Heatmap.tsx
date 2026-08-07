import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import type { HeatmapGrid } from "../../lib/types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HoverState {
  d: number;
  h: number;
  v: number;
}

interface HeatmapProps {
  grid: HeatmapGrid | null;
  loading: boolean;
}

export function Heatmap({ grid, loading }: HeatmapProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  if (loading || !grid) {
    return <Card className="h-64 animate-pulse bg-slate-50" />;
  }

  const max = Math.max(...grid.flat());

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Society consumption heatmap</CardTitle>
          <CardDescription>Average kWh per hour across all flats, last 4 weeks</CardDescription>
        </div>
        {hover && (
          <div className="rounded-lg bg-grid-900 px-3 py-1.5 text-xs text-white">
            {DOW[hover.d]} {hover.h}:00 — <span className="font-mono-data font-semibold">{hover.v} kWh</span>
          </div>
        )}
      </CardHeader>
      <div className="overflow-x-auto px-5 pb-5 pt-3">
        <div className="min-w-[640px]">
          <div className="mb-1 flex pl-9">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-slate-400">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {grid.map((row, d) => (
            <div key={d} className="flex items-center">
              <div className="w-9 shrink-0 text-[11px] font-medium text-slate-500">{DOW[d]}</div>
              <div className="flex flex-1 gap-[2px]">
                {row.map((v, h) => {
                  const intensity = max ? v / max : 0;
                  return (
                    <div
                      key={h}
                      onMouseEnter={() => setHover({ d, h, v })}
                      onMouseLeave={() => setHover(null)}
                      className="h-5 flex-1 rounded-[3px] transition-transform hover:scale-110"
                      style={{ backgroundColor: `rgba(245, 166, 35, ${0.08 + intensity * 0.85})` }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
