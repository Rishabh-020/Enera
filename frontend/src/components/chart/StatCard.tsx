import type { ReactNode } from "react";
import { Card } from "../ui/primitives";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  loading?: boolean;
}

export function StatCard({ label, value, unit, sub, icon, accent = false, loading }: StatCardProps) {
  return (
    <Card className={cn(
      "p-5 card-hover-lift border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between",
      accent && "border-teal-300/80 bg-gradient-to-br from-white via-teal-50/20 to-emerald-50/30"
    )}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 truncate">{label}</p>
          {icon && (
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
              accent
                ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs shadow-teal-500/30"
                : "bg-slate-100/90 text-slate-600 border border-slate-200/60"
            )}>
              {icon}
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <div className="mt-2 flex items-baseline gap-1.5">
            <p className={cn(
              "font-mono-data text-2xl sm:text-3xl font-bold tracking-tight",
              accent ? "text-teal-700" : "text-slate-900"
            )}>
              {value}
            </p>
            {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          </div>
        )}
      </div>

      {sub && (
        <p className={cn(
          "mt-2 text-xs font-medium truncate pt-1 border-t border-slate-100/80",
          accent ? "text-teal-700/80" : "text-slate-500"
        )}>
          {sub}
        </p>
      )}
    </Card>
  );
}
