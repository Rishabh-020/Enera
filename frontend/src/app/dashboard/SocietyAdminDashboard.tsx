import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { LayoutGrid, Cpu, Search, ChevronRight, Zap, Building2, Users, PlugZap } from "lucide-react";
import * as api from "../../lib/api";
import { db } from "../../lib/mockData";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/chart/StatCard";
import { Heatmap } from "../../components/chart/Heatmap";
import { FlatDashboardView } from "../../components/FlatDashboardView";
import {
  Card, CardHeader, CardTitle, CardDescription, Badge, Input, Button,
  Table, Thead, Th, Td, Tr, Breadcrumb, StatusDot, type BreadcrumbItem,
} from "../../components/ui/primitives";
import type {
  BlockFloorRow, HeatmapGrid, SocietyBlockRow, SocietyCommonAreaRow, SocietyFlatRow, SocietyOverview, FloorFlatRow,
} from "../../lib/types";

export default function SocietyAdminDashboard() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const readOnly = searchParams.get("readonly") === "true";
  const society = db.societyById.get(societyId ?? "");

  // drill-down state: block -> floor -> flat
  const [blockId, setBlockId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [flatId, setFlatId] = useState<string | null>(null);

  function reset() {
    setBlockId(null);
    setFloorId(null);
    setFlatId(null);
  }

  const crumbs: BreadcrumbItem[] = [{ label: society?.name, onClick: reset }];
  if (blockId) crumbs.push({ label: db.blockById.get(blockId)!.name, onClick: () => { setFloorId(null); setFlatId(null); } });
  if (floorId) crumbs.push({ label: `Floor ${db.floorById.get(floorId)!.floorNumber}`, onClick: () => setFlatId(null) });
  if (flatId) crumbs.push({ label: `Flat ${db.flatById.get(flatId)!.flatNumber}` });

  return (
    <DashboardLayout
      nav={
        readOnly
          ? [{ key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> }]
          : [
            { key: "dashboard", label: "Dashboard", icon: <LayoutGrid size={16} /> },
            { key: "devices", label: "Devices", icon: <Cpu size={16} /> },
          ]
      }
      activeKey="dashboard"
      onNav={(key) => key === "devices" && navigate(`/society/${societyId}/devices`)}
      banner={
        readOnly && (
          <div className="flex items-center justify-between bg-amp-500/15 px-4 py-2 text-xs font-medium text-amp-600 md:px-8">
            <span>Viewing as Builder Admin — Read only</span>
            <button onClick={() => navigate(-1)} className="underline underline-offset-2 hover:text-amp-500">
              Back to portfolio
            </button>
          </div>
        )
      }
    >
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Society Admin</p>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-grid-900">{society?.name}</h1>
        </div>
        <div className="mt-2">
          <Breadcrumb items={crumbs} />
        </div>
      </div>

      {flatId ? (
        <FlatDashboardView flatId={flatId} />
      ) : floorId ? (
        <FloorFlatList floorId={floorId} onSelectFlat={setFlatId} />
      ) : blockId ? (
        <BlockFloorList blockId={blockId} onSelectFloor={setFloorId} />
      ) : (
        <SocietyOverviewSection societyId={societyId ?? ""} onSelectBlock={setBlockId} onSelectFlat={setFlatId} />
      )}
    </DashboardLayout>
  );
}

interface SocietyOverviewSectionProps {
  societyId: string;
  onSelectBlock: (id: string) => void;
  onSelectFlat: (id: string) => void;
}

function SocietyOverviewSection({ societyId, onSelectBlock, onSelectFlat }: SocietyOverviewSectionProps) {
  const [overview, setOverview] = useState<SocietyOverview | null>(null);
  const [blocks, setBlocks] = useState<SocietyBlockRow[] | null>(null);
  const [commonAreas, setCommonAreas] = useState<SocietyCommonAreaRow[] | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapGrid | null>(null);
  const [flats, setFlats] = useState<SocietyFlatRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"flatNumber" | "mtdKwh">("flatNumber");

  useEffect(() => {
    api.getSocietyOverview(societyId).then(setOverview);
    api.getSocietyBlocks(societyId).then(setBlocks);
    api.getSocietyCommonAreas(societyId).then(setCommonAreas);
    api.getSocietyHeatmap(societyId).then(setHeatmap);
  }, [societyId]);

  useEffect(() => {
    api.getSocietyFlatsList(societyId, { search, sortBy }).then(setFlats);
  }, [societyId, search, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Live consumption" value={overview ? `${overview.liveKw} kW` : "—"} icon={<Zap size={16} />} loading={!overview} accent />
        <StatCard label="Flats" value={overview ? `${overview.occupiedFlats}/${overview.totalFlats}` : "—"} sub="occupied / total" icon={<Users size={16} />} loading={!overview} />
        <StatCard label="Devices online" value={overview ? overview.devicesOnline : "—"} sub={overview ? `${overview.devicesOffline} offline` : ""} icon={<PlugZap size={16} />} loading={!overview} />
        <StatCard label="Month-to-date" value={overview ? `${overview.mtdKwh} kWh` : "—"} sub={overview ? `₹${overview.mtdCost.toLocaleString("en-IN")}` : ""} icon={<Building2 size={16} />} loading={!overview} />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Block-wise consumption</CardTitle>
            <CardDescription>Click a block to drill into floors and flats</CardDescription>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {(blocks ?? Array.from({ length: 3 })).map((b: SocietyBlockRow | undefined, i) => (
            <button
              key={b?.id ?? i}
              onClick={() => b && onSelectBlock(b.id)}
              disabled={!b}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-amp-500 hover:bg-amp-500/5 disabled:animate-pulse disabled:bg-slate-50"
            >
              {b && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold text-grid-900">{b.name}</span>
                    {b.aboveAverage && <Badge variant="high">Above avg</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{b.flatCount} flats</span>
                    <span className="font-mono-data font-semibold text-grid-900">{b.liveKw} kW live</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Today: {b.todayKwh} kWh</span>
                    <span>MTD: {b.mtdKwh} kWh</span>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Common areas</CardTitle>
            <CardDescription>Lifts, pumps, lighting &amp; recreational assets</CardDescription>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-4">
          {(commonAreas ?? []).map((ca) => (
            <div key={ca.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{ca.category}</p>
              <p className="font-display text-sm font-semibold text-grid-900">{ca.name}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <StatusDot status={ca.type} />
                  {/* {ca.type === "Parking" ? "On" : "Off"} */}
                </span>
                <span className="font-mono-data text-xs font-semibold text-grid-900">{ca.currentKw.toFixed(1)} kW</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Heatmap grid={heatmap} loading={!heatmap} />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Flats</CardTitle>
            <CardDescription>Search, sort and jump to any flat's dashboard</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search flat or resident" className="w-56 pl-9" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "mtdKwh" ? "flatNumber" : "mtdKwh")}>
              Sort: {sortBy === "mtdKwh" ? "Usage" : "Flat #"}
            </Button>
          </div>
        </CardHeader>
        <div className="px-5 pb-5 pt-3">
          <Table>
            <Thead>
              <tr>
                <Th>Flat</Th>
                <Th>Block</Th>
                <Th>Floor</Th>
                <Th>Resident</Th>
                <Th>Meter</Th>
                <Th>Month kWh</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {(flats ?? []).map((f) => (
                <Tr key={f.id} onClick={() => onSelectFlat(f.id)} className="cursor-pointer">
                  <Td className="font-medium text-grid-900">{f.flatNumber}</Td>
                  <Td>{f.blockName}</Td>
                  <Td>{f.floorNumber}</Td>
                  <Td>{f.residentName ?? <span className="text-slate-400">Vacant</span>}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      <StatusDot status={f.meterStatus} /> {f.meterStatus === "live" ? "Live" : f.meterStatus === "offline" ? "Offline" : "Offline"}
                    </span>
                  </Td>
                  <Td className="font-mono-data">{f.mtdKwh}</Td>
                  <Td>
                    <ChevronRight size={15} className="text-slate-300" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function BlockFloorList({ blockId, onSelectFloor }: { blockId: string; onSelectFloor: (id: string) => void }) {
  const [floors, setFloors] = useState<BlockFloorRow[] | null>(null);
  const block = db.blockById.get(blockId)!;

  useEffect(() => {
    api.getBlockFloors(blockId).then(setFloors);
  }, [blockId]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{block.name} — floors</CardTitle>
          <CardDescription>Click a floor to see its flats</CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-4">
        {(floors ?? Array.from({ length: 4 })).map((f: BlockFloorRow | undefined, i) => (
          <button
            key={f?.id ?? i}
            onClick={() => f && onSelectFloor(f.id)}
            disabled={!f}
            className="flex flex-col gap-1.5 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-amp-500 hover:bg-amp-500/5 disabled:animate-pulse disabled:bg-slate-50"
          >
            {f && (
              <>
                <span className="font-display text-sm font-semibold text-grid-900">Floor {f.floorNumber}</span>
                <span className="text-xs text-slate-500">{f.flatCount} flats</span>
                <span className="font-mono-data text-xs font-semibold text-grid-900">{f.mtdKwh} kWh MTD</span>
              </>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

function FloorFlatList({ floorId, onSelectFlat }: { floorId: string; onSelectFlat: (id: string) => void }) {
  const [flats, setFlats] = useState<FloorFlatRow[] | null>(null);
  const floor = db.floorById.get(floorId)!;

  useEffect(() => {
    api.getFloorFlatsList(floorId).then(setFlats);
  }, [floorId]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Floor {floor.floorNumber} — flats</CardTitle>
          <CardDescription>Click a flat to open its dashboard</CardDescription>
        </div>
      </CardHeader>
      <div className="px-5 pb-5 pt-2">
        <Table>
          <Thead>
            <tr>
              <Th>Flat</Th>
              <Th>Type</Th>
              <Th>Resident</Th>
              <Th>Meter</Th>
              <Th>Month kWh</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {(flats ?? []).map((f) => (
              <Tr key={f.id} onClick={() => onSelectFlat(f.id)} className="cursor-pointer">
                <Td className="font-medium text-grid-900">{f.flatNumber}</Td>
                <Td>{f.bhkType}</Td>
                <Td>{f.residentName ?? <span className="text-slate-400">Vacant</span>}</Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={f.meterStatus} /> {f.meterStatus === "live" ? "Live" : "Offline"}
                  </span>
                </Td>
                <Td className="font-mono-data">{f.mtdKwh}</Td>
                <Td><ChevronRight size={15} className="text-slate-300" /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
