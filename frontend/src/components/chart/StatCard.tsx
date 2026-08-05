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
    <Card className={cn("px-5 py-4", accent && "bg-grid-900 border-grid-900")}>
      <div className="flex items-start justify-between">
        <p className={cn("text-[11px] font-medium uppercase tracking-wide", accent ? "text-slate-400" : "text-slate-400")}>{label}</p>
        {icon && <div className={cn("opacity-70", accent && "text-amp-400")}>{icon}</div>}
      </div>
      {loading ? (
        <div className="mt-2 h-6 w-20 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className={cn("font-mono-data mt-1 text-2xl font-bold", accent ? "text-white" : "text-grid-900")}>{value}</p>
      )}
      {sub && <p className={cn("mt-0.5 text-xs", accent ? "text-slate-400" : "text-slate-500")}>{sub}</p>}
    </Card>
  );
}
