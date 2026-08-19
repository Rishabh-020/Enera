import { Zap, WifiOff } from "lucide-react";
import { Card, Badge } from "../ui/primitives";
import { timeAgo } from "../../lib/utils";
import type { FlatLive } from "../../lib/types";

const LEVEL_META = {
  normal: { color: "#0d9488", badge: "normal" as const, label: "Normal" },
  amber: { color: "#f59e0b", badge: "amber" as const, label: "Above average" },
  high: { color: "#dc2626", badge: "high" as const, label: "High usage" },
};

interface LiveMeterCardProps {
  data: FlatLive | null;
  loading: boolean;
}

export function LiveMeterCard({ data, loading }: LiveMeterCardProps) {
  if (loading || !data) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-teal-500" />
      </Card>
    );
  }

  if (!data.online) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <WifiOff size={22} className="text-slate-400" />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-slate-700">Meter offline</p>
          <p className="text-xs text-slate-500">Last reading at {data.lastReadingAt ? timeAgo(data.lastReadingAt) : "—"}</p>
        </div>
      </Card>
    );
  }

  const meta = LEVEL_META[data.level ?? "normal"];
  const kw = data.kw ?? 0;
  const pct = Math.min(1, kw / 6);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-5 px-6 py-8">
        <div className="relative flex h-40 w-40 items-center justify-center">
          {/* Gauge ring */}
          <div
            className="absolute inset-0 rounded-full animate-glow"
            style={{
              background: `conic-gradient(${meta.color} ${pct * 360}deg, #f1f5f9 0deg)`,
              WebkitMaskImage: "radial-gradient(closest-side, transparent 76%, black 77%)",
              maskImage: "radial-gradient(closest-side, transparent 76%, black 77%)",
            }}
          />
          {/* Center content */}
          <div className="flex flex-col items-center">
            <Zap size={16} style={{ color: meta.color }} className="mb-1" />
            <span className="font-mono-data text-3xl font-bold text-grid-900">{kw.toFixed(2)}</span>
            <span className="text-xs font-medium text-slate-400">kW live</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <p className="text-xs text-slate-500">
            {(data.pctVsUsual ?? 0) >= 0 ? "+" : ""}
            {data.pctVsUsual}% vs your usual {new Date().getHours()}:00 usage
          </p>
          <p className="text-[11px] text-slate-400">Updated {data.timestamp ? timeAgo(data.timestamp) : "—"}</p>
        </div>
      </div>
    </Card>
  );
}
