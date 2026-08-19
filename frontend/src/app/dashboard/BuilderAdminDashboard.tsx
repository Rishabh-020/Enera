import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Users, Zap, ArrowUpDown, Plus, Download, Leaf } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_BUILDER } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/chart/StatCard";
import { BenchmarkChart } from "../../components/chart/BenchmarkChart";
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge, Table, Thead, Th, Td, Tr } from "../../components/ui/primitives";
import type { BuilderOverview, BuilderSocietyRow } from "../../lib/types";
import { useWebSocketReading } from "../../context/WebSocketContext";

export default function BuilderAdminDashboard() {
  const { builderId } = useParams<{ builderId: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<BuilderOverview | null>(null);
  const [societies, setSocieties] = useState<BuilderSocietyRow[] | null>(null);
  const [sortField, setSortField] = useState<"name" | "mtdKwh" | "avgPerFlat" | "mom">("mtdKwh");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const { latestReading, isConnected } = useWebSocketReading();

  const getSocietyMom = (s: BuilderSocietyRow): number => {
    if (typeof s.mom === "number") return s.mom;
    const baseline = s.prevMonthKwh && s.prevMonthKwh > 0 ? s.prevMonthKwh : (s.occupiedFlats > 0 ? s.occupiedFlats * 120 : (s.mtdKwh > 0 ? s.mtdKwh * 0.95 : 100));
    return Number((((s.mtdKwh - baseline) / baseline) * 100).toFixed(1));
  };

  useEffect(() => {
    if (!latestReading) return;

    // Update builder overview metrics in React memory state
    setOverview((prev) =>
      prev
        ? {
          ...prev,
          mtdKwh: Number((prev.mtdKwh + (latestReading.kwh ?? 0.05)).toFixed(1)),
        }
        : prev
    );

    // Update builder societies list
    if (latestReading.societyId) {
      setSocieties((prev) =>
        prev
          ? prev.map((s) => {
            if (String(s.id) === String(latestReading.societyId) || latestReading.isDemo) {
              const addedKwh = latestReading.kwh ?? 0.05;
              const newMtdKwh = Number((s.mtdKwh + addedKwh).toFixed(2));
              const newAvgPerFlat = s.totalFlats > 0 ? Number((newMtdKwh / s.totalFlats).toFixed(2)) : s.avgPerFlat;
              const baseline = s.prevMonthKwh && s.prevMonthKwh > 0 ? s.prevMonthKwh : (s.occupiedFlats > 0 ? s.occupiedFlats * 120 : (s.mtdKwh > 0 ? s.mtdKwh * 0.95 : 100));
              const newMom = Number((((newMtdKwh - baseline) / baseline) * 100).toFixed(1));

              return {
                ...s,
                mtdKwh: newMtdKwh,
                avgPerFlat: newAvgPerFlat,
                mom: newMom,
                prevMonthKwh: baseline,
              };
            }
            return s;
          })
          : prev
      );
    }
  }, [latestReading]);

  useEffect(() => {
    if (!builderId) return;

    api.getBuilderOverview(builderId).then(setOverview);
    api.getBuilderSocieties(builderId).then(setSocieties);
  }, [builderId]);

  const handleSort = (field: "name" | "mtdKwh" | "avgPerFlat" | "mom") => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    if (!societies) return null;
    return [...societies].sort((a, b) => {
      let diff = 0;
      if (sortField === "name") {
        diff = a.name.localeCompare(b.name);
      } else if (sortField === "avgPerFlat") {
        diff = a.avgPerFlat - b.avgPerFlat;
      } else if (sortField === "mom") {
        diff = getSocietyMom(a) - getSocietyMom(b);
      } else {
        diff = a.mtdKwh - b.mtdKwh;
      }
      return sortDir === "desc" ? -diff : diff;
    });
  }, [societies, sortField, sortDir]);

  // Generate benchmark data from societies
  const benchmarkData = useMemo(() => {
    return (societies ?? []).map((s) => ({
      name: s.name,
      efficient: Math.round(s.mtdKwh * 0.7),
      total: s.mtdKwh,
    }));
  }, [societies]);

  const handleNav = (key: string) => {
    if (key === "analytics") navigate(`/builder/${builderId}/analytics`);
  };

  return (
    <DashboardLayout
      nav={NAV_ITEMS_BUILDER}
      activeKey="portfolio"
      onNav={handleNav}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-grid-900">Portfolio overview</h1>
          <p className="text-sm text-slate-500">
            {overview ? overview.name : "—"} · {overview ? overview.totalSocieties : "…"} societies
          </p>
        </div>
        <Button variant="teal">
          <Plus size={16} /> Add society
        </Button>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Societies"
          value={overview ? overview.totalSocieties : "—"}
          icon={<Building2 size={16} />}
          loading={!overview}
          accent
        />
        <StatCard
          label="Occupied flats"
          value={overview ? overview.totalBlocks * 30 : "—"}
          icon={<Users size={16} />}
          loading={!overview}
        />
        <StatCard
          label="Total kWh"
          value={overview ? `${Math.round(overview.mtdKwh / 1000)}k` : "—"}
          icon={<Zap size={16} />}
          loading={!overview}
        />
        <StatCard
          label="CO₂ equiv."
          value={overview ? `${(overview.mtdKwh * 0.82 / 1000).toFixed(1)}t` : "—"}
          icon={<Leaf size={16} />}
          loading={!overview}
        />
      </div>

      {/* Benchmarking + All societies table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BenchmarkChart societies={benchmarkData} loading={!societies} />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>All societies</CardTitle>
              <CardDescription>Click a society to drill into details</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleSort(sortField)}>
                Sort ({sortField === "mtdKwh" ? "kWh" : sortField}) {sortDir === "desc" ? "↓" : "↑"}
              </Button>
              <Button variant="ghost" size="sm">
                <Download size={13} /> CSV
              </Button>
            </div>
          </CardHeader>
          <div className="px-5 pb-5 pt-2">
            <Table>
              <Thead>
                <tr>
                  <Th className="cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("name")}>
                    Society {sortField === "name" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </Th>
                  <Th>City</Th>
                  <Th>Flats</Th>
                  <Th className="cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("avgPerFlat")}>
                    Avg/flat {sortField === "avgPerFlat" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </Th>
                  <Th className="cursor-pointer select-none hover:text-slate-900" onClick={() => handleSort("mom")}>
                    MoM {sortField === "mom" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                  </Th>
                  <Th>Status</Th>
                </tr>
              </Thead>
              <tbody>
                {(sorted ?? []).map((s) => {
                  const mom = getSocietyMom(s);
                  const isEfficient = mom <= 0;
                  return (
                    <Tr key={s.id} onClick={() => navigate(`/society/${s.id}?readonly=true`)} className="cursor-pointer">
                      <Td className="font-semibold text-grid-900">{s.name}</Td>
                      <Td>{s.city}</Td>
                      <Td>{s.occupiedFlats}/{s.totalFlats}</Td>
                      <Td className="font-mono-data">{s.avgPerFlat.toFixed(2)}</Td>
                      <Td>
                        <span className={isEfficient ? "text-teal-600 font-medium" : "text-red-500 font-medium"}>
                          {mom > 0 ? "+" : ""}{mom}%
                        </span>
                      </Td>
                      <Td>
                        <Badge variant={isEfficient ? "efficient" : "attention"}>
                          {isEfficient ? "Efficient" : "Needs attention"}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
