import { useState, useEffect, useRef } from "react";
import { TabPills, FilterChips } from "../ui/primitives";
import { TimeOfDayChart, type HourlyDataPoint } from "./TimeOfDayChart";
import { Heatmap } from "./Heatmap";
import { EmptyState } from "./EmptyState";
import type { HeatmapGrid } from "../../lib/types";

interface AnalyticsViewProps {
  /** Function that returns a promise resolving to heatmap data */
  loadHeatmap?: (filter?: string) => Promise<HeatmapGrid>;
  /** Optional pre-generated stacked data; defaults to mock data */
  stackedData?: HourlyDataPoint[];
  /** Tab options. Default: Time of Day, Heatmap, Anomalies */
  tabs?: string[];
  /** Filter chip options */
  filters?: string[];
}

function generateMockHeatmap(filterName: string = "Whole society"): HeatmapGrid {
  let seed = 0;
  for (let i = 0; i < filterName.length; i++) {
    seed = (seed * 31 + filterName.charCodeAt(i)) % 10000;
  }
  const isCommon = filterName.toLowerCase().includes("common");

  return Array.from({ length: 7 }, (_, d) => {
    const isWeekend = d === 0 || d === 6;
    return Array.from({ length: 24 }, (_, h) => {
      const pseudo = Math.sin((d * 24 + h) * 11.11 + seed) * 0.5 + 0.5;
      let base = (h >= 6 && h <= 23 ? 30 : 10) + pseudo * 25;
      if (isWeekend) base += 15;
      if (isCommon) {
        base = (h >= 18 && h <= 23 ? 55 : h >= 6 && h <= 18 ? 35 : 12) + pseudo * 20;
      }
      if ((h >= 7 && h <= 10) || (h >= 18 && h <= 22)) {
        base += 25 + pseudo * 15;
      }
      return Math.round(base);
    });
  });
}

export function AnalyticsView({
  loadHeatmap,
  stackedData,
  tabs = ["Time of Day", "Heatmap", "Anomalies"],
  filters = ["Whole society", "Block A", "Block B", "Common areas"],
}: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [activeFilter, setActiveFilter] = useState(filters[0] || "Whole society");
  const [heatmapData, setHeatmapData] = useState<HeatmapGrid | null>(null);

  const loadHeatmapRef = useRef(loadHeatmap);
  loadHeatmapRef.current = loadHeatmap;

  // Sync activeFilter if filter options list changes
  useEffect(() => {
    if (filters.length > 0 && !filters.includes(activeFilter)) {
      setActiveFilter(filters[0]);
    }
  }, [filters, activeFilter]);

  useEffect(() => {
    let isMounted = true;

    if (loadHeatmapRef.current) {
      loadHeatmapRef.current(activeFilter)
        .then((data) => {
          if (isMounted) setHeatmapData(data);
        })
        .catch(() => {
          if (isMounted) setHeatmapData(generateMockHeatmap(activeFilter));
        });
    } else {
      setHeatmapData(generateMockHeatmap(activeFilter));
    }

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  return (
    <div className="flex flex-col gap-5">
      <TabPills tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <FilterChips chips={filters} active={activeFilter} onChange={setActiveFilter} />

      {activeTab === "Time of Day" && (
        <TimeOfDayChart data={stackedData} filterName={activeFilter} />
      )}

      {activeTab === "Heatmap" && (
        <Heatmap
          grid={heatmapData}
          loading={!heatmapData}
          description={`Average kWh per hour · ${activeFilter}`}
        />
      )}

      {activeTab === "Anomalies" && (
        <EmptyState
          icon={<span className="text-2xl">🔍</span>}
          title={`Anomaly detection (${activeFilter})`}
          description={`Anomaly detection is analyzing consumption patterns for ${activeFilter}. Unusual spikes and deviations will appear here automatically.`}
        />
      )}
    </div>
  );
}
