// Static data model, generated once at module load.
// Mirrors the V0 data model: builders -> societies -> blocks -> floors -> flats
// plus common_areas and devices, all wired with the ids the PRD's API layer expects.

import type { Block, Builder, CommonArea, Db, Device, Flat, Floor, Society, User } from "./types";

const BHK_TYPES = ["1BHK", "2BHK", "2BHK", "3BHK"];
const COMMON_AREA_TEMPLATES = [
  { name: "Lift 1", category: "Vertical Transport" },
  { name: "Lift 2", category: "Vertical Transport" },
  { name: "Borewell Pump", category: "Water Systems" },
  { name: "Overhead Tank Pump", category: "Water Systems" },
  { name: "Common Area Lighting", category: "Lighting" },
  { name: "Clubhouse & Gym", category: "Recreational" },
];

function buildSociety(
  societyId: string,
  name: string,
  city: string,
  blockCount: number,
  floorCount: number,
  flatsPerFloor: number
): Society {
  const blocks: Block[] = [];
  const flatsFlat: Flat[] = [];
  const blockNames = ["A", "B", "C", "D"].slice(0, blockCount);

  for (const bn of blockNames) {
    const blockId = `${societyId}-blk-${bn}`;
    const floors: Floor[] = [];
    for (let f = 1; f <= floorCount; f++) {
      const floorId = `${blockId}-f${f}`;
      const flats: Flat[] = [];
      for (let u = 1; u <= flatsPerFloor; u++) {
        const flatNumber = `${bn}-${f}0${u}`;
        const flatId = `${floorId}-flat-${u}`;
        const flat: Flat = {
          id: flatId,
          floorId,
          blockId,
          societyId,
          flatNumber,
          bhkType: BHK_TYPES[(f + u) % BHK_TYPES.length],
          status: Math.random() > 0.12 ? "occupied" : "vacant",
          residentName: null, // filled after users seeded
        };
        flats.push(flat);
        flatsFlat.push(flat);
      }
      floors.push({ id: floorId, blockId, floorNumber: f, flats });
    }
    blocks.push({ id: blockId, societyId, name: `Block ${bn}`, floors });
  }

  const commonAreas: CommonArea[] = COMMON_AREA_TEMPLATES.map((t, i) => ({
    id: `${societyId}-ca-${i + 1}`,
    societyId,
    name: t.name,
    category: t.category,
    floorOrLocation: "Ground Floor",
  }));

  return {
    id: societyId,
    name,
    city,
    totalBlocks: blocks.length,
    blocks,
    commonAreas,
    flats: flatsFlat,
  };
}

const societiesRaw: Society[] = [
  buildSociety("s1", "Palm Meadows", "Jalandhar", 3, 4, 4),
  buildSociety("s2", "Cedar Heights", "Ludhiana", 3, 4, 4),
];

const builder: Builder = {
  id: "b1",
  name: "Ashoka Realty Group",
  email: "admin@ashokarealty.example",
  societies: societiesRaw,
};

// ---- Devices (one flat meter per flat, one meter per common area) ----
const devices: Device[] = [];
for (const society of societiesRaw) {
  for (const flat of society.flats) {
    devices.push({
      id: `MTR-${flat.flatNumber}-${society.id.toUpperCase()}`,
      deviceType: "Flat Meter",
      mappedFlatId: flat.id,
      mappedCommonAreaId: null,
      societyId: society.id,
      registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (60 + Math.floor(Math.random() * 60))),
    });
  }
  for (const ca of society.commonAreas) {
    devices.push({
      id: `MTR-CA-${ca.id.toUpperCase()}`,
      deviceType: "Common Area Meter",
      mappedFlatId: null,
      mappedCommonAreaId: ca.id,
      societyId: society.id,
      registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (60 + Math.floor(Math.random() * 60))),
    });
  }
}

// ---- Seed users: 3-5 per role ----
const RESIDENT_NAMES = [
  "Rishabh Sharma", "Anjali Mehta", "Karan Verma", "Priya Nair", "Suresh Iyer",
  "Neha Kapoor", "Arjun Malhotra", "Simran Kaur", "Vikram Rao", "Divya Menon",
];

const users: User[] = [];
let residentIdx = 0;
for (const society of societiesRaw) {
  society.flats.forEach((flat, i) => {
    if (flat.status === "occupied" && residentIdx < RESIDENT_NAMES.length + 40) {
      const name = RESIDENT_NAMES[i % RESIDENT_NAMES.length];
      flat.residentName = name;
    }
  });
}

// A handful of explicit, easy-to-demo logins
users.push(
  { id: "u1", name: "Rishabh Sharma", email: "rishabh.owner@enra.io", password: "demo123", role: "flat_owner", flatId: societiesRaw[0].flats[0].id, societyId: "s1", builderId: null },
  { id: "u2", name: "Anjali Mehta", email: "anjali.owner@demo.io", password: "demo123", role: "flat_owner", flatId: societiesRaw[0].flats[5].id, societyId: "s1", builderId: null },
  { id: "u3", name: "Society Admin — Palm Meadows", email: "admin.s1@demo.io", password: "demo123", role: "society_admin", flatId: null, societyId: "s1", builderId: null },
  { id: "u4", name: "Society Admin — Cedar Heights", email: "admin.s2@demo.io", password: "demo123", role: "society_admin", flatId: null, societyId: "s2", builderId: null },
  { id: "u5", name: "Ashoka Realty — Builder Admin", email: "builder@demo.io", password: "demo123", role: "builder_admin", flatId: null, societyId: null, builderId: "b1" }
);
societiesRaw[0].flats[0].residentName = "Rishabh Sharma";
societiesRaw[0].flats[5].residentName = "Anjali Mehta";

// ---- Lookup indexes ----
const societyById = new Map(societiesRaw.map((s) => [s.id, s]));
const blockById = new Map<string, Block>();
const floorById = new Map<string, Floor>();
const flatById = new Map<string, Flat>();
const commonAreaById = new Map<string, CommonArea>();
const deviceById = new Map(devices.map((d) => [d.id, d]));
const deviceByFlatId = new Map<string, Device>();
const deviceByCommonAreaId = new Map<string, Device>();

for (const s of societiesRaw) {
  for (const b of s.blocks) {
    blockById.set(b.id, b);
    for (const f of b.floors) {
      floorById.set(f.id, f);
      for (const flat of f.flats) flatById.set(flat.id, flat);
    }
  }
  for (const ca of s.commonAreas) commonAreaById.set(ca.id, ca);
}
for (const d of devices) {
  if (d.mappedFlatId) deviceByFlatId.set(d.mappedFlatId, d);
  if (d.mappedCommonAreaId) deviceByCommonAreaId.set(d.mappedCommonAreaId, d);
}

export const db: Db = {
  builder,
  societies: societiesRaw,
  devices,
  users,
  societyById,
  blockById,
  floorById,
  flatById,
  commonAreaById,
  deviceById,
  deviceByFlatId,
  deviceByCommonAreaId,
};

export function getFlatDevice(flatId: string): Device | undefined {
  return deviceByFlatId.get(flatId);
}
export function getCommonAreaDevice(caId: string): Device | undefined {
  return deviceByCommonAreaId.get(caId);
}
export function getSocietyFlats(societyId: string): Flat[] {
  return societyById.get(societyId)?.flats ?? [];
}
export function getBlockFlats(blockId: string): Flat[] {
  const block = blockById.get(blockId);
  if (!block) return [];
  return block.floors.flatMap((f) => f.flats);
}
export function getFloorFlats(floorId: string): Flat[] {
  return floorById.get(floorId)?.flats ?? [];
}
