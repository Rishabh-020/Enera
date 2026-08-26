import { useEffect, useState, useMemo } from "react";
import * as api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { AnalyticsView } from "../../../components/chart/AnalyticsView";
import type { SocietyBlockRow } from "../../../lib/types";

export function AnalyticsTab({ societyId }: { societyId: string }) {
  const { session, isDemoMode } = useAuth();
  const [blocks, setBlocks] = useState<SocietyBlockRow[] | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (societyId && (session || isDemoMode)) {
      api.getSocietyBlocks(societyId)
        .then((data) => {
          if (isMounted) {
            setBlocks(Array.isArray(data) ? data : []);
          }
        })
        .catch((err) => {
          console.warn("Could not load society blocks, using fallback:", err);
          if (isMounted) setBlocks([]);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [societyId, session, isDemoMode]);

  const blockNames = useMemo(() => {
    if (!blocks || blocks.length === 0) {
      return ["Block A", "Block B"]; // Instant fallback so filter chips are always populated
    }
    return blocks.map((b: any) => {
      const raw = (b.name || b.blockName || "").trim();
      return raw.toLowerCase().startsWith("block") ? raw : `Block ${raw}`;
    }).filter(Boolean);
  }, [blocks]);

  const filterOptions = useMemo(() => {
    return ["Whole society", ...blockNames, "Common areas"];
  }, [blockNames]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Deep dive into consumption patterns</p>
      </div>
      <AnalyticsView
        filters={filterOptions}
        loadHeatmap={(filter) => api.getSocietyHeatmap(societyId, filter)}
        loadHourlyBreakdown={(filter, date) => api.getSocietyHourlyBreakdown(societyId, filter, date)}
        loadAnomalies={(filter) => api.getSocietyAnomalies(societyId, filter)}
      />
    </div>
  );
}
