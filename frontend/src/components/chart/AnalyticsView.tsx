import { useState, useEffect, useRef } from "react";
import { TabPills, FilterChips } from "../ui/primitives";
import { DatePicker } from "../ui/DatePicker";
import { TimeOfDayChart, type HourlyDataPoint } from "./TimeOfDayChart";
import { Heatmap } from "./Heatmap";
import { EmptyState } from "./EmptyState";
import type { HeatmapGrid } from "../../lib/types";

interface AnalyticsViewProps {
  /** Function that returns a promise resolving to heatmap data */
  loadHeatmap?: (filter?: string) => Promise<HeatmapGrid>;
  /** Function that returns a promise resolving to hourly breakdown data */
  loadHourlyBreakdown?: (filter?: string, date?: string) => Promise<HourlyDataPoint[]>;
  /** Optional pre-generated stacked data */
  stackedData?: HourlyDataPoint[];
  /** Tab options. Default: Time of Day, Heatmap, Anomalies */
  tabs?: string[];
  /** Filter chip options */
  filters?: string[];
}

export function AnalyticsView({
  loadHeatmap,
  loadHourlyBreakdown,
  stackedData,
  tabs = ["Time of Day", "Heatmap", "Anomalies"],
  filters = ["Whole society", "Common areas"],
}: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [activeFilter, setActiveFilter] = useState(filters[0] || "Whole society");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today or local date in YYYY-MM-DD
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [heatmapData, setHeatmapData] = useState<HeatmapGrid | null>(null);
  const [heatmapLoading, setHeatmapLoading] = useState<boolean>(false);
  const [hourlyData, setHourlyData] = useState<HourlyDataPoint[] | null>(null);
  const [hourlyLoading, setHourlyLoading] = useState<boolean>(false);

  const loadHeatmapRef = useRef(loadHeatmap);
  loadHeatmapRef.current = loadHeatmap;

  const loadHourlyRef = useRef(loadHourlyBreakdown);
  loadHourlyRef.current = loadHourlyBreakdown;

  // Sync activeFilter if filter options list changes
  useEffect(() => {
    if (filters.length > 0 && !filters.includes(activeFilter)) {
      setActiveFilter(filters[0]);
    }
  }, [filters, activeFilter]);

  // Fetch heatmap data when filter changes
  useEffect(() => {
    let isMounted = true;

    if (loadHeatmapRef.current) {
      setHeatmapLoading(true);
      loadHeatmapRef.current(activeFilter)
        .then((data) => {
          if (isMounted) {
            setHeatmapData(data);
            setHeatmapLoading(false);
          }
        })
        .catch((err) => {
          console.error("Heatmap API error:", err);
          if (isMounted) {
            setHeatmapData(Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0)));
            setHeatmapLoading(false);
          }
        });
    } else {
      setHeatmapData(Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0)));
      setHeatmapLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  // Fetch hourly breakdown data when filter or selectedDate changes
  useEffect(() => {
    let isMounted = true;

    if (loadHourlyRef.current) {
      setHourlyLoading(true);
      loadHourlyRef.current(activeFilter, selectedDate)
        .then((data) => {
          if (isMounted) {
            setHourlyData(data);
            setHourlyLoading(false);
          }
        })
        .catch((err) => {
          console.error("Hourly breakdown API error:", err);
          if (isMounted) {
            setHourlyData([]);
            setHourlyLoading(false);
          }
        });
    } else if (stackedData) {
      setHourlyData(stackedData);
      setHourlyLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeFilter, selectedDate, stackedData]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <TabPills tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "Time of Day" && (
          <div className="flex items-center gap-2">
            <DatePicker value={selectedDate} onChange={setSelectedDate} />
          </div>
        )}
      </div>

      <FilterChips chips={filters} active={activeFilter} onChange={setActiveFilter} />

      {activeTab === "Time of Day" && (
        <TimeOfDayChart
          data={hourlyData ?? stackedData}
          loading={hourlyLoading}
          filterName={activeFilter}
          description={`24-Hour breakdown · ${selectedDate}`}
        />
      )}

      {activeTab === "Heatmap" && (
        <Heatmap
          grid={heatmapData}
          loading={heatmapLoading || !heatmapData}
          description={`Average kW per hour · ${activeFilter}`}
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
