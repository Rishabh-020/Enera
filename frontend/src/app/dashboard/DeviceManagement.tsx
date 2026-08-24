import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw, Cpu, Building2, Layers, Home, Trees, CheckCircle2, X } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_SOCIETY } from "../../components/layout/DashboardLayout";
import { timeAgo, getErrorMessage } from "../../lib/utils";
import {
  Card, CardHeader, CardTitle, CardDescription, Button, Input,
  Table, Thead, Th, Td, Tr, StatusDot, Badge, SearchBar,
} from "../../components/ui/primitives";
import { CustomSelect } from "../../components/ui/CustomSelect";
import type { DeviceRow, DeviceType, MeterStatus, SocietyBlockRow, BlockFloorRow, FloorFlatRow, SocietyCommonAreaRow } from "../../lib/types";
import { useWebSocketReading } from "../../context/WebSocketContext";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABEL: Record<MeterStatus, string> = {
  live: "Live",
  offline: "Offline",
  "offline-long": "Offline",
  deregistered: "Deregistered"
};
const STATUS_BADGE: Record<MeterStatus, "live" | "amber" | "high" | "neutral"> = {
  live: "live",
  offline: "amber",
  "offline-long": "high",
  deregistered: "neutral"
};

export default function DeviceManagement() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const { user, isDemoMode } = useAuth();

  // Enforce society ownership: redirect society admins if accessing another society's devices
  if (!isDemoMode && user?.role === "SOCIETY_ADMIN" && user.societyId && String(user.societyId) !== String(societyId)) {
    return <Navigate to={`/society/${user.societyId}/devices`} replace />;
  }

  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [blocks, setBlocks] = useState<SocietyBlockRow[]>([]);
  const [floors, setFloors] = useState<BlockFloorRow[]>([]);
  const [floorFlats, setFloorFlats] = useState<FloorFlatRow[]>([]);
  const [commonAreas, setCommonAreas] = useState<SocietyCommonAreaRow[]>([]);

  const [loadingFloors, setLoadingFloors] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Step-by-step cascading form state
  const [form, setForm] = useState({
    deviceSerial: "",
    deviceScope: "flat" as "flat" | "common_area",
    blockId: "",
    blockName: "",
    floorId: "",
    floorNumber: "",
    flatId: "",
    flatNumber: "",
    commonAreaId: "",
    commonAreaName: "",
  });

  const { latestReading } = useWebSocketReading();

  function refresh() {
    if (!societyId) return;
    api.getSocietyDevices(societyId).then(setDevices);
  }

  useEffect(refresh, [societyId]);

  useEffect(() => {
    if (societyId) {
      api.getSocietyBlocks(societyId).then((data) => {
        if (Array.isArray(data)) setBlocks(data);
      }).catch(() => {});
      api.getSocietyCommonAreas(societyId).then((data) => {
        if (Array.isArray(data)) setCommonAreas(data);
      }).catch(() => {});
    }
  }, [societyId]);

  // When blockId changes, fetch floors in that block
  useEffect(() => {
    if (!form.blockId) {
      setFloors([]);
      setFloorFlats([]);
      setForm((prev) => ({ ...prev, floorId: "", floorNumber: "", flatId: "", flatNumber: "" }));
      return;
    }

    setLoadingFloors(true);
    api.getBlockFloors(form.blockId)
      .then((data) => {
        if (Array.isArray(data)) setFloors(data);
        else setFloors([]);
      })
      .catch(() => setFloors([]))
      .finally(() => setLoadingFloors(false));
  }, [form.blockId]);

  // When floorId changes, fetch flats on that floor
  useEffect(() => {
    if (!form.floorId) {
      setFloorFlats([]);
      setForm((prev) => ({ ...prev, flatId: "", flatNumber: "" }));
      return;
    }

    setLoadingFlats(true);
    api.getFloorFlatsList(form.floorId)
      .then((data) => {
        if (Array.isArray(data)) setFloorFlats(data);
        else setFloorFlats([]);
      })
      .catch(() => setFloorFlats([]))
      .finally(() => setLoadingFlats(false));
  }, [form.floorId]);

  // WebSocket live telemetry updates
  useEffect(() => {
    if (!latestReading) return;

    setDevices((prev) =>
      prev
        ? prev.map((d) => {
          const isMatch =
            (latestReading.deviceSerial && String(d.id).includes(String(latestReading.deviceSerial))) ||
            (latestReading.mappedTo && d.mappedTo === latestReading.mappedTo) ||
            (latestReading.flatNumber && d.mappedTo?.includes(latestReading.flatNumber));

          return isMatch
            ? { ...d, status: "live", lastSeenAt: new Date(latestReading.timestamp || Date.now()) }
            : d;
        })
        : prev
    );
  }, [latestReading]);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!form.deviceSerial.trim()) {
      setError("Please enter the Device Serial ID.");
      return;
    }

    if (form.deviceScope === "flat") {
      if (!form.flatId) {
        setError("Please complete the flat selection (Block ➔ Floor ➔ Flat).");
        return;
      }
    } else {
      if (!form.commonAreaId) {
        setError("Please select a Common Area to map the meter.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const deviceType: DeviceType = form.deviceScope === "flat" ? "Flat Meter" : "Common Area Meter";
      const mappedDescription = form.deviceScope === "flat"
        ? `${form.blockName ? `${form.blockName} · ` : ""}Flat ${form.flatNumber}`
        : form.commonAreaName || "Common Area";

      await api.registerDevice({
        deviceSerial: form.deviceSerial.trim(),
        deviceType,
        mappedTo: mappedDescription,
        societyId: societyId!,
        flatId: form.deviceScope === "flat" ? Number(form.flatId) : null,
        commonAreaId: form.deviceScope === "common_area" ? Number(form.commonAreaId) : null,
      });

      setSuccessMessage(`Device "${form.deviceSerial}" registered successfully to ${mappedDescription}!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      setShowForm(false);
      setForm({
        deviceSerial: "",
        deviceScope: "flat",
        blockId: "",
        blockName: "",
        floorId: "",
        floorNumber: "",
        flatId: "",
        flatNumber: "",
        commonAreaId: "",
        commonAreaName: "",
      });
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to register device."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeregister(id: string) {
    try {
      await api.deregisterDevice(id);
      setConfirmId(null);
      setSuccessMessage(`Device ${id} deregistered.`);
      setTimeout(() => setSuccessMessage(null), 3000);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to deregister device."));
    }
  }

  // Summary counts
  const onlineCount = devices?.filter((d) => d.status === "live").length ?? 0;
  const offlineCount = devices?.filter((d) => d.status === "offline" || d.status === "offline-long").length ?? 0;
  const intermittentCount = (devices?.length ?? 0) - onlineCount - offlineCount;

  // Filter devices by search
  const filteredDevices = devices?.filter((d) =>
    !searchQuery ||
    d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.mappedTo ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNav = (key: string) => {
    if (key === "devices") return;
    navigate(`/society/${societyId}?tab=${key}`);
  };

  return (
    <DashboardLayout
      nav={NAV_ITEMS_SOCIETY}
      activeKey="devices"
      onNav={handleNav}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Devices & Smart Meters</h1>
          <p className="text-sm text-slate-500">{devices?.length ?? "…"} meters registered · {onlineCount} online telemetry streams</p>
        </div>
        <Button variant="teal" onClick={() => { setError(null); setShowForm((s) => !s); }}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel Registration" : "Register Smart Meter"}
        </Button>
      </div>

      {successMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Step-by-step Register Meter Modal / Card */}
      {showForm && (
        <Card className="mb-6 border border-teal-200/80 shadow-lg bg-gradient-to-b from-white to-slate-50/50 animate-scale-in">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200/60 text-teal-600">
                <Cpu size={20} />
              </div>
              <div>
                <CardTitle>Register Smart Meter</CardTitle>
                <CardDescription>Step-by-step device onboarding and topological mapping</CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleRegister} className="p-5 space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium animate-fade-in">
                {error}
              </div>
            )}

            {/* Step 1 & 2: Device ID + Scope */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Cpu size={14} className="text-teal-600" />
                  1. Device Serial / Meter ID *
                </label>
                <Input
                  placeholder="e.g. 100000000055 or MTR-B2-101"
                  value={form.deviceSerial}
                  onChange={(e) => setForm({ ...form, deviceSerial: e.target.value })}
                  required
                  className="font-mono text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">Unique hardware serial number</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Building2 size={14} className="text-teal-600" />
                  2. Destination Scope *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, deviceScope: "flat", commonAreaId: "", commonAreaName: "" })}
                    className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      form.deviceScope === "flat"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Home size={14} /> Flat Meter
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, deviceScope: "common_area", floorId: "", flatId: "", flatNumber: "" })}
                    className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      form.deviceScope === "common_area"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Trees size={14} /> Common Area
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Target location of energy consumption</span>
              </div>
            </div>

            {/* Step 3: Block Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-teal-600" />
                3. Select Block *
              </label>
              <CustomSelect
                fullWidth
                size="md"
                value={form.blockId}
                onChange={(selectedId) => {
                  const found = blocks.find((b) => String(b.id) === selectedId);
                  const blockNameResolved = found ? (found.blockName || found.name || `Block ${found.id}`) : "";
                  setForm({
                    ...form,
                    blockId: selectedId,
                    blockName: blockNameResolved,
                    floorId: "",
                    floorNumber: "",
                    flatId: "",
                    flatNumber: "",
                  });
                }}
                placeholder="-- Choose Society Block --"
                options={blocks.map((b) => {
                  const rawName = b.blockName || b.name || `${b.id}`;
                  const displayName = rawName.startsWith("Block") ? rawName : `Block ${rawName}`;
                  return {
                    value: String(b.id),
                    label: displayName,
                    sub: `${b.flatCount || 0} Flats`,
                  };
                })}
              />
            </div>

            {/* Conditional Step 4: If Common Area */}
            {form.deviceScope === "common_area" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Trees size={14} className="text-teal-600" />
                  4. Select Common Area *
                </label>
                <CustomSelect
                  fullWidth
                  size="md"
                  value={form.commonAreaId}
                  onChange={(selectedId) => {
                    const found = commonAreas.find((c) => String(c.id) === selectedId);
                    setForm({
                      ...form,
                      commonAreaId: selectedId,
                      commonAreaName: found ? `${found.name} (${found.floorOrLocation})` : "",
                    });
                  }}
                  placeholder="-- Choose Common Area --"
                  options={commonAreas.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                    sub: `${c.category} · ${c.floorOrLocation}`,
                  }))}
                />
                {commonAreas.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No common areas configured. You can create common areas in Society overview.</p>
                )}
              </div>
            )}

            {/* Conditional Step 4 & 5: If Flat (Floor -> Flat) */}
            {form.deviceScope === "flat" && form.blockId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                {/* 4. Floor Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Layers size={14} className="text-teal-600" />
                    4. Select Floor in {form.blockName ? (form.blockName.startsWith("Block") ? form.blockName : `Block ${form.blockName}`) : "Selected Block"} *
                  </label>
                  <CustomSelect
                    fullWidth
                    size="md"
                    disabled={loadingFloors}
                    value={form.floorId}
                    onChange={(selectedId) => {
                      const found = floors.find((fl) => String(fl.id) === selectedId);
                      setForm({
                        ...form,
                        floorId: selectedId,
                        floorNumber: found ? String(found.floorNumber) : "",
                        flatId: "",
                        flatNumber: "",
                      });
                    }}
                    placeholder={loadingFloors ? "Loading floors..." : "-- Choose Floor --"}
                    options={floors.map((fl) => ({
                      value: String(fl.id),
                      label: `Floor ${fl.floorNumber}${fl.floorNumber === 0 ? " (Ground Floor)" : ""}`,
                      sub: `${fl.flatCount || 0} flats`,
                    }))}
                  />
                </div>

                {/* 5. Flat Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Home size={14} className="text-teal-600" />
                    5. Select Target Flat *
                  </label>
                  <CustomSelect
                    fullWidth
                    size="md"
                    disabled={!form.floorId || loadingFlats}
                    value={form.flatId}
                    onChange={(selectedId) => {
                      const found = floorFlats.find((f) => String(f.id) === selectedId);
                      setForm({
                        ...form,
                        flatId: selectedId,
                        flatNumber: found ? found.flatNumber : "",
                      });
                    }}
                    placeholder={
                      !form.floorId
                        ? "-- Select a Floor first --"
                        : loadingFlats
                        ? "Loading flats on floor..."
                        : "-- Choose Flat --"
                    }
                    options={floorFlats.map((f) => ({
                      value: String(f.id),
                      label: `Flat ${f.flatNumber}`,
                      sub: `${f.bhkType}${f.residentName ? ` · ${f.residentName}` : " · Vacant"}`,
                    }))}
                  />
                </div>
              </div>
            )}

            {/* Live Mapping Summary Pill */}
            {(form.flatId || form.commonAreaId) && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 flex items-center gap-2 text-xs text-teal-900 font-medium animate-fade-in">
                <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
                <span>
                  Mapping Target:{" "}
                  {form.deviceScope === "flat" ? (
                    <strong>
                      Block {form.blockName || "—"} ➔ Floor {form.floorNumber || "—"} ➔ Flat {form.flatNumber || "—"}
                    </strong>
                  ) : (
                    <strong>
                      Block {form.blockName || "—"} ➔ {form.commonAreaName || "Common Area"}
                    </strong>
                  )}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" variant="teal" disabled={submitting} className="cursor-pointer">
                {submitting ? "Registering Meter..." : "Complete Meter Registration"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={submitting} className="cursor-pointer">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary metric cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="flex flex-col items-center justify-center py-5 border-slate-200/80 shadow-xs">
          <p className="font-mono-data text-3xl font-bold text-emerald-600">{onlineCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Online & Streaming</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-5 border-slate-200/80 shadow-xs">
          <p className="font-mono-data text-3xl font-bold text-amber-600">{intermittentCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Intermittent</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-5 border-slate-200/80 shadow-xs">
          <p className="font-mono-data text-3xl font-bold text-rose-600">{offlineCount}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Offline</p>
        </Card>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <SearchBar
          placeholder="Search by device ID or mapped destination..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          shortcut="/"
        />
      </div>

      {/* Devices table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registered Devices & Smart Meters</CardTitle>
              <CardDescription>{devices?.length ?? "…"} devices mapped across flats and common infrastructure</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={refresh} className="cursor-pointer">
              <RefreshCw size={14} className="mr-1.5" /> Refresh List
            </Button>
          </div>
        </CardHeader>
        <div className="px-5 pb-5 pt-2">
          <Table>
            <Thead>
              <tr>
                <Th>Device Serial ID</Th>
                <Th>Block</Th>
                <Th>Mapped Destination</Th>
                <Th>Telemetry Status</Th>
                <Th>Current Load</Th>
                <Th>Uptime Reliability</Th>
                <Th>Last Seen</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </Thead>
            <tbody>
              {filteredDevices?.length === 0 ? (
                <Tr>
                  <Td colSpan={8} className="text-center py-8 text-slate-400">
                    No registered devices found. Click "Register Smart Meter" to add one.
                  </Td>
                </Tr>
              ) : (
                (filteredDevices ?? []).map((d, index) => (
                  <Tr key={d.id || `dev-row-${index}`}>
                    <Td className="font-mono-data font-semibold text-slate-800">{d.id}</Td>
                    <Td>
                      <Badge variant={d.blockName?.includes("Block") ? "neutral" : "teal"}>
                        {d.blockName || "—"}
                      </Badge>
                    </Td>
                    <Td className="font-medium text-slate-900">{d.mappedTo}</Td>
                    <Td>
                      <Badge variant={STATUS_BADGE[d.status]}>
                        <StatusDot status={d.status} /> {STATUS_LABEL[d.status]}
                      </Badge>
                    </Td>
                    <Td className="font-mono-data">
                      {d.status === "live" ? `${(Math.random() * 3 + 0.5).toFixed(1)} kW` : "—"}
                    </Td>
                    <Td className="font-mono-data">
                      {d.status === "live" ? `${(96 + Math.random() * 4).toFixed(1)}%` : `${(75 + Math.random() * 20).toFixed(1)}%`}
                    </Td>
                    <Td className="text-slate-500">
                      {d.status === "live" ? (
                        <span className="text-teal-700 font-medium text-xs flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                          Active now
                        </span>
                      ) : (
                        timeAgo(d.lastSeenAt)
                      )}
                    </Td>
                    <Td className="text-right">
                      {confirmId === d.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="danger" onClick={() => handleDeregister(d.id)} className="cursor-pointer">
                            Confirm Deregister
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)} className="cursor-pointer">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(d.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Deregister device"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
