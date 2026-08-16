import { useEffect, useState, useMemo } from "react";
import * as api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { AnalyticsView } from "../../../components/chart/AnalyticsView";
import type { SocietyBlockRow } from "../../../lib/types";

export function AnalyticsTab({ societyId }: { societyId: string }) {
  const { session, isDemoMode } = useAuth();
  const [blocks, setBlocks] = useState<SocietyBlockRow[] | null>(null);

  useEffect(() => {
    if (societyId && (session || isDemoMode)) {
      api.getSocietyBlocks(societyId).then(setBlocks).catch(() => {});
    }
  }, [societyId, session, isDemoMode]);

  const filterOptions = useMemo(() => {
    const blockNames = (blocks ?? []).map((b) => b.name);
    return blockNames.length > 0
      ? ["Whole society", ...blockNames, "Common areas"]
      : ["Whole society", "Block A", "Block B", "Block C", "Common areas"];
  }, [blocks]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Deep dive into consumption patterns</p>
      </div>
      <AnalyticsView
        filters={filterOptions}
        loadHeatmap={() => api.getSocietyHeatmap(societyId)}
        loadHourlyBreakdown={(filter, date) => api.getSocietyHourlyBreakdown(societyId, date)}
      />
    </div>
  );
}
