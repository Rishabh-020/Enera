import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import type { HeatmapGrid } from "../../lib/types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HoverState { d: number; h: number; v: number }

const INTENSITY_STOPS: [number, string][] = [
  [0.15, "rgba(254,226,226,0.6)"],
  [0.30, "rgba(252,165,165,0.7)"],
  [0.45, "rgba(248,113,113,0.75)"],
  [0.60, "rgba(239,68,68,0.8)"],
  [0.75, "rgba(220,38,38,0.85)"],
  [0.90, "rgba(185,28,28,0.9)"],
  [1.01, "rgba(153,27,27,0.95)"],
];

function intensityColor(intensity: number): string {
  return (INTENSITY_STOPS.find(([t]) => intensity < t)?.[1]) ?? INTENSITY_STOPS[INTENSITY_STOPS.length - 1][1];
}

interface HeatmapProps {
  grid: HeatmapGrid | null;
  loading: boolean;
  title?: string;
  description?: string;
}

export function Heatmap({ grid, loading, title = "Consumption heatmap", description = "Average kWh per hour, last 4 weeks" }: HeatmapProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const onEnter = useCallback((d: number, h: number, v: number) => setHover({ d, h, v }), []);
  const onLeave = useCallback(() => setHover(null), []);

  if (loading || !grid) return <Card className="h-64 animate-pulse bg-slate-50" />;

  const max = Math.max(...grid.flat());

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {hover && (
          <div className="rounded-lg bg-grid-900 px-3 py-1.5 text-xs text-white shadow-lg animate-fade-in">
            {DOW[hover.d]} {hover.h}:00 — <span className="font-mono-data font-semibold">{hover.v === -1 ? "-1 (No data)" : `${hover.v} kWh`}</span>
          </div>
        )}
      </CardHeader>
      <div className="overflow-x-auto px-5 pb-5 pt-3">
        <div className="min-w-[640px]">
          {/* Hour labels */}
          <div className="mb-1.5 flex pl-10">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex-1 text-center text-[9px] font-medium transition-colors duration-150"
                style={{ color: hover?.h === h ? "#0f172a" : "#94a3b8", fontWeight: hover?.h === h ? 700 : 500 }}
              >
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {grid.map((row, d) => (
            <div key={d} className="flex items-center mb-[3px]">
              <div
                className="w-10 shrink-0 text-[11px] font-medium transition-colors duration-150"
                style={{ color: hover?.d === d ? "#0f172a" : "#64748b", fontWeight: hover?.d === d ? 700 : 500 }}
              >
                {DOW[d]}
              </div>
              <div className="flex flex-1 gap-[3px]">
                {row.map((v, h) => {
                  const intensity = max > 0 && v >= 0 ? v / max : 0;
                  const isActive = hover?.d === d && hover?.h === h;
                  const isRowOrCol = hover && (hover.d === d || hover.h === h);
                  return (
                    <div
                      key={h}
                      onMouseEnter={() => onEnter(d, h, v)}
                      onMouseLeave={onLeave}
                      className="h-7 flex-1 rounded-[5px] cursor-pointer"
                      style={{
                        backgroundColor: v === -1 ? "rgba(241, 245, 249, 0.9)" : intensityColor(intensity),
                        transform: isActive ? "scale(1.18)" : "scale(1)",
                        opacity: hover && !isRowOrCol ? 0.4 : 1,
                        boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                        zIndex: isActive ? 10 : 0,
                        position: "relative",
                        transition: "transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[10px] text-slate-400">Low</span>
            <div className="flex gap-[2px]">
              {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].map((intensity, i) => (
                <div key={i} className="h-3.5 w-6 rounded-[3px]" style={{ backgroundColor: intensityColor(intensity) }} />
              ))}
            </div>
            <span className="text-[10px] text-slate-400">High</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
