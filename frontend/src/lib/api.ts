import { db } from "./mockData";
import type {
  BlockFloorRow, BuilderOverview, BuilderSocietyRow, Device, DeviceRow, FlatHourlyProfile, FlatLive,
  FlatSummary, FlatTrend, FloorFlatRow, HeatmapGrid, RegisterDeviceInput, Session,
  SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow, SocietyOverview, TrendPoint, FlatDetail
} from "./types";
import api from '../api/api'

const delay = (ms = 220): Promise<void> => new Promise((res) => setTimeout(res, ms));

const extraDevices: Device[] = [];
const deregisteredIds = new Set<string>();

export function allActiveDevices(): Device[] {
  return [...db.devices, ...extraDevices].filter((d: Device) => !deregisteredIds.has(d.id));
}

// function deviceStatus(device: Device): MeterStatus {
//   if (deregisteredIds.has(device.id)) return "deregistered";
//   const offline = engine.isOffline(device.id);
//   if (!offline) return "live";
//   const mins = engine.lastSeenMinutesAgo(device.id);
//   return mins > 30 ? "offline-long" : "offline";
// }


// This function is used in the login request to return the whole detail of the user
// Tries real backend first, falls back to mock users if backend is unavailable
export async function login(email: string, password: string): Promise<Session> {
  try {
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
  } catch (err: any) {
    if (err.code === "ERR_NETWORK" || err.message === "Network Error" || !err.response) {
      await delay(300);
      const mockUser = db.users.find(
        (u) => u.email === email && "password123" === password
      );
      if (!mockUser) throw new Error("Invalid email or password.");
      return {
        token: "mock-token-" + mockUser.id,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          flatId: mockUser.flatId,
          societyId: mockUser.societyId,
          builderId: mockUser.builderId,
        },
      };
    }
    // If it's a real backend error (401, 403, etc.), throw it
    throw err.response?.data?.message
      ? new Error(err.response.data.message)
      : err;
  }
}



export async function getFlatLive(flatId: string): Promise<FlatLive> {
  const response = await api.get(`/flat/${flatId}/live`);
  const data = response.data;

  return {
    ...data,
    lastReadingAt: data.lastReadingAt
      ? new Date(data.lastReadingAt)
      : undefined,

    timestamp: data.timestamp
      ? new Date(data.timestamp)
      : undefined,
  };

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const device = getFlatDevice(flatId)!;
  // const status = deviceStatus(device);
  // if (status !== "live") {
  //   return { online: false, lastReadingAt: new Date(Date.now() - engine.lastSeenMinutesAgo(device.id) * 60000) };
  // }
  // const kw = engine.liveKw(device.id, false);
  // const profile = engine.hourlyProfile(device.id, false, 14);
  // const currentHourAvg = profile[new Date().getHours()];
  // const pctVsUsual = currentHourAvg ? Math.round(((kw - currentHourAvg) / currentHourAvg) * 100) : 0;
  // const level = kw > currentHourAvg * 1.25 ? "high" : kw > currentHourAvg * 1.05 ? "amber" : "normal";
  // return { online: true, kw, level, pctVsUsual, timestamp: new Date() };
}



export async function getFlatSummary(flatId: string, monthDate: Date = new Date()): Promise<FlatSummary> {
  const month = monthDate.toISOString().slice(0, 7);
  const response = await api.get(
    `/flat/${flatId}/summary?month=${month}`
  );
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const device = getFlatDevice(flatId)!;
  // const series = engine.monthSeries(device.id, false, monthDate);
  // const totalKwh = series.reduce((s, d) => s + d.kwh, 0);
  // const daysElapsed = series.length;
  // const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  // const projected = (totalKwh / daysElapsed) * daysInMonth;
  // const peakDay = series.reduce((max, d) => (d.kwh > max.kwh ? d : max), series[0]);
  // return {
  //   series,
  //   totalKwh: +totalKwh.toFixed(1),
  //   estCost: totalKwh * 10,
  //   projectedTotal: +projected.toFixed(1),
  //   projectedCost: projected * 10,
  //   peakDay,
  // };
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

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const device = getFlatDevice(flatId)!;
  // const points = engine.trend30Day(device.id, false);
  // const first15 = points.slice(0, 15).reduce((s, p) => s + p.kwh, 0);
  // const last15 = points.slice(15).reduce((s, p) => s + p.kwh, 0);
  // const pctChange = first15 ? Math.round(((last15 - first15) / first15) * 100) : 0;
  // return { points, pctChange };
}

export async function getFlatHourlyProfile(flatId: string): Promise<FlatHourlyProfile> {
  const response = await api.get(`/flat/${flatId}/hourly-profile`);
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const device = getFlatDevice(flatId)!;
  // const profile = engine.hourlyProfile(device.id, false);
  // const withHour = profile.map((kwh, hour) => ({ hour, kwh }));
  // const peaks = [...withHour].sort((a, b) => b.kwh - a.kwh).slice(0, 3).map((p) => p.hour);
  // return { profile: withHour, peakHours: peaks };
}

export async function getFlatDetail(flatId: string): Promise<FlatDetail> {
  const response = await api.get(`/flat/${flatId}/details`)
  return response.data;
}

// ------------------------------------------------------- Society Admin ----
export async function getSocietyOverview(societyId: string): Promise<SocietyOverview> {
  const response = await api.get(`/society/${societyId}/overview`);
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const flats = getSocietyFlats(societyId);
  // const devices = allActiveDevices().filter((d) => d.societyId === societyId);
  // let liveKwTotal = 0;
  // let mtdKwh = 0;
  // const now = new Date();
  // for (const flat of flats) {
  //   const device = getFlatDevice(String(flat.id))!;
  //   if (deviceStatus(device) === "live") liveKwTotal += engine.liveKw(device.id, false);
  //   mtdKwh += engine.monthSeries(device.id, false, now).reduce((s, d) => s + d.kwh, 0);
  // }
  // const devicesOnline = devices.filter((d) => deviceStatus(d) === "live").length;
  // return {
  //   liveKw: +liveKwTotal.toFixed(1),
  //   totalFlats: flats.length,
  //   occupiedFlats: flats.filter((f) => f.status === "occupied").length,
  //   devicesOnline,
  //   devicesOffline: devices.length - devicesOnline,
  //   mtdKwh: +mtdKwh.toFixed(0),
  //   mtdCost: mtdKwh * 10,
  // };
}

export async function getSocietyBlocks(societyId: string): Promise<SocietyBlockRow[]> {
  const response = await api.get(`/society/${societyId}/blocks`)
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const society = db.societyById.get(societyId)!;
  // const now = new Date();
  // const rows = society.blocks.map((block) => {
  //   const flats = block.floors.flatMap((f) => f.flats);
  //   let liveKw = 0;
  //   let todayKwh = 0;
  //   let mtdKwh = 0;
  //   for (const flat of flats) {
  //     const device = getFlatDevice(String(flat.id))!;
  //     if (deviceStatus(device) === "live") liveKw += engine.liveKw(device.id, false);
  //     todayKwh += engine.dailyKwh(device.id, now, false);
  //     mtdKwh += engine.monthSeries(device.id, false, now).reduce((s, d) => s + d.kwh, 0);
  //   }
  //   return { id: block.id, name: block.name, liveKw: +liveKw.toFixed(1), todayKwh: +todayKwh.toFixed(1), mtdKwh: +mtdKwh.toFixed(0), flatCount: flats.length };
  // });
  // const avgMtd = rows.reduce((s, r) => s + r.mtdKwh, 0) / rows.length;
  // return rows.map((r) => ({ ...r, aboveAverage: r.mtdKwh > avgMtd * 1.05 }));
}

export async function getBlockFloors(blockId: string): Promise<BlockFloorRow[]> {
  const response = await api.get(`/block/${blockId}/floors`);
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  //   await delay();
  //   const block = db.blockById.get(blockId)!;
  //   const now = new Date();
  //   return block.floors.map((floor) => {
  //     let mtdKwh = 0;
  //     for (const flat of floor.flats) {
  //       const device = getFlatDevice(flat.id)!;
  //       mtdKwh += engine.monthSeries(device.id, false, now).reduce((s, d) => s + d.kwh, 0);
  //     }
  //     return { id: floor.id, floorNumber: floor.floorNumber, flatCount: floor.flats.length, mtdKwh: +mtdKwh.toFixed(0) };
  //   });
}

export async function getFloorFlatsList(floorId: string): Promise<FloorFlatRow[]> {
  const response = await api.get(`/floor/${floorId}/flats`);
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const flats = getFloorFlats(floorId);
  // const now = new Date();
  // return flats.map((flat) => {
  //   const device = getFlatDevice(flat.id)!;
  //   const status = deviceStatus(device);
  //   return {
  //     ...flat,
  //     deviceId: device?.id,
  //     meterStatus: status,
  //     mtdKwh: +engine.monthSeries(device.id, false, now).reduce((s, d) => s + d.kwh, 0).toFixed(0),
  //   };
  // });
}

export async function getSocietyCommonAreas(societyId: string): Promise<SocietyCommonAreaRow[]> {
  const response = await api.get(`/society/${societyId}/common_areas`);

  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const society = db.societyById.get(societyId)!;
  // return society.commonAreas.map((ca) => {
  //   const device = getCommonAreaDevice(ca.id)!;
  //   const status = deviceStatus(device);
  //   return {
  //     ...ca,
  //     deviceId: device?.id,
  //     status,
  //     currentKw: status === "live" ? engine.liveKw(device.id, true) : 0,
  //   };
  // });
}

export async function getSocietyHeatmap(societyId: string): Promise<HeatmapGrid> {
  const response = await api.get(`/society/${societyId}/heatmap`);
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay(300);
  // const flats = getSocietyFlats(societyId);
  // const deviceIds = flats.map((f) => getFlatDevice(f.id)!.id);
  // return engine.heatmap(deviceIds, false);
}

export async function getSocietyFlatsList(
  societyId: string,
  { search = "", sortBy = "flatNumber" }: { search?: string; sortBy?: "flatNumber" | "mtdKwh" } = {}
): Promise<SocietyFlatRow[]> {
  const response = await api.get(`/society/${societyId}/flats`, { params: { search, sortBy } });
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const flats = getSocietyFlats(societyId);
  // const now = new Date();
  // let rows: SocietyFlatRow[] = flats.map((flat) => {
  //   const block = db.blockById.get(flat.blockId)!;
  //   const floor = db.floorById.get(flat.floorId)!;
  //   const device = getFlatDevice(flat.id)!;
  //   const status = deviceStatus(device);
  //   return {
  //     ...flat,
  //     blockName: block.name,
  //     floorNumber: floor.floorNumber,
  //     meterStatus: status,
  //     mtdKwh: +engine.monthSeries(device.id, false, now).reduce((s, d) => s + d.kwh, 0).toFixed(0),
  //   };
  // });
  // if (search.trim()) {
  //   const q = search.toLowerCase();
  //   rows = rows.filter((r) => r.flatNumber.toLowerCase().includes(q) || (r.residentName || "").toLowerCase().includes(q));
  // }
  // rows.sort((a, b) => {
  //   if (sortBy === "mtdKwh") return b.mtdKwh - a.mtdKwh;
  //   return a.flatNumber.localeCompare(b.flatNumber);
  // });
  // return rows;
}


// These function make call to the api from the backend for the builder
export async function getBuilderOverview(builderId: string): Promise<BuilderOverview> {
  const response = await api.get(`/builder/${builderId}/overview`);

  return response.data;
  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();  
  // const societies = db.builder.societies;
  // let totalFlats = 0;
  // let totalKwh = 0;
  // let devicesOnline = 0;
  // const now = new Date();
  // for (const s of societies) {
  //   totalFlats += s.flats.length;
  //   for (const flat of s.flats) {
  //     const device = getFlatDevice(flat.id)!;
  //     if (deviceStatus(device) === "live") devicesOnline++;
  //     totalKwh += engine.monthSeries(device.id, false, now).reduce((sum, d) => sum + d.kwh, 0);
  //   }
  // }
  // return { totalSocieties: societies.length, totalFlats, devicesOnline, mtdKwh: +totalKwh.toFixed(0), mtdCost: totalKwh * 10 };
}

export async function getBuilderSocieties(builderId: string): Promise<BuilderSocietyRow[]> {
  const response = await api.get(`/builder/${builderId}/societies`);

  return response.data;
  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // const now = new Date();
  // return db.builder.societies.map((s) => {
  //   let mtdKwh = 0;
  //   for (const flat of s.flats) {
  //     const device = getFlatDevice(flat.id)!;
  //     mtdKwh += engine.monthSeries(device.id, false, now).reduce((sum, d) => sum + d.kwh, 0);
  //   }
  //   return {
  //     id: s.id,
  //     name: s.name,
  //     city: s.city,
  //     totalFlats: s.flats.length,
  //     occupiedFlats: s.flats.filter((f) => f.status === "occupied").length,
  //     mtdKwh: +mtdKwh.toFixed(0),
  //     avgPerFlat: +(mtdKwh / s.flats.length).toFixed(1),
  //   };
  // });
}

// ------------------------------------------------------ Device Manager ----
export async function getSocietyDevices(societyId: string): Promise<DeviceRow[]> {
  const response = await api.get(`/society/${societyId}/devices`);

  const data = response.data;

  return data.map((point: DeviceRow) => ({
    ...point,
    lastSeenAt: new Date(point.lastSeenAt)
  }));


  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay();
  // return allActiveDevices()
  //   .filter((d) => d.societyId === societyId)
  //   .map((d) => {
  //     const status = deviceStatus(d);
  //     const mappedTo = d.mappedFlatId ? db.flatById.get(d.mappedFlatId)?.flatNumber : db.commonAreaById.get(d.mappedCommonAreaId!)?.name;
  //     return {
  //       ...d,
  //       status,
  //       mappedTo,
  //       lastSeenAt: status === "live" ? new Date() : new Date(Date.now() - engine.lastSeenMinutesAgo(d.id) * 60000),
  //     };
  //   });
}

export async function registerDevice({ deviceSerial, deviceType, mappedTo, societyId }: RegisterDeviceInput): Promise<Device> {
  const response = await api.post(
    `/society/${societyId}/register-device?deviceId=${deviceSerial}&deviceType=${deviceType}&mappedTo=${mappedTo}`
  );
  return response.data;

  // Mock data fallback:
  // This logic is commented out because the data is now fetched from the backend API.
  // Uncomment this block if mock data is used instead of the API.

  // await delay(400);
  // const exists = allActiveDevices().some((d) => d.id === deviceSerial);
  // if (exists) throw new Error("Device ID already exists. Choose a unique ID.");
  // let mappedFlatId: string | null = null;
  // let mappedCommonAreaId: string | null = null;
  // if (deviceType === "Flat Meter") {
  //   const flat = getSocietyFlats(societyId).find((f) => f.flatNumber === mappedTo);
  //   if (!flat) throw new Error("No matching flat found for that flat number.");
  //   mappedFlatId = flat.id;
  // } else {
  //   const ca = db.societyById.get(societyId)!.commonAreas.find((c) => c.name.toLowerCase() === mappedTo.toLowerCase());
  //   if (!ca) throw new Error("No matching common area asset found.");
  //   mappedCommonAreaId = ca.id;
  // }
  // const device: Device = { id: deviceSerial, deviceType, mappedFlatId, mappedCommonAreaId, societyId, registeredAt: new Date() };
  // extraDevices.push(device);
  // return device;
}

export async function deregisterDevice(deviceId: string): Promise<{ id: string; deregistered: boolean }> {
  const response = await api.delete(`/society/${deviceId}/deregister-device`);
  return response.data;
  // await delay(300);
  // deregisteredIds.add(deviceId);
  // return { id: deviceId, deregistered: true };
}
