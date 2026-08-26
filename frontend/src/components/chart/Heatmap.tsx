import { useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { Flame, Clock, Activity, Zap } from "lucide-react";
import type { HeatmapGrid } from "../../lib/types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface HoverState {
  d: number;
  h: number;
  v: number;
}

// Classic Thermal Spectrum (Soft Coral Pink -> Crimson Red Peak)
function getArcadiaIntensity(val: number, max: number): { bg: string; text: string; label: string } {
  if (val < 0) return { bg: "rgba(241, 245, 249, 0.9)", text: "#94a3b8", label: "No Telemetry" };
  if (max <= 0) return { bg: "rgba(254, 226, 226, 0.5)", text: "#64748b", label: "Off-Peak" };

  const ratio = val / max;

  if (ratio <= 0.15) return { bg: "rgba(254, 226, 226, 0.6)", text: "#991b1b", label: "Low Load" };
  if (ratio <= 0.30) return { bg: "rgba(252, 165, 165, 0.7)", text: "#991b1b", label: "Mild Demand" };
  if (ratio <= 0.45) return { bg: "rgba(248, 113, 113, 0.8)", text: "#ffffff", label: "Moderate" };
  if (ratio <= 0.60) return { bg: "rgba(239, 68, 68, 0.85)", text: "#ffffff", label: "Standard Peak" };
  if (ratio <= 0.75) return { bg: "rgba(220, 38, 38, 0.90)", text: "#ffffff", label: "Heavy Demand" };
  if (ratio <= 0.90) return { bg: "rgba(185, 28, 28, 0.95)", text: "#ffffff", label: "High Peak" };
  return { bg: "rgba(153, 27, 27, 1.0)", text: "#ffffff", label: "Max Peak Surge" };
}

interface HeatmapProps {
  grid: HeatmapGrid | null;
  loading: boolean;
  title?: string;
  description?: string;
}

export function Heatmap({
  grid,
  loading,
  title = "Consumption Heatmap",
  description = "28-Day average hourly kW load intensity",
}: HeatmapProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const onEnter = useCallback((d: number, h: number, v: number) => setHover({ d, h, v }), []);
  const onLeave = useCallback(() => setHover(null), []);

  const stats = useMemo(() => {
    if (!grid || grid.length === 0) return { max: 0, avg: 0, peakDay: 0, peakHour: 0 };
    let sum = 0;
    let count = 0;
    let max = 0;
    let peakDay = 0;
    let peakHour = 0;

    grid.forEach((row, d) => {
      row.forEach((v, h) => {
        if (v >= 0) {
          sum += v;
          count++;
          if (v > max) {
            max = v;
            peakDay = d;
            peakHour = h;
          }
        }
      });
    });

    return {
      max: Math.round(max * 10) / 10,
      avg: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
      peakDay,
      peakHour,
    };
  }, [grid]);

  if (loading || !grid) {
    return <Card className="h-80 animate-pulse bg-slate-50 border border-[var(--color-sage-mist,#afc4bf)]" />;
  }

  const maxVal = stats.max;

  return (
    <Card className="border border-[var(--color-sage-mist,#afc4bf)] bg-white overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">{description}</CardDescription>
        </div>

        {maxVal > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-cream-paper,#f3f1ec)] border border-[var(--color-sage-mist,#afc4bf)] text-xs text-slate-700">
              <Activity size={13} className="text-emerald-600" />
              <span>Avg:</span>
              <span className="font-bold text-slate-900 font-mono">{stats.avg} kW</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-cream-paper,#f3f1ec)] border border-[var(--color-sage-mist,#afc4bf)] text-xs text-slate-700">
              <Flame size={13} className="text-purple-600" />
              <span>Peak:</span>
              <span className="font-bold text-slate-900 font-mono">
                {DOW[stats.peakDay]} {stats.peakHour}:00 ({stats.max} kW)
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <div className="overflow-x-auto px-5 pb-4 pt-3">
        <div className="min-w-[700px]">
          {/* Hour labels header */}
          <div className="mb-2 flex pl-12 pr-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex-1 text-center text-[10px] font-medium transition-colors"
                style={{
                  color: hover?.h === h ? "#101f1e" : "#535e5d",
                  fontWeight: hover?.h === h ? 700 : 500,
                }}
              >
                {h % 3 === 0 ? `${h}:00` : "·"}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="space-y-1">
            {grid.map((row, d) => (
              <div key={d} className="flex items-center">
                {/* Day label */}
                <div
                  className="w-12 shrink-0 text-xs font-semibold tracking-wide transition-colors"
                  style={{
                    color: hover?.d === d ? "#104336" : "#535e5d",
                    fontWeight: hover?.d === d ? 700 : 500,
                  }}
                >
                  {DOW[d]}
                </div>

                {/* 24 Hour Cells */}
                <div className="flex flex-1 gap-1">
                  {row.map((v, h) => {
                    const intensity = getArcadiaIntensity(v, maxVal);
                    const isHovered = hover?.d === d && hover?.h === h;
                    const isCrosshair = hover && (hover.d === d || hover.h === h);

                    return (
                      <div
                        key={h}
                        onMouseEnter={() => onEnter(d, h, v)}
                        onMouseLeave={onLeave}
                        className="h-7 flex-1 rounded-[4px] relative cursor-pointer flex items-center justify-center transition-all duration-150"
                        style={{
                          backgroundColor: intensity.bg,
                          transform: isHovered ? "scale(1.22)" : "scale(1)",
                          zIndex: isHovered ? 20 : 1,
                          opacity: hover && !isCrosshair ? 0.35 : 1,
                          boxShadow: isHovered ? "0 6px 16px rgba(16, 67, 54, 0.25)" : "none",
                          border: isHovered ? "1.5px solid #104336" : "1px solid rgba(0,0,0,0.02)",
                        }}
                      >
                        {/* Numeric value tooltip preview when hovered */}
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--color-bark,#101f1e)] text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap pointer-events-none z-30 flex items-center gap-1.5 font-mono">
                            <Clock size={11} className="text-slate-300" />
                            <span>{DOW_FULL[d]} {h}:00</span>
                            <span className="font-bold text-[var(--color-mint-pulse,#0fff87)]">{v} kW</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Arcadia Heatmap Legend */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Intensity scale:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="h-3 w-5 rounded-[2px] border border-slate-200" style={{ backgroundColor: "rgba(241, 245, 249, 0.9)" }} />
                <span className="text-[10px] text-slate-500">Off-Peak</span>
                <div className="h-3 w-5 rounded-[2px] ml-1.5" style={{ backgroundColor: "rgba(254, 226, 226, 0.7)" }} />
                <span className="text-[10px] text-slate-500">Low</span>
                <div className="h-3 w-5 rounded-[2px] ml-1.5" style={{ backgroundColor: "rgba(252, 165, 165, 0.8)" }} />
                <span className="text-[10px] text-slate-500">Mild</span>
                <div className="h-3 w-5 rounded-[2px] ml-1.5" style={{ backgroundColor: "rgba(248, 113, 113, 0.85)" }} />
                <span className="text-[10px] text-slate-500">Moderate</span>
                <div className="h-3 w-5 rounded-[2px] ml-1.5" style={{ backgroundColor: "rgba(239, 68, 68, 0.9)" }} />
                <span className="text-[10px] text-slate-500">High</span>
                <div className="h-3 w-5 rounded-[2px] ml-1.5" style={{ backgroundColor: "rgba(153, 27, 27, 1.0)" }} />
                <span className="text-[10px] font-semibold text-red-700">Max Surge</span>
              </div>
            </div>

            {hover && (
              <div className="text-[11px] text-slate-700 font-mono flex items-center gap-1.5">
                <span className="font-semibold">{DOW_FULL[hover.d]} at {hover.h}:00</span>
                <span>—</span>
                <span className="font-bold text-slate-900">{hover.v} kW</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-sans text-slate-600">
                  {getArcadiaIntensity(hover.v, maxVal).label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
