import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LayoutGrid, Building2, Users, Zap, ChevronRight, ArrowUpDown } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/chart/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, Button, Table, Thead, Th, Td, Tr } from "../../components/ui/primitives";
import type { BuilderOverview, BuilderSocietyRow } from "../../lib/types";

export default function BuilderAdminDashboard() {
  const { builderId } = useParams<{ builderId: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<BuilderOverview | null>(null);
  const [societies, setSocieties] = useState<BuilderSocietyRow[] | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!builderId) return;

    api.getBuilderOverview(builderId).then(setOverview);

    api.getBuilderSocieties(builderId).then(setSocieties);
  }, [builderId]);

  const sorted = societies ? [...societies].sort((a, b) => (sortDir === "desc" ?
    b.mtdKwh - a.mtdKwh : a.mtdKwh - b.mtdKwh)) : null;

  return (
    <DashboardLayout nav={[{
      key: "dashboard", label: "Portfolio",
      icon: <LayoutGrid size={16} />
    }]} activeKey="dashboard">
      <div className="mb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Builder Admin</p>
        <h1 className="font-display text-2xl font-bold text-grid-900">Portfolio overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Societies" value={overview ? overview.totalSocieties : "—"}
          icon={<Building2 size={16} />} loading={!overview} accent />
        <StatCard label="Total flats" value={overview ? overview.totalFlats : "—"}
          sub={overview ? `${overview.devicesOnline} meters live` : ""} icon={<Users size={16} />}
          loading={!overview} />
        <StatCard label="Month-to-date" value={overview ? `${overview.mtdKwh} kWh` : "—"}
          sub={overview ? `₹${overview.mtdCost.toLocaleString("en-IN")}` : ""} icon={<Zap size={16} />}
          loading={!overview} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div>
            <CardTitle>Societies</CardTitle>
            <CardDescription>Read-only — click a society to drill into blocks, floors and flats</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}>
            <ArrowUpDown size={13} /> Sort by usage
          </Button>
        </CardHeader>
        <div className="px-5 pb-5 pt-2">
          <Table>
            <Thead>
              <tr>
                <Th>Society</Th>
                <Th>City</Th>
                <Th>Flats</Th>
                <Th>Month kWh</Th>
                <Th>Avg / flat</Th>
                <Th></Th>
              </tr>
            </Thead>
            <tbody>
              {(sorted ?? []).map((s) => (
                <Tr key={s.id} onClick={() => navigate(`/society/${s.id}?readonly=true`)} className="cursor-pointer">
                  <Td className="font-medium text-grid-900">{s.name}</Td>
                  <Td>{s.city}</Td>
                  <Td>{s.occupiedFlats}/{s.totalFlats}</Td>
                  <Td className="font-mono-data">{s.mtdKwh}</Td>
                  <Td className="font-mono-data">{s.avgPerFlat} kWh</Td>
                  <Td><ChevronRight size={15} className="text-slate-300" /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
  );
}
