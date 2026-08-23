import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ChevronRight, Plus, Trash2, X, Layers, Home, CheckCircle2 } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_SOCIETY } from "../../components/layout/DashboardLayout";
import { FlatDashboardView } from "../../components/FlatDashboardView";
import { Card, CardHeader, CardTitle, CardDescription, Breadcrumb, Table, Thead, Th, Td, Tr, Button, Input, Badge, type BreadcrumbItem } from "../../components/ui/primitives";
import { DeleteConfirmModal } from "../../components/ui/DeleteConfirmModal";
import { getErrorMessage } from "../../lib/utils";
import type { BlockFloorRow, FloorFlatRow, SocietyFlatRow } from "../../lib/types";

import { DashboardTab } from "./society/DashboardTab";
import { AnalyticsTab } from "./society/AnalyticsTab";
import { AlertsTab } from "./society/AlertsTab";
import { ResidentsTab } from "./society/ResidentsTab";
import { BillingTab } from "./society/BillingTab";
import { SettingsTab } from "./society/SettingsTab";

/* ──────────────────────── Drill-down Lists ──────────────────────── */

function BlockFloorList({
  blockId,
  blockName,
  onSelectFloor,
  onRefreshSociety,
}: {
  blockId: string;
  blockName: string;
  onSelectFloor: (id: string, floorNumber: number) => void;
  onRefreshSociety?: () => void;
}) {
  const [floors, setFloors] = useState<BlockFloorRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState<BlockFloorRow | null>(null);

  // Creation mode states
  const [mode, setMode] = useState<"multiple" | "single">("multiple");
  const [startFloor, setStartFloor] = useState<number | string>(1);
  const [endFloor, setEndFloor] = useState<number | string>(4);
  const [newFloorsCount, setNewFloorsCount] = useState<number | string>(1);
  const [singleFloorNumber, setSingleFloorNumber] = useState<number | string>(1);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const currentMaxFloor = floors && floors.length > 0 ? Math.max(...floors.map((f) => f.floorNumber || 0)) : 0;

  const fetchFloors = async () => {
    setLoading(true);
    try {
      const data = await api.getBlockFloors(blockId);
      setFloors(data);
      if (data && data.length > 0) {
        const maxFloor = Math.max(...data.map((f) => f.floorNumber || 0));
        setSingleFloorNumber(maxFloor + 1);
        setNewFloorsCount(1);
      } else {
        setStartFloor(1);
        setEndFloor(4);
        setSingleFloorNumber(1);
      }
    } catch (err) {
      console.error("Failed to load block floors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, [blockId]);

  const handleAddFloors = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    const isInitial = !floors || floors.length === 0;
    const floorsToCreate: number[] = [];

    if (isInitial) {
      if (mode === "multiple") {
        const start = Number(startFloor);
        const end = Number(endFloor);
        if (isNaN(start) || isNaN(end) || end < start) {
          setActionError("Please enter a valid floor range (e.g. from 1 to 5).");
          setActionLoading(false);
          return;
        }
        if (end - start + 1 > 100) {
          setActionError("You can add up to 100 floors at a time.");
          setActionLoading(false);
          return;
        }
        for (let i = start; i <= end; i++) {
          floorsToCreate.push(i);
        }
      } else {
        const single = Number(singleFloorNumber);
        if (isNaN(single) || single < 0) {
          setActionError("Please enter a valid floor number.");
          setActionLoading(false);
          return;
        }
        floorsToCreate.push(single);
      }
    } else {
      if (mode === "multiple") {
        const count = Number(newFloorsCount);
        if (isNaN(count) || count <= 0) {
          setActionError("Please enter how many new floors you want to add (at least 1).");
          setActionLoading(false);
          return;
        }
        if (count > 100) {
          setActionError("You can add up to 100 floors at a time.");
          setActionLoading(false);
          return;
        }
        const nextStart = currentMaxFloor + 1;
        for (let i = 0; i < count; i++) {
          floorsToCreate.push(nextStart + i);
        }
      } else {
        const single = Number(singleFloorNumber);
        if (isNaN(single) || single < 0) {
          setActionError("Please enter a valid floor number.");
          setActionLoading(false);
          return;
        }
        floorsToCreate.push(single);
      }
    }

    try {
      for (const floorNum of floorsToCreate) {
        await api.createFloor(blockId, floorNum);
      }

      setShowAddFloorModal(false);
      if (floorsToCreate.length === 1) {
        setActionSuccess(`Floor ${floorsToCreate[0]} created successfully.`);
      } else {
        setActionSuccess(
          `Added ${floorsToCreate.length} floors (Floors ${floorsToCreate[0]} to ${floorsToCreate[floorsToCreate.length - 1]}) successfully.`
        );
      }
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchFloors();
      onRefreshSociety?.();
    } catch (err: any) {
      setActionError(getErrorMessage(err, "Failed to create floors."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFloor = async () => {
    if (!floorToDelete) return;
    try {
      await api.deleteFloor(blockId, floorToDelete.id);
      setActionSuccess(`Floor ${floorToDelete.floorNumber} deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchFloors();
      onRefreshSociety?.();
    } catch (err) {
      console.error("Failed to delete floor", err);
    }
  };

  const isInitial = !floors || floors.length === 0;
  const sortedFloors = (floors ?? []).slice().sort((a, b) => (a.floorNumber ?? 0) - (b.floorNumber ?? 0));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Floors in {blockName || "Block"}</CardTitle>
          <CardDescription>Click a floor to see its flats, or add new floors</CardDescription>
        </div>
        <Button
          variant="teal"
          size="sm"
          onClick={() => {
            setActionError(null);
            setMode("multiple");
            if (isInitial) {
              setStartFloor(1);
              setEndFloor(4);
            } else {
              setNewFloorsCount(1);
              setSingleFloorNumber(currentMaxFloor + 1);
            }
            setShowAddFloorModal(true);
          }}
          className="flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={14} /> Add Floor{isInitial ? "s" : ""}
        </Button>
      </CardHeader>

      <div className="px-5 pb-5">
        {actionSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/90 p-3 text-xs font-semibold text-teal-900 shadow-xs animate-fade-in">
            <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {loading && !floors ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 skeleton-box rounded-xl" />
            ))}
          </div>
        ) : isInitial ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-3 border border-teal-100">
              <Layers size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No floors in this block yet</h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Add floors in bulk from Floor 1 to N, or add a single floor to get started.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="teal"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setMode("multiple");
                  setStartFloor(1);
                  setEndFloor(4);
                  setShowAddFloorModal(true);
                }}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Floors (1 to N)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError(null);
                  setMode("single");
                  setSingleFloorNumber(1);
                  setShowAddFloorModal(true);
                }}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Add Single Floor
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedFloors.map((f) => (
              <div
                key={f.id}
                onClick={() => onSelectFloor(String(f.id), f.floorNumber)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-xs cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-bold text-xs">
                      {f.floorNumber}
                    </div>
                    <span className="font-display text-sm font-semibold text-slate-900">
                      Floor {f.floorNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloorToDelete(f);
                    }}
                    className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title={`Delete Floor ${f.floorNumber}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100/80 pt-2.5">
                  <span className="text-xs text-slate-500">{f.flatCount ?? 0} flats</span>
                  <span className="font-mono-data text-xs font-semibold text-slate-700">
                    {f.mtdKwh ?? 0} kWh
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Floor Modal */}
      {showAddFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !actionLoading && setShowAddFloorModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {isInitial ? "Create Initial Floors" : "Add Floors"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {blockName || "Block"} {!isInitial ? `· Current highest: Floor ${currentMaxFloor}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFloorModal(false)}
                disabled={actionLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mode selection tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
              <button
                type="button"
                onClick={() => setMode("multiple")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${mode === "multiple"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {isInitial ? "Range (1 to N)" : "Add Multiple Floors"}
              </button>
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${mode === "single"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Single Floor
              </button>
            </div>

            <form onSubmit={handleAddFloors} className="space-y-4">
              {actionError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 font-medium animate-fade-in">
                  {actionError}
                </div>
              )}

              {isInitial ? (
                /* Initial creation: No existing floors */
                mode === "multiple" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Start Floor Number *
                        </label>
                        <Input
                          required
                          type="number"
                          min={0}
                          value={startFloor}
                          onChange={(e) => setStartFloor(e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          End Floor Number *
                        </label>
                        <Input
                          required
                          type="number"
                          min={Number(startFloor) || 1}
                          value={endFloor}
                          onChange={(e) => setEndFloor(e.target.value)}
                          placeholder="e.g. 5"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs text-teal-900">
                      <span className="font-semibold">Floor preview:</span> Will create{" "}
                      <strong>
                        {Number(endFloor) >= Number(startFloor)
                          ? Number(endFloor) - Number(startFloor) + 1
                          : 0}{" "}
                        floors
                      </strong>{" "}
                      (Floors {startFloor} through {endFloor})
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Number *</label>
                    <Input
                      required
                      type="number"
                      min={0}
                      value={singleFloorNumber}
                      onChange={(e) => setSingleFloorNumber(e.target.value)}
                      placeholder="e.g. 1"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Creates a single floor: Floor {singleFloorNumber}</p>
                  </div>
                )
              ) : (
                /* Subsequent additions: floors already exist */
                mode === "multiple" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        How many new floors do you want to add? *
                      </label>
                      <Input
                        required
                        type="number"
                        min={1}
                        max={100}
                        value={newFloorsCount}
                        onChange={(e) => setNewFloorsCount(e.target.value)}
                        placeholder="e.g. 3"
                      />
                    </div>

                    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 text-xs text-teal-900">
                      <span className="font-semibold">Automatic sequence:</span> Next floors will start from{" "}
                      <strong>Floor {currentMaxFloor + 1}</strong> up to{" "}
                      <strong>Floor {currentMaxFloor + (Number(newFloorsCount) || 1)}</strong> (
                      {Number(newFloorsCount) || 1} new floor{Number(newFloorsCount) === 1 ? "" : "s"}).
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Number *</label>
                    <Input
                      required
                      type="number"
                      min={0}
                      value={singleFloorNumber}
                      onChange={(e) => setSingleFloorNumber(e.target.value)}
                      placeholder={`e.g. ${currentMaxFloor + 1}`}
                    />
                    <p className="mt-1 text-[11px] text-slate-400">
                      Defaults to next floor ({currentMaxFloor + 1}), or enter any specific floor number.
                    </p>
                  </div>
                )
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddFloorModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  size="sm"
                  disabled={actionLoading}
                  className="cursor-pointer"
                >
                  {actionLoading
                    ? "Creating Floors..."
                    : mode === "multiple"
                      ? "Create Floors"
                      : "Add Floor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Floor Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(floorToDelete)}
        onClose={() => setFloorToDelete(null)}
        onConfirm={handleDeleteFloor}
        title="Delete Floor"
        itemName={floorToDelete ? `Floor ${floorToDelete.floorNumber}` : undefined}
        description={
          <p>
            Are you sure you want to delete <strong>Floor {floorToDelete?.floorNumber}</strong> in {blockName}? All flats and meters on this floor will also be removed.
          </p>
        }
        confirmText="Delete Floor"
        dangerNote="This action is permanent."
      />
    </Card>
  );
}

function FloorFlatList({
  floorId,
  floorLabel,
  blockName,
  onSelectFlat,
  onRefreshSociety,
}: {
  floorId: string;
  floorLabel: string;
  blockName: string;
  onSelectFlat: (id: string, flatNumber: string) => void;
  onRefreshSociety?: () => void;
}) {
  const [flats, setFlats] = useState<FloorFlatRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddFlatModal, setShowAddFlatModal] = useState(false);
  const [flatToDelete, setFlatToDelete] = useState<FloorFlatRow | null>(null);
  const [newFlatNumber, setNewFlatNumber] = useState("");
  const [newBhkType, setNewBhkType] = useState("2BHK");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchFlats = async () => {
    setLoading(true);
    try {
      const data = await api.getFloorFlatsList(floorId);
      setFlats(data);
    } catch (err) {
      console.error("Failed to load floor flats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, [floorId]);

  const handleAddFlat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlatNumber.trim()) {
      setActionError("Flat number is required.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await api.createFlat(floorId, {
        flatNumber: newFlatNumber.trim(),
        bhkType: newBhkType,
      });
      setShowAddFlatModal(false);
      setActionSuccess(`Flat ${newFlatNumber.trim()} added successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
      setNewFlatNumber("");
      await fetchFlats();
      onRefreshSociety?.();
    } catch (err: any) {
      setActionError(getErrorMessage(err, "Failed to create flat."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFlat = async () => {
    if (!flatToDelete) return;
    try {
      await api.deleteFlat(floorId, flatToDelete.id);
      setActionSuccess(`Flat ${flatToDelete.flatNumber} deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
      await fetchFlats();
      onRefreshSociety?.();
    } catch (err) {
      console.error("Failed to delete flat", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Flats — {floorLabel || "Floor"} {blockName ? `(${blockName})` : ""}</CardTitle>
          <CardDescription>Click a flat to view its live energy dashboard, or add new flats</CardDescription>
        </div>
        <Button
          variant="teal"
          size="sm"
          onClick={() => {
            setActionError(null);
            setShowAddFlatModal(true);
          }}
          className="flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus size={14} /> Add Flat
        </Button>
      </CardHeader>

      <div className="px-5 pb-5 pt-1">
        {actionSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/90 p-3 text-xs font-semibold text-teal-900 shadow-xs animate-fade-in">
            <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {loading && !flats ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 skeleton-box rounded-xl" />
            ))}
          </div>
        ) : !flats || flats.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-3 border border-teal-100">
              <Home size={22} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No flats on this floor yet</h3>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Add flats to this floor so residents and smart meters can be linked.
            </p>
            <Button
              variant="teal"
              size="sm"
              onClick={() => {
                setActionError(null);
                setShowAddFlatModal(true);
              }}
              className="mt-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Flat
            </Button>
          </div>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Flat Number</Th>
                <Th>BHK Type</Th>
                <Th>Resident</Th>
                <Th>Meter Status</Th>
                <Th>Month kWh</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {flats.map((f) => (
                <Tr key={f.id} onClick={() => onSelectFlat(String(f.id), f.flatNumber)} className="cursor-pointer group hover:bg-slate-50/80 transition-colors">
                  <Td className="font-semibold text-slate-900">{f.flatNumber}</Td>
                  <Td>
                    <Badge variant="neutral">{f.bhkType}</Badge>
                  </Td>
                  <Td>{f.residentName ? <span className="font-medium text-slate-900">{f.residentName}</span> : <span className="text-slate-400">Vacant</span>}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className={`h-2 w-2 rounded-full ${f.meterStatus === "live" ? "bg-emerald-500" : "bg-slate-300"}`} />
                      {f.meterStatus === "live" ? "Live" : "Offline"}
                    </span>
                  </Td>
                  <Td className="font-mono-data font-semibold text-slate-800">{f.mtdKwh ?? 0}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFlatToDelete(f);
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title={`Delete Flat ${f.flatNumber}`}
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={15} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Add Flat Modal */}
      {showAddFlatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !actionLoading && setShowAddFlatModal(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Home size={18} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">Add Flat</h3>
                  <p className="text-xs text-slate-500">{floorLabel} ({blockName})</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFlatModal(false)}
                disabled={actionLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddFlat} className="space-y-4">
              {actionError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 font-medium">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Flat Number *</label>
                <Input
                  required
                  placeholder="e.g. 101, 102, A-101"
                  value={newFlatNumber}
                  onChange={(e) => setNewFlatNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">BHK Type *</label>
                <select
                  value={newBhkType}
                  onChange={(e) => setNewBhkType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 outline-none focus:border-teal-500"
                >
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK">4 BHK</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddFlatModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="teal"
                  size="sm"
                  disabled={actionLoading}
                  className="cursor-pointer"
                >
                  {actionLoading ? "Adding..." : "Add Flat"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Flat Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(flatToDelete)}
        onClose={() => setFlatToDelete(null)}
        onConfirm={handleDeleteFlat}
        title="Delete Flat"
        itemName={flatToDelete ? `Flat ${flatToDelete.flatNumber}` : undefined}
        description={
          <p>
            Are you sure you want to delete <strong>Flat {flatToDelete?.flatNumber}</strong>? Connected meter assignments and resident linkages will be unlinked.
          </p>
        }
        confirmText="Delete Flat"
        dangerNote="This action is permanent."
      />
    </Card>
  );
}

/* ──────────────────────── Main Dashboard View ──────────────────────── */

export default function SocietyAdminDashboard() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const readOnly = searchParams.get("readonly") === "true";

  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeKey, setActiveKey] = useState(initialTab);

  // Sync state with URL search parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveKey(tab);
    }
  }, [searchParams]);

  // drill-down state: block -> floor -> flat
  const [blockId, setBlockId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [flatId, setFlatId] = useState<string | null>(null);

  const [societyName, setSocietyName] = useState<string>("");
  const [blockName, setBlockName] = useState<string>("");
  const [floorLabel, setFloorLabel] = useState<string>("");
  const [flatLabel, setFlatLabel] = useState<string>("");

  const [flats, setFlats] = useState<SocietyFlatRow[] | null>(null);
  const [anomalies, setAnomalies] = useState([
    { id: "a1", flat: "Flat 402", desc: "Drawing 5.8 kWh at 2:00 AM — expected 1.8 kWh", multiplier: "3.2x usual", resolved: false },
    { id: "a2", flat: "Flat 112", desc: "Drawing 4.2 kWh at 11:00 PM — expected 1.5 kWh", multiplier: "2.8x usual", resolved: false },
  ]);

  const refreshSocietyFlats = async () => {
    if (societyId) {
      try {
        const data = await api.getSocietyFlatsList(societyId);
        if (data && Array.isArray(data)) {
          setFlats(data);
        }
      } catch (err) {
        console.error("Failed to refresh flats list:", err);
      }
    }
  };

  useEffect(() => {
    if (societyId) {
      api.getSocietyOverview(societyId).then((o) => {
        if (o.name) setSocietyName(o.name);
      });
      api.getSocietyFlatsList(societyId).then(setFlats);
      api.getSocietyAnomalies(societyId).then((data) => {
        if (data && data.length > 0) {
          setAnomalies(data);
        }
      }).catch(() => { });
    }
  }, [societyId]);

  function reset() {
    setBlockId(null);
    setFloorId(null);
    setFlatId(null);
  }

  function selectBlock(id: string, name: string) {
    setBlockId(id);
    setBlockName(name);
    setFloorId(null);
    setFlatId(null);
  }

  function selectFloor(id: string, floorNumber: number) {
    setFloorId(id);
    setFloorLabel(`Floor ${floorNumber}`);
    setFlatId(null);
  }

  function selectFlat(id: string, flatNumber?: string) {
    setFlatId(id);
    if (flatNumber) setFlatLabel(`Flat ${flatNumber}`);
  }

  const crumbs: BreadcrumbItem[] = [{ label: societyName || "Society", onClick: reset }];
  if (blockId) crumbs.push({ label: blockName, onClick: () => { setFloorId(null); setFlatId(null); } });
  if (floorId) crumbs.push({ label: floorLabel, onClick: () => setFlatId(null) });
  if (flatId) crumbs.push({ label: flatLabel });

  const handleNav = (key: string) => {
    if (key === "devices") {
      navigate(`/society/${societyId}/devices`);
    } else {
      reset();
      setSearchParams({ tab: key });
      setActiveKey(key);
    }
  };

  return (
    <DashboardLayout
      nav={readOnly
        ? [{ key: "dashboard", label: "Dashboard", icon: <Building2 size={16} /> }]
        : NAV_ITEMS_SOCIETY
      }
      activeKey={activeKey}
      onNav={handleNav}
      banner={
        readOnly && (
          <div className="flex items-center justify-between border-b border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-amber-50/80 px-4 py-2.5 text-xs font-medium text-amber-900 md:px-8 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 items-center rounded-md bg-amber-500/15 border border-amber-300/80 px-2 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                Read-Only
              </span>
              <span>Viewing as <strong>Builder Admin</strong></span>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 shadow-2xs transition-all duration-150 hover:bg-amber-100 hover:border-amber-400 hover:shadow-xs cursor-pointer"
            >
              ← Back to portfolio
            </button>
          </div>
        )
      }
    >
      {/* Hide standard header inside sub-tabs unless in dashboard drilldown */}
      {(flatId || floorId || blockId) && (
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Society Admin</p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-slate-900">{societyName || "Loading…"}</h1>
          </div>
          <div className="mt-2">
            <Breadcrumb items={crumbs} />
          </div>
        </div>
      )}

      {flatId ? (
        <FlatDashboardView flatId={flatId} />
      ) : floorId ? (
        <FloorFlatList
          floorId={floorId}
          floorLabel={floorLabel}
          blockName={blockName}
          onSelectFlat={(id, flatNumber) => selectFlat(id, flatNumber)}
          onRefreshSociety={refreshSocietyFlats}
        />
      ) : blockId ? (
        <BlockFloorList
          blockId={blockId}
          blockName={blockName}
          onSelectFloor={(id, floorNumber) => selectFloor(id, floorNumber)}
          onRefreshSociety={refreshSocietyFlats}
        />
      ) : (
        /* Render Sidebar Views */
        <>
          {activeKey === "dashboard" && (
            <DashboardTab
              societyId={societyId ?? ""}
              onSelectBlock={selectBlock}
              onSelectFlat={selectFlat}
              anomalies={anomalies}
              setAnomalies={setAnomalies}
              flats={flats}
            />
          )}

          {activeKey === "analytics" && (
            <AnalyticsTab societyId={societyId ?? ""} />
          )}

          {activeKey === "alerts" && (
            <AlertsTab anomalies={anomalies} setAnomalies={setAnomalies} />
          )}

          {activeKey === "residents" && (
            <ResidentsTab
              societyId={societyId || "1"}
              flats={flats}
              onSelectFlat={selectFlat}
              onRefresh={() => {
                if (societyId) api.getSocietyFlatsList(societyId).then(setFlats);
              }}
            />
          )}

          {activeKey === "billing" && (
            <BillingTab flats={flats} />
          )}

          {activeKey === "settings" && (
            <SettingsTab />
          )}
        </>
      )}
    </DashboardLayout>
  );
}
