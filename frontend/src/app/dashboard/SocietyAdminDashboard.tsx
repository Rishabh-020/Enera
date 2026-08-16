import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ChevronRight, ArrowLeft, Eye } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_SOCIETY } from "../../components/layout/DashboardLayout";
import { FlatDashboardView } from "../../components/FlatDashboardView";
import { Card, CardHeader, CardTitle, CardDescription, Breadcrumb, Table, Thead, Th, Td, Tr, type BreadcrumbItem } from "../../components/ui/primitives";
import type { BlockFloorRow, FloorFlatRow, SocietyFlatRow } from "../../lib/types";

import { DashboardTab } from "./society/DashboardTab";
import { AnalyticsTab } from "./society/AnalyticsTab";
import { AlertsTab } from "./society/AlertsTab";
import { ResidentsTab } from "./society/ResidentsTab";
import { BillingTab } from "./society/BillingTab";
import { SettingsTab } from "./society/SettingsTab";

export default function SocietyAdminDashboard() {
  const { societyId } = useParams<{ societyId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const readOnly = searchParams.get("readonly") === "true";

  const initialTab = searchParams.get("tab") || "dashboard";
  const [activeKey, setActiveKey] = useState(initialTab);

  // Sync state with URL search parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveKey(tab);
    }
  }, [searchParams]);

  // drill-down state: block -> floor -> flat
  const [blockId, setBlockId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);
  const [flatId, setFlatId] = useState<string | null>(null);

  const [societyName, setSocietyName] = useState<string>("");
  const [blockName, setBlockName] = useState<string>("");
  const [floorLabel, setFloorLabel] = useState<string>("");
  const [flatLabel, setFlatLabel] = useState<string>("");

  const [flats, setFlats] = useState<SocietyFlatRow[] | null>(null);
  const [anomalies, setAnomalies] = useState([
    { id: "a1", flat: "Flat 402", desc: "Drawing 5.8 kWh at 2:00 AM — expected 1.8 kWh", multiplier: "3.2x usual", resolved: false },
    { id: "a2", flat: "Flat 112", desc: "Drawing 4.2 kWh at 11:00 PM — expected 1.5 kWh", multiplier: "2.8x usual", resolved: false },
  ]);

  useEffect(() => {
    if (societyId) {
      api.getSocietyOverview(societyId).then((o) => {
        if (o.name) setSocietyName(o.name);
      });
      api.getSocietyFlatsList(societyId).then(setFlats);
    }
  }, [societyId]);

  function reset() {
    setBlockId(null);
    setFloorId(null);
    setFlatId(null);
  }

  function selectBlock(id: string, name: string) {
    setBlockId(id);
    setBlockName(name);
    setFloorId(null);
    setFlatId(null);
  }

  function selectFloor(id: string, floorNumber: number) {
    setFloorId(id);
    setFloorLabel(`Floor ${floorNumber}`);
    setFlatId(null);
  }

  function selectFlat(id: string, flatNumber?: string) {
    setFlatId(id);
    if (flatNumber) setFlatLabel(`Flat ${flatNumber}`);
  }

  const crumbs: BreadcrumbItem[] = [{ label: societyName || "Society", onClick: reset }];
  if (blockId) crumbs.push({ label: blockName, onClick: () => { setFloorId(null); setFlatId(null); } });
  if (floorId) crumbs.push({ label: floorLabel, onClick: () => setFlatId(null) });
  if (flatId) crumbs.push({ label: flatLabel });

  const handleNav = (key: string) => {
    if (key === "devices") {
      navigate(`/society/${societyId}/devices`);
    } else {
      reset();
      setSearchParams({ tab: key });
      setActiveKey(key);
    }
  };

  return (
    <DashboardLayout
      nav={readOnly
        ? [{ key: "dashboard", label: "Dashboard", icon: <Building2 size={16} /> }]
        : NAV_ITEMS_SOCIETY
      }
      activeKey={activeKey}
      onNav={handleNav}
      banner={
        readOnly && (
          <div className="flex items-center justify-between border-b border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-amber-50/80 px-4 py-2.5 text-xs font-medium text-amber-900 md:px-8 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 items-center rounded-md bg-amber-500/15 border border-amber-300/80 px-2 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                Read-Only
              </span>
              <span>Viewing as <strong>Builder Admin</strong></span>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-900 shadow-2xs transition-all duration-150 hover:bg-amber-100 hover:border-amber-400 hover:shadow-xs cursor-pointer"
            >
              ← Back to portfolio
            </button>
          </div>
        )
      }
    >
      {/* Hide standard header inside sub-tabs unless in dashboard drilldown */}
      {(flatId || floorId || blockId) && (
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Society Admin</p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold text-slate-900">{societyName || "Loading…"}</h1>
          </div>
          <div className="mt-2">
            <Breadcrumb items={crumbs} />
          </div>
        </div>
      )}

      {flatId ? (
        <FlatDashboardView flatId={flatId} />
      ) : floorId ? (
        <FloorFlatList floorId={floorId} onSelectFlat={(id, flatNumber) => selectFlat(id, flatNumber)} />
      ) : blockId ? (
        <BlockFloorList blockId={blockId} onSelectFloor={(id, floorNumber) => selectFloor(id, floorNumber)} />
      ) : (
        /* Render Sidebar Views */
        <>
          {activeKey === "dashboard" && (
            <DashboardTab
              societyId={societyId ?? ""}
              onSelectBlock={selectBlock}
              onSelectFlat={selectFlat}
              anomalies={anomalies}
              setAnomalies={setAnomalies}
              flats={flats}
            />
          )}

          {activeKey === "analytics" && (
            <AnalyticsTab societyId={societyId ?? ""} />
          )}

          {activeKey === "alerts" && (
            <AlertsTab anomalies={anomalies} setAnomalies={setAnomalies} />
          )}

          {activeKey === "residents" && (
            <ResidentsTab flats={flats} onSelectFlat={selectFlat} />
          )}

          {activeKey === "billing" && (
            <BillingTab flats={flats} />
          )}

          {activeKey === "settings" && (
            <SettingsTab />
          )}
        </>
      )}
    </DashboardLayout>
  );
}

/* ──────────────────────── Drill-down Lists ──────────────────────── */

function BlockFloorList({ blockId, onSelectFloor }: { blockId: string; onSelectFloor: (id: string, floorNumber: number) => void }) {
  const [floors, setFloors] = useState<BlockFloorRow[] | null>(null);

  useEffect(() => {
    api.getBlockFloors(blockId).then(setFloors);
  }, [blockId]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Floors</CardTitle>
          <CardDescription>Click a floor to see its flats</CardDescription>
        </div>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 px-5 pb-5 sm:grid-cols-3 lg:grid-cols-4">
        {(floors ?? Array.from({ length: 4 })).map((f: BlockFloorRow | undefined, i) => (
          <button
            key={f?.id ?? i}
            onClick={() => f && onSelectFloor(String(f.id), f.floorNumber)}
            disabled={!f}
            className="flex flex-col gap-1.5 rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-sm disabled:animate-pulse disabled:bg-slate-50 cursor-pointer"
          >
            {f && (
              <>
                <span className="font-display text-sm font-semibold text-slate-900">Floor {f.floorNumber}</span>
                <span className="text-xs text-slate-500">{f.flatCount} flats</span>
                <span className="font-mono-data text-xs font-semibold text-slate-900">{f.mtdKwh} kWh MTD</span>
              </>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}

function FloorFlatList({ floorId, onSelectFlat }: { floorId: string; onSelectFlat: (id: string, flatNumber: string) => void }) {
  const [flats, setFlats] = useState<FloorFlatRow[] | null>(null);

  useEffect(() => {
    api.getFloorFlatsList(floorId).then(setFlats);
  }, [floorId]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Flats</CardTitle>
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
              <Tr key={f.id} onClick={() => onSelectFlat(String(f.id), f.flatNumber)} className="cursor-pointer">
                <Td className="font-medium text-slate-900">{f.flatNumber}</Td>
                <Td>{f.bhkType}</Td>
                <Td>{f.residentName ?? <span className="text-slate-400">Vacant</span>}</Td>
                <Td>
                  <span className="flex items-center gap-1.5">
                    {/* <StatusDot status={f.meterStatus} /> {f.meterStatus === "live" ? "Live" : "Offline"} */}
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
  );
}
