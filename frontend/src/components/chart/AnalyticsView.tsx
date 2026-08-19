import { useState, useEffect, useRef } from "react";
import { TabPills, FilterChips, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "../ui/primitives";
import { DatePicker } from "../ui/DatePicker";
import { TimeOfDayChart, type HourlyDataPoint } from "./TimeOfDayChart";
import { Heatmap } from "./Heatmap";
import { EmptyState } from "./EmptyState";
import { AlertTriangle, CheckCircle, Flame } from "lucide-react";
import { cn } from "../../lib/utils";
import type { HeatmapGrid, AnomalyItem } from "../../lib/types";

interface AnalyticsViewProps {
  /** Function that returns a promise resolving to heatmap data */
  loadHeatmap?: (filter?: string) => Promise<HeatmapGrid>;
  /** Function that returns a promise resolving to hourly breakdown data */
  loadHourlyBreakdown?: (filter?: string, date?: string) => Promise<HourlyDataPoint[]>;
  /** Function that returns a promise resolving to anomaly items */
  loadAnomalies?: (filter?: string) => Promise<AnomalyItem[]>;
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
  loadAnomalies,
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
  const [anomaliesData, setAnomaliesData] = useState<AnomalyItem[] | null>(null);
  const [anomaliesLoading, setAnomaliesLoading] = useState<boolean>(false);

  const loadHeatmapRef = useRef(loadHeatmap);
  loadHeatmapRef.current = loadHeatmap;

  const loadHourlyRef = useRef(loadHourlyBreakdown);
  loadHourlyRef.current = loadHourlyBreakdown;

  const loadAnomaliesRef = useRef(loadAnomalies);
  loadAnomaliesRef.current = loadAnomalies;

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

  // Fetch anomalies data when filter changes or tab is active
  useEffect(() => {
    let isMounted = true;

    if (loadAnomaliesRef.current) {
      setAnomaliesLoading(true);
      loadAnomaliesRef.current(activeFilter)
        .then((data) => {
          if (isMounted) {
            setAnomaliesData(data);
            setAnomaliesLoading(false);
          }
        })
        .catch((err) => {
          console.error("Anomalies API error:", err);
          if (isMounted) {
            setAnomaliesData([]);
            setAnomaliesLoading(false);
          }
        });
    } else {
      setAnomaliesData([]);
      setAnomaliesLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeFilter, activeTab]);

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
        anomaliesLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl border border-slate-200 bg-white/50 animate-pulse p-4" />
            ))}
          </div>
        ) : anomaliesData && anomaliesData.length > 0 ? (
          <div className="flex flex-col gap-3">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="text-amber-500" size={18} />
                    Active Anomalies ({activeFilter})
                  </CardTitle>
                  <CardDescription>
                    Deviations flagged automatically based on baseline power draw
                  </CardDescription>
                </div>
                <Badge variant="high">{anomaliesData.filter((a) => !a.resolved).length} Active</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {anomaliesData.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all",
                      item.resolved ? "border-slate-200 bg-slate-50 opacity-70" : "border-red-200 bg-red-50/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-xl mt-0.5", item.resolved ? "bg-slate-200 text-slate-500" : "bg-red-100 text-red-500")}>
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.flat}</span>
                          {item.blockName && <span className="text-xs text-slate-400">· {item.blockName}</span>}
                          <Badge variant={item.resolved ? "neutral" : "high"}>
                            {item.resolved ? "Resolved" : item.multiplier}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Detected at: {item.detectedAt || "Recent reading"}</p>
                      </div>
                    </div>

                    {!item.resolved && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="teal"
                          onClick={() => alert(`Initiating diagnostic workflow for ${item.flat}`)}
                        >
                          Investigate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAnomaliesData((prev) =>
                              prev ? prev.map((a) => (a.id === item.id ? { ...a, resolved: true } : a)) : prev
                            );
                          }}
                        >
                          Acknowledge
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <EmptyState
            icon={<CheckCircle className="text-emerald-500" size={32} />}
            title={`No Anomalies Detected (${activeFilter})`}
            description={`Power consumption across ${activeFilter} is strictly within normal baseline patterns.`}
          />
        )
      )}
    </div>
  );
}
