import type {
  BlockFloorRow, BuilderOverview, BuilderSocietyRow, Device, DeviceRow, FlatHourlyProfile, FlatLive,
  FlatSummary, FlatTrend, FloorFlatRow, HeatmapGrid, RegisterDeviceInput, Session,
  SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow, SocietyOverview, TrendPoint, FlatDetail, MeterStatus,
  DailyTrendPoint, HourlyDataPoint, AnomalyItem, SuperAdminOverview, BuilderListItem, CreateSocietyInput,
  CreateBuilderInput, CreateBlockInput, CreateResidentInput
} from "./types";
import api from '../api/api'

// ------------------------------------------------------- Auth ----
export async function login(email: string, password: string): Promise<Session> {

  const response = await api.post("/auth/login", {
    email,
    password
  });

  const data = response.data;

  return {
    token: data.token,
    user: {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      flatId: data.flatId,
      societyId: data.societyId,
      builderId: data.builderId,
    }
  };
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
  const response = await api.patch("/user/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return response.data;
}

export async function getCurrentUser(): Promise<Session["user"]> {
  const response = await api.get("/user/me");
  return response.data;
}

// ------------------------------------------------------- Flat ----
export async function getFlatLive(flatId: string): Promise<FlatLive> {
  const response = await api.get(`/flat/${flatId}/live`);
  const data = response.data;
  return {
    ...data,
    online: Boolean(data.status ?? data.online),
    lastReadingAt: data.lastReadingAt ? new Date(data.lastReadingAt) : undefined,
    timestamp: data.timeStamp ? new Date(data.timeStamp) : (data.timestamp ? new Date(data.timestamp) : undefined),
  };
}

export async function getFlatSummary(flatId: string, monthDate: Date = new Date()): Promise<FlatSummary> {
  const month = monthDate.toISOString().slice(0, 7);
  const response = await api.get(`/flat/${flatId}/summary?month=${month}`);
  return response.data;
}

export async function getFlatTrend(flatId: string): Promise<FlatTrend> {
  const response = await api.get(`/flat/${flatId}/trend`);
  const data = response.data;
  return {
    ...data,
    points: data.points.map((point: TrendPoint) => ({
      ...point,
      date: new Date(point.date),
    })),
  };
}

export async function getFlatHourlyProfile(flatId: string): Promise<FlatHourlyProfile> {
  const response = await api.get(`/flat/${flatId}/hourly-profile`);
  return response.data;
}

export async function getFlatDetail(flatId: string): Promise<FlatDetail> {
  const response = await api.get(`/flat/${flatId}/details`);
  return response.data;
}

function isDemoSession(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem("is_demo_mode") === "true";
}

// ------------------------------------------------------- Society Admin ----
export async function getSocietyOverview(societyId: string): Promise<SocietyOverview> {
  const url = isDemoSession() ? `/demo/society/${societyId}/overview` : `/society/${societyId}/overview`;
  const response = await api.get(url);
  return response.data;
}

export async function getSocietyBlocks(societyId: string): Promise<SocietyBlockRow[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/blocks` : `/society/${societyId}/blocks`;
  const response = await api.get(url);
  return response.data;
}

export async function getBlockFloors(blockId: string): Promise<BlockFloorRow[]> {
  if (isDemoSession()) {
    return [
      { id: "1", floorNumber: 1, flatCount: 8, mtdKwh: 1340 },
      { id: "2", floorNumber: 2, flatCount: 8, mtdKwh: 1420 },
      { id: "3", floorNumber: 3, flatCount: 8, mtdKwh: 1280 },
      { id: "4", floorNumber: 4, flatCount: 8, mtdKwh: 1348 },
    ];
  }
  try {
    const response = await api.get(`/block/${blockId}/floors`);
    return response.data;
  } catch (err) {
    return [];
  }
}

export async function getFloorFlatsList(floorId: string): Promise<FloorFlatRow[]> {
  if (isDemoSession()) {
    return [
      { id: 1, flatNumber: "101", bhkType: "3 BHK", residentName: "Aarav Sharma", meterStatus: "live", mtdKwh: 168 },
      { id: 2, flatNumber: "102", bhkType: "2 BHK", residentName: "Pooja Patel", meterStatus: "live", mtdKwh: 145 },
      { id: 3, flatNumber: "103", bhkType: "3 BHK", residentName: "Rohan Verma", meterStatus: "live", mtdKwh: 182 },
      { id: 4, flatNumber: "104", bhkType: "2 BHK", residentName: null, meterStatus: "offline", mtdKwh: 0 },
    ];
  }
  try {
    const response = await api.get(`/floor/${floorId}/flats`);
    return response.data;
  } catch (err) {
    return [];
  }
}

export async function getSocietyCommonAreas(societyId: string): Promise<SocietyCommonAreaRow[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/common_areas` : `/society/${societyId}/common_areas`;
  const response = await api.get(url);
  return response.data;
}

export async function getSocietyHeatmap(societyId: string, filter?: string): Promise<HeatmapGrid> {
  if (isDemoSession()) {
    return Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: 24 }, (_, h) => {
        const isPeak = h >= 18 && h <= 22;
        const isNight = h >= 0 && h <= 5;
        const base = isNight ? 12 : isPeak ? 68 : 34;
        const jitter = Math.floor(Math.sin(d + h) * 10);
        return Math.max(5, base + jitter);
      })
    );
  }
  try {
    const params = filter && filter !== "Whole society" && filter !== "All societies" ? { filter } : {};
    const response = await api.get(`/society/${societyId}/heatmap`, { params });
    return response.data;
  } catch (err) {
    return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => -1));
  }
}

export async function getSocietyHourlyBreakdown(societyId: string, filter?: string, date?: string): Promise<HourlyDataPoint[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/hourly-breakdown` : `/society/${societyId}/hourly-breakdown`;
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (filter && filter !== "Whole society" && filter !== "All societies") params.filter = filter;
  const response = await api.get(url, { params });
  return (response.data ?? []).map((d: any) => ({
    hour: d.hour,
    base: d.base ?? d.baseKwh ?? 0,
    society: d.society ?? d.societyKwh ?? 0,
    common: d.common ?? d.commonAreaKwh ?? 0,
    peak: d.peak ?? d.peekKwh ?? 0,
  }));
}

export async function getSocietyAnomalies(societyId: string, filter?: string): Promise<AnomalyItem[]> {
  try {
    const params = filter && filter !== "Whole society" && filter !== "All societies" ? { filter } : {};
    const response = await api.get(`/society/${societyId}/anomalies`, { params });
    const data = response.data;
    const list: any[] = Array.isArray(data) ? data : (data?.anomalies ?? []);
    return list.map((a: any, idx: number) => ({
      id: a.id ? String(a.id) : `anom-${idx + 1}`,
      flat: a.flat || (a.flatNumber ? `Flat ${a.flatNumber}` : a.blockName ? `${a.blockName}` : `Anomaly #${idx + 1}`),
      flatNumber: a.flatNumber,
      blockName: a.blockName,
      currentKw: a.currentKw,
      expectedKw: a.expectedKw,
      multiplier: a.multiplier || "2.5x usual",
      desc: a.desc || a.description || `Drawing ${a.currentKw ?? 4.2} kW — expected ${a.expectedKw ?? 1.5} kW`,
      detectedAt: a.detectedAt ? new Date(a.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
      resolved: Boolean(a.resolved),
    }));
  } catch (err) {
    console.warn("Backend anomalies API not yet available, falling back to empty list:", err);
    return [];
  }
}

export async function getSocietyDailyTrend(societyId: string, days: number = 7): Promise<DailyTrendPoint[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/daily-trend` : `/society/${societyId}/daily-trend`;
  const response = await api.get(url, { params: { days } });
  return (response.data ?? []).map((d: any) => ({
    date: d.date,
    total: d.total ?? d.totalKwh ?? 0,
    totalKwh: d.totalKwh ?? d.total ?? 0,
    common: d.common ?? d.commonAreaKwh ?? 0,
    commonAreaKwh: d.commonAreaKwh ?? d.common ?? 0,
  }));
}

export async function getSocietyFlatsList(societyId: string, { search = "", sortBy = "flatNumber" }:
  { search?: string; sortBy?: "flatNumber" | "mtdKwh" } = {}): Promise<SocietyFlatRow[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/flats` : `/society/${societyId}/flats`;
  const response = await api.get(url, { params: { search, sortBy } });
  return response.data;
}

// ------------------------------------------------------- Builder Admin ----
export async function getBuilderOverview(builderId: string): Promise<BuilderOverview> {
  const response = await api.get(`/builder/${builderId}/overview`);
  return response.data;
}

export async function getBuilderSocieties(builderId: string): Promise<BuilderSocietyRow[]> {
  const response = await api.get(`/builder/${builderId}/societies`);
  return response.data;
}

export async function getBuilderHourlyBreakdown(builderId: string, date?: string): Promise<HourlyDataPoint[]> {
  const params = date ? { date } : {};
  const response = await api.get(`/builder/${builderId}/hourly-breakdown`, { params });
  return (response.data ?? []).map((d: any) => ({
    hour: d.hour,
    base: d.base ?? d.baseKwh ?? 0,
    society: d.society ?? d.societyKwh ?? 0,
    common: d.common ?? d.commonAreaKwh ?? 0,
    peak: d.peak ?? d.peekKwh ?? 0,
  }));
}

// ------------------------------------------------------ Device Manager ----
export async function getSocietyDevices(societyId: string): Promise<DeviceRow[]> {
  const url = isDemoSession() ? `/demo/devices` : `/society/${societyId}/devices`;
  const response = await api.get(url);
  const data = response.data;
  return data.map((point: any, index: number) => ({
    ...point,
    id: point.id ? String(point.id) : point.deviceSerial ? `MTR-${point.deviceSerial}` : point.deviceId ? `DEV-${point.deviceId}` : `MTR-${index + 1}`,
    status: point.status || (point.isActive ? "live" : "offline"),
    mappedTo: point.mappedTo || point.commonAreaName || (point.flatNumber ? `Flat ${point.flatNumber}` : "Unassigned"),
    lastSeenAt: point.lastSeenAt ? new Date(point.lastSeenAt) : new Date(),
  }));
}

export async function registerDevice({ deviceSerial, deviceType, mappedTo, societyId, flatId, commonAreaId }: RegisterDeviceInput): Promise<Device> {
  const serialNumber = Number(deviceSerial.replace(/\D/g, "")) || 10001;
  const response = await api.post(`/society/${societyId}/register-device`, {
    deviceSerial: serialNumber,
    deviceType: deviceType === "Flat Meter" ? "FLAT_METER" : "COMMON_AREA_METER",
    flatId: flatId || null,
    commonAreaId: commonAreaId || null,
    societyId: Number(societyId),
  });
  return response.data;
}

export async function deregisterDevice(deviceId: string): Promise<{ id: string; deregistered: boolean }> {
  const response = await api.delete(`/device/${deviceId}`);
  return response.data;
}

// -------------------------------------------------------- Super Admin ----
export async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  const response = await api.get("/superAdmin/overview");
  return response.data;
}

export async function getAllBuilders(): Promise<BuilderListItem[]> {
  const response = await api.get("/superAdmin/builders");
  return response.data ?? [];
}

export async function createSociety(input: CreateSocietyInput): Promise<any> {
  const response = await api.post(`/builder/${input.builderId}/society`, input);
  return response.data;
}

export async function createBuilder(input: CreateBuilderInput): Promise<any> {
  const response = await api.post("/superAdmin/builders", input);
  return response.data;
}

export async function createBlock(input: CreateBlockInput): Promise<any> {
  const response = await api.post(`/society/${input.societyId}/block`, input);
  return response.data;
}

export async function registerResident(input: CreateResidentInput): Promise<any> {
  const response = await api.post(`/society/${input.societyId}/resident`, input);
  return response.data;
}

export const createResident = registerResident;

// -------------------------------------------------------- Deletion APIs ----
export async function deleteResident(societyId: string | number, residentId: string | number): Promise<any> {
  const response = await api.delete(`/society/${societyId}/resident/${residentId}`);
  return response.data;
}

export async function deleteBlock(societyId: string | number, blockId: string | number): Promise<any> {
  const response = await api.delete(`/society/${societyId}/block/${blockId}`);
  return response.data;
}

export async function deleteSociety(builderId: string | number, societyId: string | number): Promise<any> {
  const response = await api.delete(`/builder/${builderId}/society/${societyId}`);
  return response.data;
}

export async function deleteBuilder(builderId: string | number): Promise<any> {
  const response = await api.delete(`/superAdmin/builders/${builderId}`);
  return response.data;
}


