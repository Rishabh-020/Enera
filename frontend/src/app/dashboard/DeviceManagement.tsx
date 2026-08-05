import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LayoutGrid, Cpu, Plus, Trash2 } from "lucide-react";
import * as api from "../../lib/api";
import { db } from "../../lib/mockData";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { timeAgo } from "../../lib/utils";
import {
  Card, CardHeader, CardTitle, CardDescription, Button, Input, Select,
  Table, Thead, Th, Td, Tr, StatusDot, Badge,
} from "../../components/ui/primitives";
import type { DeviceRow, DeviceType, MeterStatus } from "../../lib/types";

const STATUS_LABEL: Record<MeterStatus, string> = { live: "Live", offline: "Offline", "offline-long": "Offline", deregistered: "Deregistered" };
const STATUS_BADGE: Record<MeterStatus, "live" | "amber" | "high" | "neutral"> = { live: "live", offline: "amber", "offline-long": "high", deregistered: "neutral" };

interface DeviceForm {
  deviceSerial: string;
  deviceType: DeviceType;
  mappedTo: string;
}

export default function DeviceManagement() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const society = db.societyById.get(societyId ?? "");

  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState<DeviceForm>({ deviceSerial: "", deviceType: "Flat Meter", mappedTo: "" });

  function refresh() {
    if (!societyId) return;
    api.getSocietyDevices(societyId).then(setDevices);
  }

  useEffect(refresh, [societyId]);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await api.registerDevice({ ...form, societyId: societyId! });
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
      ? (society?.flats.map((f) => f.flatNumber) ?? [])
      : (society?.commonAreas.map((c) => c.name) ?? []);

  return (
    <DashboardLayout
      nav={[
        { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> },
        { key: "devices", label: "Devices", icon: <Cpu size={16} /> },
      ]}
      activeKey="devices"
      onNav={(key) => key === "dashboard" && navigate(`/society/${societyId}`)}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Device management</p>
          <h1 className="font-display text-2xl font-bold text-grid-900">{society?.name}</h1>
        </div>
        <Button variant="amber" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Register meter
        </Button>
      </div>

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
              {mappedOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
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
                <Th>Type</Th>
                <Th>Mapped to</Th>
                <Th>Status</Th>
                <Th>Last reading</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {(devices ?? []).map((d) => (
                <Tr key={d.id}>
                  <Td className="font-mono-data font-medium text-grid-900">{d.id}</Td>
                  <Td>{d.deviceType}</Td>
                  <Td>{d.mappedTo}</Td>
                  <Td>
                    <Badge variant={STATUS_BADGE[d.status]}>
                      <StatusDot status={d.status} /> {STATUS_LABEL[d.status]}
                    </Badge>
                  </Td>
                  <Td>{timeAgo(d.lastSeenAt)}</Td>
                  <Td>
                    {confirmId === d.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Stop reporting? History is kept.</span>
                        <Button size="sm" variant="danger" onClick={() => handleDeregister(d.id)}>Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(d.id)} className="text-slate-400 hover:text-high-500">
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
