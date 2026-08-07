export type Role = "FLAT_OWNER" | "SOCIETY_ADMIN" | "BUILDER_ADMIN" | "SUPER_ADMIN";

export type MeterStatus = "live" | "offline" | "offline-long" | "deregistered";

export interface Flat {
  id: string;
  floorId: string;
  blockId: string;
  societyId: string;
  flatNumber: string;
  bhkType: string;
  status: "occupied" | "vacant";
  residentName: string | null;
}

export interface Floor {
  id: string;
  blockId: string;
  floorNumber: number;
  flats: Flat[];
}

export interface Block {
  id: string;
  societyId: string;
  name: string;
  floors: Floor[];
}

export interface CommonArea {
  id: string;
  societyId: string;
  name: string;
  category: string;
  floorOrLocation: string;
}

export interface Society {
  id: string;
  name: string;
  city: string;
  totalBlocks: number;
  blocks: Block[];
  commonAreas: CommonArea[];
  flats: Flat[];
}

export interface Builder {
  id: string;
  name: string;
  email: string;
  societies: Society[];
}

export type DeviceType = "Flat Meter" | "Common Area Meter";

export interface Device {
  id: string;
  deviceType: DeviceType;
  mappedFlatId: string | null;
  mappedCommonAreaId: string | null;
  societyId: string;
  registeredAt: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  flatId: string | null;
  societyId: string | null;
  builderId: string | null;
}

export interface Db {
  builder: Builder;
  societies: Society[];
  devices: Device[];
  users: User[];
  societyById: Map<string, Society>;
  blockById: Map<string, Block>;
  floorById: Map<string, Floor>;
  flatById: Map<string, Flat>;
  commonAreaById: Map<string, CommonArea>;
  deviceById: Map<string, Device>;
  deviceByFlatId: Map<string, Device>;
  deviceByCommonAreaId: Map<string, Device>;
}

// ---------------------------------------------------------------- API ----

export interface Session {
  token: string;
  user: User;
}

export interface FlatLive {
  online: boolean;
  lastReadingAt?: Date;
  kw?: number;
  level?: "normal" | "amber" | "high";
  pctVsUsual?: number;
  timestamp?: Date;
}

export interface DaySeriesPoint {
  date: Date;
  day: number;
  kwh: number;
  isWeekend: boolean;
}

export interface FlatSummary {
  series: DaySeriesPoint[];
  totalKwh: number;
  estCost: number;
  projectedTotal: number;
  projectedCost: number;
  peakDay: DaySeriesPoint;
}

export interface TrendPoint {
  date: Date;
  kwh: number;
  rollingAvg?: number;
}

export interface FlatTrend {
  points: TrendPoint[];
  pctChange: number;
}

export interface HourlyPoint {
  hour: number;
  kwh: number;
}

export interface FlatHourlyProfile {
  profile: HourlyPoint[];
  peakHours: number[];
}

export interface SocietyOverview {
  liveKw: number;
  totalFlats: number;
  occupiedFlats: number;
  devicesOnline: number;
  devicesOffline: number;
  mtdKwh: number;
  mtdCost: number;
}

export interface SocietyBlockRow {
  id: string;
  name: string;
  liveKw: number;
  todayKwh: number;
  mtdKwh: number;
  flatCount: number;
  aboveAverage: boolean;
}

export interface BlockFloorRow {
  id: string;
  floorNumber: number;
  flatCount: number;
  mtdKwh: number;
}

export interface FloorFlatRow extends Flat {
  deviceId?: string;
  meterStatus: MeterStatus;
  mtdKwh: number;
}

export interface SocietyCommonAreaRow extends CommonArea {
  deviceId?: string;
  status: MeterStatus;
  currentKw: number;
}

export type HeatmapGrid = number[][];

export interface SocietyFlatRow extends Flat {
  blockName: string;
  floorNumber: number;
  meterStatus: MeterStatus;
  mtdKwh: number;
}

export interface BuilderOverview {
  totalSocieties: number;
  totalFlats: number;
  devicesOnline: number;
  mtdKwh: number;
  mtdCost: number;
}

export interface BuilderSocietyRow {
  id: string;
  name: string;
  city: string;
  totalFlats: number;
  occupiedFlats: number;
  mtdKwh: number;
  avgPerFlat: number;
}

export interface DeviceRow extends Device {
  status: MeterStatus;
  mappedTo?: string;
  lastSeenAt: Date;
}

export interface RegisterDeviceInput {
  deviceSerial: string;
  deviceType: DeviceType;
  mappedTo: string;
  societyId: string;
}
