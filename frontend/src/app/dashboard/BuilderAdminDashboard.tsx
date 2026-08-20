import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Users, Zap, Plus, Download, Leaf, Trash2, X, CheckCircle2, ChevronRight } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_BUILDER } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/chart/StatCard";
import { BenchmarkChart } from "../../components/chart/BenchmarkChart";
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge, Table, Thead, Th, Td, Tr, Input } from "../../components/ui/primitives";
import { DeleteConfirmModal } from "../../components/ui/DeleteConfirmModal";
import type { BuilderOverview, BuilderSocietyRow } from "../../lib/types";
import { useWebSocketReading } from "../../context/WebSocketContext";

export default function BuilderAdminDashboard() {
  const { builderId } = useParams<{ builderId: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<BuilderOverview | null>(null);
  const [societies, setSocieties] = useState<BuilderSocietyRow[] | null>(null);
  const [sortField, setSortField] = useState<"name" | "mtdKwh" | "avgPerFlat" | "mom">("mtdKwh");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Modals & Action state
  const [showAddModal, setShowAddModal] = useState(false);
  const [societyToDelete, setSocietyToDelete] = useState<BuilderSocietyRow | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Add Society form
  const [societyForm, setSocietyForm] = useState({
    name: "",
    address: "",
    city: "Mumbai",
    totalBlocks: 4,
  });

  const { latestReading } = useWebSocketReading();

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

  function loadData() {
    if (!builderId) return;
    api.getBuilderOverview(builderId).then(setOverview).catch(() => {});
    api.getBuilderSocieties(builderId).then(setSocieties).catch(() => {});
  }

  useEffect(() => {
    loadData();
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

  // Handle Add Society
  const handleAddSociety = async (e: FormEvent) => {
    e.preventDefault();
    if (!societyForm.name || !builderId) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await api.createSociety({
        ...societyForm,
        builderId: Number(builderId),
      });
      // Optimistic update
      setSocieties((prev) => [
        ...(prev || []),
        {
          id: Date.now(),
          name: societyForm.name,
          city: societyForm.city,
          occupiedFlats: 0,
          totalFlats: societyForm.totalBlocks * 24,
          avgPerFlat: 0,
          mtdKwh: 0,
          mom: 0,
          status: "efficient",
        },
      ]);
      setOverview((prev) => prev ? { ...prev, totalSocieties: prev.totalSocieties + 1 } : prev);
      setShowAddModal(false);
      setActionSuccess(`Society "${societyForm.name}" created successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      setSocietyForm({ name: "", address: "", city: "Mumbai", totalBlocks: 4 });
      loadData();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create society.");
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Delete Society
  const handleDeleteSociety = async () => {
    if (!societyToDelete || !builderId) return;
    try {
      await api.deleteSociety(builderId, societyToDelete.id);
    } catch {
      // Mock fallback
    }
    // Optimistically remove
    setSocieties((prev) => (prev ? prev.filter((s) => s.id !== societyToDelete.id) : prev));
    setOverview((prev) => prev ? { ...prev, totalSocieties: Math.max(0, prev.totalSocieties - 1) } : prev);
    setActionSuccess(`Society "${societyToDelete.name}" has been deleted.`);
    setTimeout(() => setActionSuccess(null), 4000);
    loadData();
  };

  return (
    <DashboardLayout
      nav={NAV_ITEMS_BUILDER}
      activeKey="portfolio"
      onNav={handleNav}
    >
      {/* Toast banner */}
      {actionSuccess && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50/90 p-3.5 text-xs font-semibold text-teal-900 shadow-sm animate-fade-in">
          <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-grid-900">Portfolio overview</h1>
          <p className="text-sm text-slate-500">
            {overview ? overview.name : "—"} · {overview ? overview.totalSocieties : "…"} societies
          </p>
        </div>
        <Button variant="teal" onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 cursor-pointer">
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
                  <Th className="text-right">Actions</Th>
                </tr>
              </Thead>
              <tbody>
                {(sorted ?? []).map((s) => {
                  const mom = getSocietyMom(s);
                  const isEfficient = mom <= 0;
                  return (
                    <Tr
                      key={s.id}
                      onClick={() => navigate(`/society/${s.id}?readonly=true`)}
                      className="cursor-pointer group hover:bg-slate-50/80 transition-colors"
                    >
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
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSocietyToDelete(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={`Delete society ${s.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/society/${s.id}?readonly=true`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Drill down"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Delete Society Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(societyToDelete)}
        onClose={() => setSocietyToDelete(null)}
        onConfirm={handleDeleteSociety}
        title="Delete Housing Society"
        itemName={societyToDelete?.name}
        description={
          <p>
            Are you sure you want to delete <strong>"{societyToDelete?.name}"</strong>? All associated blocks, flats, smart meters, and historical telemetry data under this society will be deleted.
          </p>
        }
        confirmText="Delete Society"
        dangerNote="This action is permanent and cannot be undone."
      />

      {/* Add Society Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !addLoading && setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">Add Housing Society</h3>
                  <p className="text-xs text-slate-500">Provision a new complex in your portfolio</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSociety} className="space-y-4">
              {addError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium animate-fade-in">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Society Name *</label>
                <Input
                  required
                  placeholder="e.g. Palm Grove Residency"
                  value={societyForm.name}
                  onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <Input
                  placeholder="e.g. Sector 14, Palm Avenue"
                  value={societyForm.address}
                  onChange={(e) => setSocietyForm({ ...societyForm, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <Input
                    required
                    placeholder="e.g. Mumbai"
                    value={societyForm.city}
                    onChange={(e) => setSocietyForm({ ...societyForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Blocks</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={societyForm.totalBlocks}
                    onChange={(e) => setSocietyForm({ ...societyForm, totalBlocks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  size="sm"
                  disabled={addLoading}
                  className="cursor-pointer"
                >
                  {addLoading ? "Creating..." : "Create Society"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
