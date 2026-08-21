import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_SOCIETY } from "../../components/layout/DashboardLayout";
import { timeAgo } from "../../lib/utils";
import {
  Card, CardHeader, CardTitle, CardDescription, Button, Input, Select,
  Table, Thead, Th, Td, Tr, StatusDot, Badge, SearchBar,
} from "../../components/ui/primitives";
import type { DeviceRow, DeviceType, MeterStatus, SocietyFlatRow, SocietyCommonAreaRow } from "../../lib/types";
import { useWebSocketReading } from "../../context/WebSocketContext";

const STATUS_LABEL: Record<MeterStatus, string> = {
  live: "Live",
  offline: "Offline", "offline-long": "Offline",
  deregistered: "Deregistered"
};
const STATUS_BADGE: Record<MeterStatus, "live" | "amber" | "high" | "neutral"> = {
  live: "live",
  offline: "amber", "offline-long": "high",
  deregistered: "neutral"
};

interface DeviceForm {
  deviceSerial: string;
  deviceType: DeviceType;
  mappedTo: string;
}

export default function DeviceManagement() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();

  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [flats, setFlats] = useState<SocietyFlatRow[]>([]);
  const [commonAreas, setCommonAreas] = useState<SocietyCommonAreaRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState<DeviceForm>({ deviceSerial: "", deviceType: "Flat Meter", mappedTo: "" });

  const { latestReading, isConnected } = useWebSocketReading();

  function refresh() {
    if (!societyId) return;
    api.getSocietyDevices(societyId).then(setDevices);
  }

  useEffect(refresh, [societyId]);

  useEffect(() => {
    if (societyId) {
      api.getSocietyFlatsList(societyId).then(setFlats).catch(() => { });
      api.getSocietyCommonAreas(societyId).then(setCommonAreas).catch(() => { });
    }
  }, [societyId]);

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
    setError("");
    try {
      let flatId: number | null | string = null;
      let commonAreaId: number | null = null;

      if (form.deviceType === "Flat Meter") {
        const found = flats.find((f) => f.flatNumber === form.mappedTo);
        if (found) flatId = found.id;
      } else {
        const found = commonAreas.find((c) => c.name === form.mappedTo || c.category === form.mappedTo);
        if (found) commonAreaId = Number(found.id);
      }

      await api.registerDevice({ ...form, societyId: societyId!, flatId, commonAreaId });
      setShowForm(false);
      setForm({ deviceSerial: "", deviceType: "Flat Meter", mappedTo: "" });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleDeregister(id: string) {
    await api.deregisterDevice(id);
    setConfirmId(null);
    refresh();
  }

  const mappedOptions =
    form.deviceType === "Flat Meter"
      ? flats.map((f) => f.flatNumber)
      : commonAreas.map((c) => c.name || c.category);

  // Compute summary counts
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-grid-900">Devices</h1>
          <p className="text-sm text-slate-500">{devices?.length ?? "…"} meters · {onlineCount} online</p>
        </div>
        <Button variant="teal" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Register meter
        </Button>
      </div>

      {/* Register form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <div>
              <CardTitle>Register new meter</CardTitle>
              <CardDescription>Enter the device serial, type, and what it's mapped to</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleRegister} className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3">
            <Input
              placeholder="Device ID e.g. MTR-B4-201"
              value={form.deviceSerial}
              onChange={(e) => setForm({ ...form, deviceSerial: e.target.value })}
              required
            />
            <Select
              value={form.deviceType}
              onChange={(e) => setForm({ ...form, deviceType: e.target.value as DeviceType, mappedTo: "" })}
            >
              <option>Flat Meter</option>
              <option>Common Area Meter</option>
            </Select>
            <Select value={form.mappedTo} onChange={(e) => setForm({ ...form, mappedTo: e.target.value })} required>
              <option value="">Mapped to…</option>
              {mappedOptions.map((o, idx) => (
                <option key={`${o}-${idx}`} value={o}>{o}</option>
              ))}
            </Select>
            {error && <p className="sm:col-span-3 text-xs font-medium text-high-500">{error}</p>}
            <div className="sm:col-span-3 flex gap-2">
              <Button type="submit">Register device</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="flex flex-col items-center justify-center py-5">
          <p className="font-mono-data text-3xl font-bold text-live-500">{onlineCount}</p>
          <p className="text-xs text-slate-500 mt-1">Online</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-5">
          <p className="font-mono-data text-3xl font-bold text-warn-500">{intermittentCount}</p>
          <p className="text-xs text-slate-500 mt-1">Intermittent</p>
        </Card>
        <Card className="flex flex-col items-center justify-center py-5">
          <p className="font-mono-data text-3xl font-bold text-high-500">{offlineCount}</p>
          <p className="text-xs text-slate-500 mt-1">Offline</p>
        </Card>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <SearchBar
          placeholder="Search by device ID or flat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          shortcut="/"
        />
      </div>

      {/* Devices table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Registered devices</CardTitle>
            <CardDescription>{devices?.length ?? "…"} devices across flats and common areas</CardDescription>
          </div>
        </CardHeader>
        <div className="px-5 pb-5 pt-2">
          <Table>
            <Thead>
              <tr>
                <Th>Device ID</Th>
                <Th>Mapped to</Th>
                <Th>Status</Th>
                <Th>Current</Th>
                <Th>Uptime</Th>
                <Th>Last seen</Th>
                <Th>Action</Th>
              </tr>
            </Thead>
            <tbody>
              {(filteredDevices ?? []).map((d, index) => (
                <Tr key={d.id || `dev-row-${index}`}>
                  <Td className="font-mono-data font-medium text-slate-500">{d.id}</Td>
                  <Td className="font-semibold text-grid-900">{d.mappedTo}</Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[d.status]}>
                      <StatusDot status={d.status} /> {STATUS_LABEL[d.status]}
                    </Badge>
                  </Td>
                  <Td className="font-mono-data">
                    {d.status === "live" ? `${(Math.random() * 3 + 0.5).toFixed(1)} kW` : "—"}
                  </Td>
                  <Td className="font-mono-data">
                    {d.status === "live" ? `${(95 + Math.random() * 5).toFixed(1)}%` : `${(80 + Math.random() * 15).toFixed(1)}%`}
                  </Td>
                  <Td className="text-slate-500">{timeAgo(d.lastSeenAt)}</Td>
                  <Td>
                    {d.status !== "live" ? (
                      <button className="text-xs font-medium text-teal-600 hover:text-teal-500 cursor-pointer">
                        <RefreshCw size={13} className="inline mr-1" />Re-check
                      </button>
                    ) : confirmId === d.id ? (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="danger" onClick={() => handleDeregister(d.id)}>Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(d.id)} className="text-slate-400 hover:text-high-500 cursor-pointer">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
