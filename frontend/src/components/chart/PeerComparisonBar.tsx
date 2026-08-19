import { Card, CardHeader, CardTitle, CardDescription } from "../ui/primitives";
import { TrendingUp } from "lucide-react";

interface PeerComparisonBarProps {
  label?: string;
  peerMin: number;
  peerMax: number;
  userValue: number;
  unit?: string;
  percentile?: number; // e.g. 20 means top 20%
  improvementPct?: number; // e.g. 5 means improved 5% from last month
  bhkType?: string;
  loading?: boolean;
}

export function PeerComparisonBar({
  label = "How you compare",
  peerMin = 280,
  peerMax = 620,
  userValue = 384,
  unit = "kWh",
  percentile = 20,
  improvementPct = 5,
  bhkType = "2BHK",
  loading = false,
}: PeerComparisonBarProps) {
  if (loading) {
    return <Card className="h-52 animate-pulse bg-slate-50" />;
  }

  const range = peerMax - peerMin;
  const userPct = range > 0 ? ((userValue - peerMin) / range) * 100 : 50;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{label}</CardTitle>
          <CardDescription>vs similar {bhkType} flats in your block</CardDescription>
        </div>
      </CardHeader>
      <div className="px-5 pb-5 pt-3">
        {/* Peer range label */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Peer range (min–max)</span>
          <span className="text-xs font-semibold text-slate-700">
            {peerMin}–{peerMax} {unit}/month
          </span>
        </div>

        {/* Range bar */}
        <div className="relative h-8 rounded-full overflow-hidden bg-slate-100">
          {/* Gradient fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${Math.min(100, userPct)}%`,
              background: "linear-gradient(90deg, #16a34a, #f59e0b)",
            }}
          />
          {/* User marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white"
            style={{ left: `${Math.min(98, userPct)}%` }}
          />
        </div>

        {/* Labels below bar */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] text-slate-400">{peerMin} {unit}</span>
          <span className="text-[11px] font-semibold text-teal-600">Your: {userValue} {unit}</span>
          <span className="text-[11px] text-slate-400">{peerMax} {unit}</span>
        </div>

        {/* Success card */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
          <TrendingUp size={16} className="text-teal-500 shrink-0" />
          <p className="text-xs font-medium text-teal-700">
            You're in the top {percentile}% — great work, improved {improvementPct}% from last month.
          </p>
        </div>

        <p className="mt-3 text-[10px] text-slate-400">
          We only show your position, individual flat data is never shared.
        </p>
      </div>
    </Card>
  );
}
