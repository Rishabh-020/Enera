import { useEffect, useState, useMemo, type FormEvent } from "react";
import { Search, ChevronRight, UserPlus, Trash2, X, CheckCircle2, UserCheck, Lock, Mail, User, Building } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Input, Button, Table, Thead, Th, Td, Tr, StatusDot } from "../../../components/ui/primitives";
import { CustomSelect } from "../../../components/ui/CustomSelect";
import { DeleteConfirmModal } from "../../../components/ui/DeleteConfirmModal";
import type { SocietyFlatRow } from "../../../lib/types";
import { useWebSocketReading } from "../../../context/WebSocketContext";
import { getErrorMessage } from "../../../lib/utils";
import * as api from "../../../lib/api";

interface ResidentsTabProps {
  societyId?: string;
  flats: SocietyFlatRow[] | null;
  onSelectFlat: (id: string, flatNumber: string) => void;
  onRefresh?: () => void;
}

export function ResidentsTab({ societyId = "1", flats: initialFlats, onSelectFlat, onRefresh }: ResidentsTabProps) {
  const [search, setSearch] = useState("");
  const [blockFilter, setBlockFilter] = useState("All");
  const [bhkFilter, setBhkFilter] = useState("All");
  const [flats, setFlats] = useState<SocietyFlatRow[] | null>(initialFlats);

  // Modals & action states
  const [showAddModal, setShowAddModal] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<SocietyFlatRow | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Add resident form
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "User@12345",
    flatId: "",
    flatNumber: "",
    bhkType: "2BHK",
    blockName: "Block A",
  });

  const { latestReading } = useWebSocketReading();

  useEffect(() => {
    setFlats(initialFlats);
  }, [initialFlats]);

  useEffect(() => {
    if (!latestReading || !latestReading.flatId) return;

    setFlats((prev) =>
      prev
        ? prev.map((f) =>
            String(f.id) === String(latestReading.flatId) || (latestReading.flatNumber && f.flatNumber === latestReading.flatNumber)
              ? { ...f, meterStatus: "live", mtdKwh: Number((f.mtdKwh + (latestReading.kwh ?? 0.01)).toFixed(1)) }
              : f
          )
        : prev
    );
  }, [latestReading]);

  // Extract unique dynamic blocks from flats
  const blockOptions = useMemo(() => {
    const uniqueBlocks = Array.from(new Set((flats ?? []).map((f) => f.blockName).filter(Boolean)));
    const opts = [{ value: "All", label: "All Blocks" }];
    if (uniqueBlocks.length > 0) {
      uniqueBlocks.forEach((b) => opts.push({ value: b, label: b }));
    } else {
      opts.push(
        { value: "Block A", label: "Block A" },
        { value: "Block B", label: "Block B" },
        { value: "Block C", label: "Block C" },
        { value: "Block D", label: "Block D" }
      );
    }
    return opts;
  }, [flats]);

  const bhkOptions = [
    { value: "All", label: "All BHKs" },
    { value: "1BHK", label: "1 BHK" },
    { value: "2BHK", label: "2 BHK" },
    { value: "3BHK", label: "3 BHK" },
  ];

  const filtered = useMemo(() => {
    return (flats ?? []).filter((f) => {
      const matchesSearch =
        !search ||
        f.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
        (f.residentName || "").toLowerCase().includes(search.toLowerCase());
      const matchesBlock = blockFilter === "All" || f.blockName === blockFilter;
      const matchesBhk = bhkFilter === "All" || f.bhkType === bhkFilter;
      return matchesSearch && matchesBlock && matchesBhk;
    });
  }, [flats, search, blockFilter, bhkFilter]);

  // Handle Delete Resident
  const handleDeleteResident = async () => {
    if (!residentToDelete) return;
    const targetId = residentToDelete.residentId ?? residentToDelete.id;
    try {
      await api.deleteResident(societyId, targetId);
      setActionSuccess(`Resident "${residentToDelete.residentName}" removed from Flat ${residentToDelete.flatNumber} and permanently deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);

      // Optimistically update local state
      setFlats((prev) =>
        prev
          ? prev.map((f) =>
              String(f.id) === String(residentToDelete.id)
                ? { ...f, residentName: null, residentId: null, residentEmail: null, occupied: false }
                : f
            )
          : prev
      );

      // Sync with server
      try {
        if (societyId) {
          const fresh = await api.getSocietyFlatsList(societyId);
          if (fresh && Array.isArray(fresh)) {
            setFlats(fresh);
          }
        }
      } catch (e) {}

      onRefresh?.();
    } catch (err) {
      setAddError(getErrorMessage(err, "Failed to remove resident."));
    } finally {
      setResidentToDelete(null);
    }
  };

  // Handle Add Resident
  const handleAddResident = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.flatNumber) {
      setAddError("Please fill in all required fields.");
      return;
    }

    const matchedFlat = (flats ?? []).find((f) => {
      if (form.flatId && String(f.id) === String(form.flatId)) return true;
      if (form.blockName && form.blockName.trim()) {
        return (
          f.flatNumber.toLowerCase() === form.flatNumber.trim().toLowerCase() &&
          f.blockName.toLowerCase() === form.blockName.trim().toLowerCase()
        );
      }
      return f.flatNumber.toLowerCase() === form.flatNumber.trim().toLowerCase();
    });

    const targetFlatId = matchedFlat ? Number(matchedFlat.id) : (form.flatId ? Number(form.flatId) : null);

    if (!targetFlatId) {
      setAddError("The specified flat was not found. Please create the flat in Society Blocks & Topology first.");
      return;
    }

    if (matchedFlat && matchedFlat.residentName) {
      setAddError(`Flat ${matchedFlat.flatNumber} (${matchedFlat.blockName}) is already occupied by "${matchedFlat.residentName}". Please remove the existing resident first.`);
      return;
    }

    const blockNameToUse = (form.blockName && form.blockName.trim()) || matchedFlat?.blockName || "Block";

    setAddLoading(true);
    setAddError(null);
    try {
      await api.registerResident({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: "RESIDENT",
        societyId: Number(societyId),
        flatId: targetFlatId,
        blockName: blockNameToUse,
      });

      // Update local flats state immediately with new resident name
      setFlats((prev) =>
        prev
          ? prev.map((f) =>
              String(f.id) === String(targetFlatId) ||
              (f.flatNumber.toLowerCase() === form.flatNumber.trim().toLowerCase() &&
                f.blockName.toLowerCase() === blockNameToUse.toLowerCase())
                ? { ...f, residentName: form.name.trim(), occupied: true }
                : f
            )
          : prev
      );

      setShowAddModal(false);
      setActionSuccess(`Resident "${form.name}" registered successfully for Flat ${form.flatNumber}!`);
      setTimeout(() => setActionSuccess(null), 4000);
      setForm({
        name: "",
        email: "",
        password: "User@12345",
        flatId: "",
        flatNumber: "",
        bhkType: "2BHK",
        blockName: "Block A",
      });

      // Refetch latest flats from server to guarantee sync
      try {
        if (societyId) {
          const fresh = await api.getSocietyFlatsList(societyId);
          if (fresh && Array.isArray(fresh)) {
            setFlats(fresh);
          }
        }
      } catch (e) {
        // Fall back to optimistic update
      }

      onRefresh?.();
    } catch (err) {
      setAddError(getErrorMessage(err, "Failed to register resident."));
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toast banner */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50/90 p-3.5 text-xs font-semibold text-teal-900 shadow-sm animate-fade-in">
          <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Resident Directory</CardTitle>
            <CardDescription>Search, manage and onboard flat residents and live meters</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resident or flat..."
                className="w-44 pl-9 h-9"
              />
            </div>
            <CustomSelect value={blockFilter} onChange={setBlockFilter} options={blockOptions} />
            <CustomSelect value={bhkFilter} onChange={setBhkFilter} options={bhkOptions} />
            <Button
              variant="teal"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserPlus size={14} /> Onboard Resident
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <Thead>
              <tr>
                <Th>Flat Number</Th>
                <Th>Block</Th>
                <Th>BHK Type</Th>
                <Th>Resident</Th>
                <Th>Meter Status</Th>
                <Th>MTD Consumption</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <tbody>
              {filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center py-8 text-slate-400">
                    No residents found matching criteria
                  </Td>
                </Tr>
              ) : (
                filtered.map((f) => (
                  <Tr
                    key={f.id}
                    onClick={() => onSelectFlat(String(f.id), f.flatNumber)}
                    className="cursor-pointer group hover:bg-slate-50/80 transition-colors"
                  >
                    <Td className="font-semibold text-slate-800">{f.flatNumber}</Td>
                    <Td>{f.blockName}</Td>
                    <Td>{f.bhkType}</Td>
                    <Td>
                      {f.residentName ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{f.residentName}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 italic text-xs">
                          Vacant Flat
                        </span>
                      )}
                    </Td>
                    <Td>
                      <Badge variant={f.meterStatus === "live" ? "live" : "offline"}>
                        <StatusDot status={f.meterStatus} /> {f.meterStatus === "live" ? "Live" : "Offline"}
                      </Badge>
                    </Td>
                    <Td className="font-mono-data font-semibold">{f.mtdKwh?.toFixed(0) ?? "0"} kWh</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {f.residentName && (
                          <button
                            type="button"
                            onClick={() => setResidentToDelete(f)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={`Remove resident ${f.residentName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectFlat(String(f.id), f.flatNumber)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View flat details"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Resident Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(residentToDelete)}
        onClose={() => setResidentToDelete(null)}
        onConfirm={handleDeleteResident}
        title="Remove Resident"
        itemName={residentToDelete ? `${residentToDelete.residentName} (Flat ${residentToDelete.flatNumber})` : undefined}
        description={
          <p>
            Are you sure you want to remove resident{" "}
            <strong>"{residentToDelete?.residentName}"</strong> from{" "}
            <strong>Flat {residentToDelete?.flatNumber}</strong>? The flat will be marked as vacant and user account access will be revoked.
          </p>
        }
        confirmText="Remove Resident"
        dangerNote="The flat and meter telemetry history will be preserved."
      />

      {/* Onboard Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => !addLoading && setShowAddModal(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-in z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">Onboard New Resident</h3>
                  <p className="text-xs text-slate-500">Create user login and assign to flat</p>
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

            <form onSubmit={handleAddResident} className="space-y-4">
              {addError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium animate-fade-in">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resident Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                  <Input
                    required
                    type="email"
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              {flats && flats.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Flat (from Society Flats)</label>
                  <CustomSelect
                    fullWidth
                    size="md"
                    value={form.flatId}
                    onChange={(selectedId) => {
                      const found = flats.find((f) => String(f.id) === selectedId);
                      if (found) {
                        setForm({
                          ...form,
                          flatId: String(found.id),
                          flatNumber: found.flatNumber,
                          blockName: found.blockName,
                          bhkType: found.bhkType || "2BHK",
                        });
                      } else {
                        setForm({ ...form, flatId: "" });
                      }
                    }}
                    placeholder="-- Choose a Flat or enter details below --"
                    options={flats.map((f) => ({
                      value: String(f.id),
                      label: `Flat ${f.flatNumber} (${f.blockName})`,
                      sub: `${f.bhkType}${f.residentName ? ` · Occupied: ${f.residentName}` : " · Vacant"}`,
                    }))}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flat Number *</label>
                  <Input
                    required
                    placeholder="e.g. 402"
                    value={form.flatNumber}
                    onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Block</label>
                  <Input
                    placeholder="Block A"
                    value={form.blockName}
                    onChange={(e) => setForm({ ...form, blockName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BHK Type</label>
                  <CustomSelect
                    fullWidth
                    size="md"
                    value={form.bhkType}
                    onChange={(val) => setForm({ ...form, bhkType: val })}
                    options={["1BHK", "2BHK", "3BHK", "4BHK"]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Initial Password</label>
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 chars, 1 uppercase, 1 digit, 1 special char"
                />
                <p className="text-[11px] text-slate-400 mt-1">The resident can change this password after logging in.</p>
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
                  {addLoading ? "Onboarding..." : "Register Resident"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
