import type { ReactNode } from "react";
import { Card } from "../ui/primitives";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
  loading?: boolean;
}

export function StatCard({ label, value, sub, icon, accent = false, loading }: StatCardProps) {
  return (
    <Card className={cn(
      "px-5 py-4 card-hover-lift",
      accent && "border-teal-200 bg-teal-50/30"
    )}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        {icon && (
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accent ? "bg-teal-500/10 text-teal-500" : "bg-slate-100 text-slate-400"
          )}>
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className={cn(
          "font-mono-data mt-1.5 text-2xl font-bold",
          accent ? "text-teal-600" : "text-grid-900"
        )}>{value}</p>
      )}
      {sub && <p className={cn("mt-1 text-xs", accent ? "text-teal-600/70" : "text-slate-500")}>{sub}</p>}
    </Card>
  );
}
