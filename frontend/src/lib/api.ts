import type {
  BlockFloorRow, BuilderOverview, BuilderSocietyRow, Device, DeviceRow, FlatHourlyProfile, FlatLive,
  FlatSummary, FlatTrend, FloorFlatRow, HeatmapGrid, RegisterDeviceInput, Session,
  SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow, SocietyOverview, TrendPoint, FlatDetail, MeterStatus,
  DailyTrendPoint, HourlyDataPoint
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

// ------------------------------------------------------- Flat ----
export async function getFlatLive(flatId: string): Promise<FlatLive> {
  const response = await api.get(`/flat/${flatId}/live`);
  const data = response.data;
  return {
    ...data,
    lastReadingAt: data.lastReadingAt ? new Date(data.lastReadingAt) : undefined,
    timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
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
  const response = await api.get(`/block/${blockId}/floors`);
  return response.data;
}

export async function getFloorFlatsList(floorId: string): Promise<FloorFlatRow[]> {
  const response = await api.get(`/floor/${floorId}/flats`);
  return response.data;
}

export async function getSocietyCommonAreas(societyId: string): Promise<SocietyCommonAreaRow[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/common_areas` : `/society/${societyId}/common_areas`;
  const response = await api.get(url);
  return response.data;
}

export async function getSocietyHeatmap(societyId: string): Promise<HeatmapGrid> {
  const response = await api.get(`/society/${societyId}/heatmap`);
  return response.data;
}

export async function getSocietyHourlyBreakdown(societyId: string, date?: string): Promise<HourlyDataPoint[]> {
  const url = isDemoSession() ? `/demo/society/${societyId}/hourly-breakdown` : `/society/${societyId}/hourly-breakdown`;
  const params = date ? { date } : {};
  const response = await api.get(url, { params });
  return (response.data ?? []).map((d: any) => ({
    hour: d.hour,
    base: d.base ?? d.baseKwh ?? 0,
    society: d.society ?? d.societyKwh ?? 0,
    common: d.common ?? d.commonAreaKwh ?? 0,
    peak: d.peak ?? d.peekKwh ?? 0,
  }));
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

export async function registerDevice({ deviceSerial, deviceType, mappedTo, societyId }: RegisterDeviceInput): Promise<Device> {
  const response = await api.post(
    `/society/${societyId}/register-device?deviceId=${deviceSerial}&deviceType=${deviceType}&mappedTo=${mappedTo}`
  );
  return response.data;
}

export async function deregisterDevice(deviceId: string): Promise<{ id: string; deregistered: boolean }> {
  const response = await api.delete(`/device/${deviceId}`);
  return response.data;
}
