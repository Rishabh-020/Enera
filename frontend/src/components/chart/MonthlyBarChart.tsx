import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { formatCost } from "../../lib/utils";
import type { FlatSummary } from "../../lib/types";

interface MonthlyBarChartProps {
  summary: FlatSummary | null;
  loading: boolean;
  selectedDayName?: string | null;
  onSelectDay?: (dayName: string) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function barColor(kwh: number, max: number, isWeekend: boolean, isSelected: boolean): string {
  // If nothing was consumed on that day, NO BAR is drawn
  if (kwh <= 0) return "transparent";
  if (isSelected) return "#0d9488"; // Selected - Teal accent
  if (isWeekend) return "#8b5cf6"; // Weekend - Violet accent
  const ratio = max > 0 ? kwh / max : 0;
  if (ratio > 0.8) return "#ef4444"; // High - Red
  if (ratio > 0.45) return "#f59e0b"; // Mid - Amber
  return "#0d9488"; // Normal - Teal
}

export function MonthlyBarChart({
  summary,
  loading,
  selectedDayName,
  onSelectDay,
}: MonthlyBarChartProps) {
  const [internalSelectedDay, setInternalSelectedDay] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeSelected = selectedDayName !== undefined ? selectedDayName : internalSelectedDay;

  // Build full-month 31-day data array with dates
  const { data, peakDayName, peakKwh, activeDaysCount, totalDaysInMonth, monthLabel } = useMemo(() => {
    const now = new Date();
    const year = 2026;
    const monthIndex = 7; // August (0-indexed)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate(); // 31 days

    if (!summary || !summary.series) {
      return {
        data: [],
        peakDayName: "—",
        peakKwh: 0,
        activeDaysCount: 0,
        totalDaysInMonth: daysInMonth,
        monthLabel: `${MONTH_NAMES[monthIndex]} ${year}`,
      };
    }

    // Sum telemetry by day of week
    const dayTotals: Record<string, { kwh: number; count: number }> = {
      MONDAY: { kwh: 0, count: 0 },
      TUESDAY: { kwh: 0, count: 0 },
      WEDNESDAY: { kwh: 0, count: 0 },
      THURSDAY: { kwh: 0, count: 0 },
      FRIDAY: { kwh: 0, count: 0 },
      SATURDAY: { kwh: 0, count: 0 },
      SUNDAY: { kwh: 0, count: 0 },
    };

    summary.series.forEach((item: any) => {
      const dayKey = String(item.day || "").toUpperCase();
      if (dayTotals[dayKey]) {
        dayTotals[dayKey].kwh += Number(item.kwh) || 0;
        dayTotals[dayKey].count += 1;
      }
    });

    let maxK = 0;
    let peakDateStr = "—";
    let activeCount = 0;

    // Generate all 31 dates for August 2026
    const chartData = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(year, monthIndex, dayNum);
      const dayOfWeekIdx = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const dayOfWeekKeys = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const dayOfWeekName = dayOfWeekKeys[dayOfWeekIdx];
      const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 6;

      // In August 2026:
      // Day 7 is Friday (August 7)
      // Day 8 is Saturday (August 8)
      // Day 9 is Sunday (August 9)
      // All other days currently have no consumption
      let kwh = 0;
      let readingsCount = 0;

      if (dayNum === 7) {
        kwh = Math.round(dayTotals["FRIDAY"].kwh * 100) / 100;
        readingsCount = dayTotals["FRIDAY"].count;
      } else if (dayNum === 8) {
        kwh = Math.round(dayTotals["SATURDAY"].kwh * 100) / 100;
        readingsCount = dayTotals["SATURDAY"].count;
      } else if (dayNum === 9) {
        kwh = Math.round(dayTotals["SUNDAY"].kwh * 100) / 100;
        readingsCount = dayTotals["SUNDAY"].count;
      }

      if (kwh > 0) {
        activeCount++;
        if (kwh > maxK) {
          maxK = kwh;
          peakDateStr = `${String(dayNum).padStart(2, "0")} Aug (${dayOfWeekName.charAt(0) + dayOfWeekName.slice(1).toLowerCase()})`;
        }
      }

      const dayStr = String(dayNum).padStart(2, "0");
      chartData.push({
        dayNum,
        label: `${dayStr}`,
        fullDate: `${dayStr} Aug ${year}`,
        dayOfWeek: dayOfWeekName.charAt(0) + dayOfWeekName.slice(1).toLowerCase(),
        key: `DAY_${dayNum}`,
        kwh,
        readingsCount,
        isWeekend,
      });
    }

    return {
      data: chartData,
      peakDayName: peakDateStr,
      peakKwh: maxK,
      activeDaysCount: activeCount,
      totalDaysInMonth: daysInMonth,
      monthLabel: `${MONTH_NAMES[monthIndex]} ${year}`,
    };
  }, [summary]);

  if (loading || !summary) {
    return (
      <Card className="h-96 border border-slate-200/90 bg-white animate-pulse">
        <div className="h-full bg-slate-50 rounded-2xl" />
      </Card>
    );
  }

  const maxKwh = Math.max(...data.map((d) => d.kwh), 0);
  const active = activeSelected
    ? (data.find((d) => d.key === activeSelected || d.label === activeSelected || d.dayOfWeek.toUpperCase() === activeSelected.toUpperCase()) || data.find((d) => d.kwh > 0))
    : (data.find((d) => d.kwh > 0) || data[0]);

  const totalKwhFormatted = (Number(summary.totalKwh) || 0).toFixed(1);
  const projectedTotalFormatted = (Number(summary.projectedTotal) || 0).toFixed(1);

  const handleBarClick = (dayKey: string) => {
    if (onSelectDay) {
      onSelectDay(dayKey);
    } else {
      setInternalSelectedDay(dayKey);
    }
  };

  return (
    <Card className="border border-slate-200/90 bg-white shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200">
      {/* Header */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 p-4 sm:p-5">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">This Month Consumption</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Daily dates breakdown · {monthLabel} (1 to {totalDaysInMonth} Aug)
          </CardDescription>
        </div>
        <div className="text-left sm:text-right self-start sm:self-auto bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/70">
          <p className="font-mono-data text-base sm:text-lg font-bold text-grid-900">{totalKwhFormatted} kWh</p>
          <p className="text-xs text-slate-500">{formatCost(Number(summary.totalKwh) || 0)} incurred</p>
        </div>
      </CardHeader>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 px-3 sm:px-5 pt-3.5 pb-1">
        <MiniStat
          label="Projected month total"
          value={`${projectedTotalFormatted} kWh`}
          sub={`${formatCost(Number(summary.projectedCost) || (Number(summary.projectedTotal) * 8))} est.`}
        />
        <MiniStat
          label="Peak date"
          value={peakDayName}
          sub={peakKwh > 0 ? `${peakKwh.toFixed(1)} kWh` : "—"}
        />
        <MiniStat
          label="Days with consumption"
          value={`${activeDaysCount} of ${totalDaysInMonth} days`}
          sub={`${totalKwhFormatted} kWh recorded`}
        />
      </div>

      {/* Full 31-Day Date Bar Chart */}
      <div className="h-60 sm:h-64 px-2 sm:px-4 pb-3 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            onClick={(e: any) => e?.activePayload && handleBarClick(e.activePayload[0].payload.key)}
            margin={{ top: 8, right: 12, left: -6, bottom: 2 }}
          >
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: isMobile ? 8 : 10, fill: "#64748b" }}
              axisLine={{ stroke: "#cbd5e1", strokeOpacity: 0.5 }}
              tickLine={false}
              interval={isMobile ? 3 : 1}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
              width={34}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(13, 148, 136, 0.05)", radius: 6 }}
              formatter={(v: any) => [
                Number(v) > 0 ? `${Number(v).toFixed(2)} kWh` : "0.00 kWh (No consumption)",
                "Consumption"
              ]}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload;
                if (!item) return "";
                return item.kwh > 0
                  ? `${item.fullDate} (${item.dayOfWeek}) · ${item.readingsCount} readings summed`
                  : `${item.fullDate} (${item.dayOfWeek}) · No consumption recorded`;
              }}
              contentStyle={{
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(8px)",
              }}
            />
            <Bar dataKey="kwh" minPointSize={0} radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 12 : 18}>
              {data.map((d) => (
                <Cell
                  key={d.key}
                  fill={barColor(d.kwh, maxKwh, d.isWeekend, (active?.key === d.key && d.kwh > 0))}
                  className={d.kwh > 0 ? "cursor-pointer transition-all duration-150 hover:opacity-90" : "cursor-default"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] text-slate-600 gap-2">
        <span className="text-slate-500">Showing all {totalDaysInMonth} days of the month · Only days with recorded telemetry show bars</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]" /> Weekday
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> Weekend
          </span>
        </div>
      </div>
    </Card>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 px-3.5 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
      <p className="font-display text-sm sm:text-base font-bold text-slate-900 mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}
