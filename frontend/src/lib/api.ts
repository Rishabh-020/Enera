import type {
  BlockFloorRow, BuilderOverview, BuilderSocietyRow, DeviceRow, FlatHourlyProfile, FlatLive,
  FlatSummary, FlatTrend, FloorFlatRow, HeatmapGrid, RegisterDeviceInput, Session,
  SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow, SocietyOverview, FlatDetail,
  DailyTrendPoint, HourlyDataPoint, AnomalyItem, SuperAdminOverview, BuilderListItem,
  CreateBuilderInput, CreateBlockInput, CreateResidentInput
} from "./types";
import api from '../api/api';

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

export async function demoLogin(): Promise<Session> {
  const response = await api.post("/auth/demo-login");
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
  try {
    const response = await api.get(`/flat/${flatId}/live`);
    const data = response.data || {};
    return {
      ...data,
      kw: Number(data.kw) || 0,
      online: Boolean(data.status ?? data.online),
      lastReadingAt: data.lastReadingAt ? new Date(data.lastReadingAt) : undefined,
      timestamp: data.timeStamp ? new Date(data.timeStamp) : (data.timestamp ? new Date(data.timestamp) : undefined),
    };
  } catch {
    return { kw: 0, online: false, level: "normal", pctVsUsual: 0 };
  }
}

export async function getFlatSummary(flatId: string, monthDate: Date = new Date()): Promise<FlatSummary> {
  try {
    const month = monthDate.toISOString().slice(0, 7);
    const response = await api.get(`/flat/${flatId}/summary?month=${month}`);
    return response.data || null;
  } catch {
    return null as any;
  }
}

export async function getFlatTrend(flatId: string): Promise<FlatTrend> {
  try {
    const response = await api.get(`/flat/${flatId}/trend`);
    const data = response.data || {};
    const pts = Array.isArray(data.points) ? data.points : [];
    return {
      ...data,
      pctChange: Number(data.pctChange) || 0,
      points: pts.map((point: any) => ({
        ...point,
        date: new Date(point.date),
      })),
    };
  } catch {
    return { points: [], pctChange: 0 };
  }
}

export async function getFlatHourlyProfile(flatId: string, date?: string): Promise<FlatHourlyProfile> {
  try {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    const response = await api.get(`/flat/${flatId}/hourly-profile`, { params });
    return response.data || { profile: [] };
  } catch (err) {
    return { profile: [], peakHours: [] };
  }
}

export async function getFlatDetail(flatId: string): Promise<FlatDetail> {
  try {
    const response = await api.get(`/flat/${flatId}/details`);
    return response.data || null;
  } catch {
    return null as any;
  }
}

// ------------------------------------------------------- Society Admin ----
export async function getSocietyOverview(societyId: string): Promise<SocietyOverview> {
  const response = await api.get(`/society/${societyId}/overview`);
  return response.data;
}

export async function getSocietyBlocks(societyId: string): Promise<SocietyBlockRow[]> {
  try {
    if (!societyId) return [];
    const response = await api.get(`/society/${societyId}/blocks`);
    const data = response.data;
    const list = Array.isArray(data) ? data : (data?.blocks ?? []);
    return list.map((b: any) => {
      const rawName = b.blockName || b.name || `Block ${b.id}`;
      const cleanName = rawName.replace(/^Block\s+/i, "");
      return {
        ...b,
        name: cleanName,
        blockName: cleanName,
      };
    });
  } catch {
    return [];
  }
}

export async function getBlockFloors(blockId: string): Promise<BlockFloorRow[]> {
  try {
    const response = await api.get(`/block/${blockId}/floors`);
    return response.data;
  } catch {
    return [];
  }
}

export async function getFloorFlatsList(floorId: string): Promise<FloorFlatRow[]> {
  try {
    const response = await api.get(`/floor/${floorId}/flats`);
    return response.data;
  } catch {
    return [];
  }
}

export async function getSocietyCommonAreas(societyId: string): Promise<SocietyCommonAreaRow[]> {
  const response = await api.get(`/society/${societyId}/common_areas`);
  return response.data;
}

export async function getSocietyHeatmap(societyId: string, filter?: string): Promise<HeatmapGrid> {
  const params = filter && filter !== "Whole society" && filter !== "All societies" ? { filter } : {};
  const response = await api.get(`/society/${societyId}/heatmap`, { params });
  return response.data;
}

export async function getSocietyHourlyBreakdown(societyId: string, filter?: string, date?: string): Promise<HourlyDataPoint[]> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (filter && filter !== "Whole society" && filter !== "All societies") params.filter = filter;
  const response = await api.get(`/society/${societyId}/hourly-breakdown`, { params });
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
      id: a.id ? String(a.id) : `soc-anom-${idx + 1}`,
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
  } catch {
    return [];
  }
}

export async function getSocietyDailyTrend(societyId: string, days: number = 7, filter?: string): Promise<DailyTrendPoint[]> {
  const params: Record<string, any> = { days };
  if (filter && filter !== "Whole society" && filter !== "All societies") params.filter = filter;
  const response = await api.get(`/society/${societyId}/daily-trend`, { params });
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
  const response = await api.get(`/society/${societyId}/flats`, { params: { search, sortBy } });
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

export async function getBuilderHeatmap(builderId: string, filter?: string): Promise<HeatmapGrid> {
  const params = filter && filter !== "All societies" && filter !== "Whole society" ? { filter } : {};
  const response = await api.get(`/builder/${builderId}/heatmap`, { params });
  return response.data;
}

export async function getBuilderHourlyBreakdown(builderId: string, filter?: string, date?: string): Promise<HourlyDataPoint[]> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (filter && filter !== "All societies" && filter !== "Whole society") params.filter = filter;
  const response = await api.get(`/builder/${builderId}/hourly-breakdown`, { params });
  return (response.data ?? []).map((d: any) => ({
    hour: d.hour,
    base: d.base ?? d.baseKwh ?? 0,
    society: d.society ?? d.societyKwh ?? 0,
    common: d.common ?? d.commonAreaKwh ?? 0,
    peak: d.peak ?? d.peekKwh ?? 0,
  }));
}

export async function getBuilderAnomalies(builderId: string, filter?: string): Promise<AnomalyItem[]> {
  try {
    const params = filter && filter !== "All societies" && filter !== "Whole society" ? { filter } : {};
    const response = await api.get(`/builder/${builderId}/anomalies`, { params });
    const data = response.data;
    const list: any[] = Array.isArray(data) ? data : (data?.anomalies ?? []);
    return list.map((a: any, idx: number) => ({
      id: a.id ? String(a.id) : `builder-anom-${idx + 1}`,
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
  } catch {
    return [];
  }
}

// ------------------------------------------------------ Device Manager ----
export async function getSocietyDevices(societyId: string): Promise<DeviceRow[]> {
  const response = await api.get(`/society/${societyId}/devices`);
  const data = response.data;
  return (data || []).map((point: any, index: number) => {
    let status: "live" | "offline" | "offline-long" = "offline";
    if (point.meterStatus === true || point.status === "live" || point.status === true) {
      status = "live";
    } else if (point.meterStatus === false || point.status === "offline" || point.status === false) {
      status = point.lastSeenAt ? "offline" : "offline-long";
    }

    const mappedToRaw = String(point.mappedTo || point.commonAreaName || (point.flatNumber ? `Flat ${point.flatNumber}` : "Unassigned"));
    const mappedTo = mappedToRaw.startsWith("Flat ") || mappedToRaw === "Unassigned" || isNaN(Number(mappedToRaw))
      ? mappedToRaw
      : `Flat ${mappedToRaw}`;

    return {
      ...point,
      id: point.id ? String(point.id) : point.deviceSerial ? `MTR-${point.deviceSerial}` : point.deviceId ? `DEV-${point.deviceId}` : `MTR-${index + 1}`,
      deviceSerial: point.deviceSerial ? String(point.deviceSerial) : String(point.id || ""),
      blockName: point.blockName || (point.mappedTo?.includes("Block") ? point.mappedTo.split("·")[0].trim() : "—"),
      status,
      mappedTo,
      lastSeenAt: point.lastSeenAt ? new Date(point.lastSeenAt) : null,
    };
  });
}

export async function registerDevice({ deviceSerial, deviceType, societyId, flatId, commonAreaId }: RegisterDeviceInput): Promise<any> {
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
  return response.data;
}

export async function createSociety(input: any): Promise<any> {
  const response = await api.post("/superAdmin/societies", input);
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

export async function createFloor(blockId: string | number, floorNumber: number): Promise<any> {
  const response = await api.post(`/block/${blockId}/floor`, { blockId: Number(blockId), floorNumber });
  return response.data;
}

export async function createFlat(floorId: string | number, data: { flatNumber: string; bhkType: string }): Promise<any> {
  const response = await api.post(`/floor/${floorId}/flat`, data);
  return response.data;
}

export async function createCommonArea(societyId: string | number, data: { name: string; category: string; floorOrLocation: string }): Promise<any> {
  const response = await api.post(`/society/${societyId}/common-area`, { ...data, societyId: Number(societyId) });
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

export async function deleteFlat(floorOrFlatId: string | number, flatId?: string | number): Promise<any> {
  const url = flatId ? `/floor/${floorOrFlatId}/flat/${flatId}` : `/flat/${floorOrFlatId}`;
  const response = await api.delete(url);
  return response.data;
}

export async function deleteFloor(blockOrFloorId: string | number, floorId?: string | number): Promise<any> {
  const url = floorId ? `/block/${blockOrFloorId}/floor/${floorId}` : `/floor/${blockOrFloorId}`;
  const response = await api.delete(url);
  return response.data;
}

export async function deleteCommonArea(societyId: string | number, commonAreaId: string | number): Promise<any> {
  const response = await api.delete(`/society/${societyId}/common-area/${commonAreaId}`);
  return response.data;
}
