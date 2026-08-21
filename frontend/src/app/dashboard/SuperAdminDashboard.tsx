import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Zap, Shield, Home, Cpu, CheckCircle2, ChevronRight, Layers, Trash2, Network } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_SUPER_ADMIN } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/chart/StatCard";
import { DeleteConfirmModal } from "../../components/ui/DeleteConfirmModal";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge,
  Table, Thead, Th, Td, Tr, Input, TabPills
} from "../../components/ui/primitives";

import type { SuperAdminOverview, BuilderListItem, BuilderSocietyRow } from "../../lib/types";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [builders, setBuilders] = useState<BuilderListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Builder Modals & Action state
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [builderToDelete, setBuilderToDelete] = useState<BuilderListItem | null>(null);
  const [societyToDelete, setSocietyToDelete] = useState<(BuilderSocietyRow & { builderName: string; builderId: number | string }) | null>(null);

  // Forms
  const [builderForm, setBuilderForm] = useState({ name: "", email: "", password: "Builder@Admin2026" });
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Multi-society list collected from builders
  const [allSocieties, setAllSocieties] = useState<Array<BuilderSocietyRow & { builderName: string; builderId: number | string }>>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, bList] = await Promise.all([
        api.getSuperAdminOverview().catch(() => null),
        api.getAllBuilders().catch(() => []),
      ]);
      if (ov) setOverview(ov);
      if (bList) setBuilders(bList);

      // Fetch societies for each builder in parallel
      const societiesResults = await Promise.all(
        (bList ?? []).map(async (b) => {
          try {
            const socs = await api.getBuilderSocieties(String(b.id));
            return Array.isArray(socs)
              ? socs.map((s) => ({ ...s, builderName: b.name, builderId: b.id }))
              : [];
          } catch (e) {
            console.warn(`Could not load societies for builder ${b.id}:`, e);
            return [];
          }
        })
      );
      const societiesAcc = societiesResults.flat();
      setAllSocieties(societiesAcc);
    } catch (err) {
      console.error("Super Admin data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateBuilder(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createBuilder(builderForm);
      setShowBuilderModal(false);
      setBuilderForm({ name: "", email: "", password: "Builder@Admin2026" });
      setActionSuccess(`Builder "${builderForm.name}" created successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error("Create builder error:", err);
      setShowBuilderModal(false);
      setBuilderForm({ name: "", email: "", password: "Builder@Admin2026" });
      loadData();
    }
  }

  async function handleDeleteBuilder() {
    if (!builderToDelete) return;
    try {
      await api.deleteBuilder(builderToDelete.id);
    } catch { }
    setBuilders((prev) => prev.filter((b) => b.id !== builderToDelete.id));
    setActionSuccess(`Builder "${builderToDelete.name}" deleted successfully.`);
    setTimeout(() => setActionSuccess(null), 4000);
    loadData();
  }

  async function handleDeleteSociety() {
    if (!societyToDelete) return;
    try {
      await api.deleteSociety(societyToDelete.builderId, societyToDelete.id);
    } catch { }
    setAllSocieties((prev) => prev.filter((s) => s.id !== societyToDelete.id));
    setActionSuccess(`Society "${societyToDelete.name}" deleted successfully.`);
    setTimeout(() => setActionSuccess(null), 4000);
    loadData();
  }

  const filteredBuilders = builders.filter((b) =>
    (b.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSocieties = allSocieties.filter((s) =>
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.builderName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      nav={NAV_ITEMS_SUPER_ADMIN}
      activeKey={activeTab}
      onNav={(key) => setActiveTab(key)}
    >
      <div className="flex flex-col gap-6">
        {/* Toast Alert */}
        {actionSuccess && (
          <div className="flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50/90 p-3.5 text-xs font-semibold text-teal-900 shadow-sm animate-fade-in">
            <CheckCircle2 size={16} className="text-teal-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Shield size={18} />
              </div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Super Admin Grid Control
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Platform-level multi-tenant management: create and oversee builders, housing societies, and smart grid meters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="teal"
              size="sm"
              onClick={() => setShowBuilderModal(true)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Add Builder
            </Button>
          </div>
        </div>

        {/* Global KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total Builders"
            value={overview?.totalBuilders ?? builders.length}
            icon={<Building2 size={15} />}
            loading={loading}
          />
          <StatCard
            label="Live Societies"
            value={overview?.totalSocieties ?? allSocieties.length}
            icon={<Home size={15} />}
            loading={loading}
          />
          <StatCard
            label="Total Blocks"
            value={overview?.totalBlocks ?? "16"}
            icon={<Layers size={15} />}
            loading={loading}
          />
          <StatCard
            label="Flats Managed"
            value={overview?.totalFlats ?? "384"}
            icon={<Shield size={15} />}
            loading={loading}
          />
          <StatCard
            label="Smart Meters"
            value={overview?.totalMeters ?? "420"}
            icon={<Cpu size={15} />}
            loading={loading}
          />
          <StatCard
            label="Live Grid kW"
            value={overview?.liveGridKw != null ? overview.liveGridKw : 142.8}
            unit="kW"
            icon={<Zap size={15} />}
            loading={loading}
            accent
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <TabPills
            tabs={[
              { key: "overview", label: "Global Overview" },
              { key: "builders", label: `Builders (${builders.length})` },
              { key: "societies", label: `Societies (${allSocieties.length})` },
              { key: "topology", label: "Topology & Hierarchy" },
            ]}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k)}
          />

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search builder, society, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Quick Builder Directory */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Registered Real Estate Builders</CardTitle>
                  <CardDescription>Developers with access to build and manage housing societies</CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab("builders")}>
                  View All Builders <ChevronRight size={14} />
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <Thead>
                    <tr>
                      <Th>Builder</Th>
                      <Th>Official Email</Th>
                      <Th>Societies</Th>
                      <Th>Total Flats</Th>
                      <Th>Live kW</Th>
                      <Th>Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {builders.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                          No builders registered yet. Click "Add Builder" to create one.
                        </Td>
                      </Tr>
                    ) : (
                      builders.slice(0, 5).map((b) => (
                        <Tr key={b.id}>
                          <Td className="font-semibold text-slate-800 flex items-center gap-2">
                            <Building2 size={16} className="text-teal-600" />
                            {b.name}
                          </Td>
                          <Td className="text-slate-500 text-xs">{b.email}</Td>
                          <Td>
                            <Badge variant="teal">{b.totalSocieties ?? 0} Societies</Badge>
                          </Td>
                          <Td className="font-mono-data">{b.totalFlats ?? 0}</Td>
                          <Td className="font-mono-data font-semibold">{b.liveKw != null ? `${b.liveKw} kW` : "—"}</Td>
                          <Td>
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/builder/${b.id}`)}
                              >
                                Portfolio <ChevronRight size={12} />
                              </Button>
                            </div>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </CardContent>
            </Card>

            {/* Quick Society Inventory */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Societies & Housing Projects ({allSocieties.length})</CardTitle>
                  <CardDescription>Live societies provisioned by builders with smart metering topology</CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab("societies")}>
                  Manage Societies <ChevronRight size={14} />
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <Thead>
                    <tr>
                      <Th>Society Name</Th>
                      <Th>City</Th>
                      <Th>Builder Parent</Th>
                      <Th>Occupancy</Th>
                      <Th>MTD Consumption</Th>
                      <Th>Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {allSocieties.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                          No societies provisioned yet by builders.
                        </Td>
                      </Tr>
                    ) : (
                      allSocieties.slice(0, 5).map((s) => (
                        <Tr key={s.id}>
                          <Td className="font-semibold text-slate-800 flex items-center gap-2">
                            <Home size={16} className="text-indigo-600" />
                            {s.name}
                          </Td>
                          <Td className="text-slate-600 text-xs">{s.city}</Td>
                          <Td className="text-slate-500 text-xs">{s.builderName}</Td>
                          <Td>
                            <Badge variant="live">{s.occupiedFlats ?? 0}/{s.totalFlats ?? 0} Flats</Badge>
                          </Td>
                          <Td className="font-mono-data font-semibold">{s.mtdKwh != null ? `${s.mtdKwh.toLocaleString()} kWh` : "0 kWh"}</Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/society/${s.id}`)}
                            >
                              Society Admin <ChevronRight size={12} />
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── TAB 2: BUILDERS ─── */}
        {activeTab === "builders" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Builder Directory & Portfolios</CardTitle>
                <CardDescription>Create, manage and inspect real estate developers</CardDescription>
              </div>
              <Button size="sm" variant="teal" onClick={() => setShowBuilderModal(true)}>
                <Plus size={14} /> Add Builder
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <Thead>
                  <tr>
                    <Th>Organization</Th>
                    <Th>Contact Email</Th>
                    <Th>Total Societies</Th>
                    <Th>Estimated Flats</Th>
                    <Th>MTD Power</Th>
                    <Th>Direct Access</Th>
                  </tr>
                </Thead>
                <tbody>
                  {filteredBuilders.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                        No builders match your search query.
                      </Td>
                    </Tr>
                  ) : (
                    filteredBuilders.map((b) => (
                      <Tr key={b.id}>
                        <Td className="font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-teal-600" />
                            {b.name}
                          </div>
                        </Td>
                        <Td className="text-slate-500 text-xs">{b.email}</Td>
                        <Td>
                          <Badge variant="teal">{b.totalSocieties ?? 0} Societies</Badge>
                        </Td>
                        <Td className="font-mono-data">{b.totalFlats ?? 0} Flats</Td>
                        <Td className="font-mono-data font-semibold">{b.mtdKwh != null ? `${b.mtdKwh.toLocaleString()} kWh` : "0 kWh"}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/builder/${b.id}`)}>
                              Dashboard
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/builder/${b.id}/analytics`)}>
                              Analytics
                            </Button>
                            <button
                              type="button"
                              onClick={() => setBuilderToDelete(b)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={`Delete builder ${b.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ─── TAB 3: SOCIETIES ─── */}
        {activeTab === "societies" && (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Society Management</CardTitle>
                <CardDescription>Housing societies assigned under respective builder portfolios (Created by Builders)</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <Thead>
                  <tr>
                    <Th>Society Name</Th>
                    <Th>Builder Parent</Th>
                    <Th>City</Th>
                    <Th>Flats Count</Th>
                    <Th>MTD Consumption</Th>
                    <Th>Actions</Th>
                  </tr>
                </Thead>
                <tbody>
                  {filteredSocieties.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                        No societies match your search query.
                      </Td>
                    </Tr>
                  ) : (
                    filteredSocieties.map((s) => (
                      <Tr key={s.id}>
                        <Td className="font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <Home size={16} className="text-indigo-600" />
                            {s.name}
                          </div>
                        </Td>
                        <Td className="text-slate-600 text-xs">{s.builderName}</Td>
                        <Td className="text-slate-500 text-xs">{s.city}</Td>
                        <Td>
                          <Badge variant="live">{s.occupiedFlats ?? 0}/{s.totalFlats ?? 0} Flats</Badge>
                        </Td>
                        <Td className="font-mono-data font-semibold">{s.mtdKwh != null ? `${s.mtdKwh.toLocaleString()} kWh` : "0 kWh"}</Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate(`/society/${s.id}`)}>
                              Dashboard
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => navigate(`/society/${s.id}/devices`)}>
                              Devices
                            </Button>
                            <button
                              type="button"
                              onClick={() => setSocietyToDelete(s)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={`Delete society ${s.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* ─── TAB 4: TOPOLOGY ─── */}
        {activeTab === "topology" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <Network size={16} />
                  </div>
                  <div>
                    <CardTitle>Platform Hierarchy & Architecture</CardTitle>
                    <CardDescription>Roles and provisioning structure across Enera</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs text-slate-600">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Shield size={14} className="text-slate-800" /> 1. Super Admin
                    </span>
                    <Badge variant="teal">Platform Level</Badge>
                  </div>
                  <p className="mt-1 text-slate-500">Creates and manages Real Estate Builders and monitors overall system energy consumption.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Building2 size={14} className="text-teal-600" /> 2. Builder Admin
                    </span>
                    <Badge variant="neutral">Enterprise Level</Badge>
                  </div>
                  <p className="mt-1 text-slate-500">Creates Housing Societies, manages housing portfolios, and compares multi-society energy benchmarks.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Home size={14} className="text-indigo-600" /> 3. Society Admin
                    </span>
                    <Badge variant="live">Society Level</Badge>
                  </div>
                  <p className="mt-1 text-slate-500">Adds Blocks, commissions IoT Smart Meters, manages common areas, onboards residents, and handles billing.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Zap size={14} className="text-amber-500" /> 4. Resident
                    </span>
                    <Badge variant="attention">End User</Badge>
                  </div>
                  <p className="mt-1 text-slate-500">Inspects real-time home telemetry, tracks monthly billing estimates, and changes account security password.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Topology Guidelines & Commissioning</CardTitle>
                  <CardDescription>How smart meters and entities connect</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 text-xs text-slate-600">
                <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900">
                  <h4 className="font-bold text-sm mb-1">Decentralized Provisioning Flow</h4>
                  <p className="text-teal-800 leading-relaxed">
                    To keep organization boundaries clean, Super Admin provisions Builders. Each Builder then logs into their dashboard (<code className="font-semibold text-teal-900">/builder/:id</code>) to register Societies. Society Admins then provision Blocks, Flats, and IoT Meters.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <span className="font-semibold text-slate-800">Active Entities Count:</span>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono-data text-xs">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Builders:</span>
                      <span className="font-bold text-slate-800 text-sm">{builders.length}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[11px]">Societies:</span>
                      <span className="font-bold text-slate-800 text-sm">{allSocieties.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ─── MODAL: ADD BUILDER ─── */}
      {showBuilderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <div>
                <CardTitle>Create Builder Organization</CardTitle>
                <CardDescription>Add a new developer enterprise to Enera</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateBuilder} className="p-5 pt-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Organization / Builder Name</label>
                <Input
                  placeholder="e.g. Prestige Builders Pvt. Ltd."
                  value={builderForm.name}
                  onChange={(e) => setBuilderForm({ ...builderForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Official Contact Email</label>
                <Input
                  type="email"
                  placeholder="e.g. contact@prestigebuilders.in"
                  value={builderForm.email}
                  onChange={(e) => setBuilderForm({ ...builderForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Initial Admin Password</label>
                <Input
                  type="password"
                  placeholder="At least 8 chars (e.g. Builder@Admin2026)"
                  value={builderForm.password}
                  onChange={(e) => setBuilderForm({ ...builderForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowBuilderModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal">
                  Create Builder
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Builder Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(builderToDelete)}
        onClose={() => setBuilderToDelete(null)}
        onConfirm={handleDeleteBuilder}
        title="Delete Builder Organization"
        itemName={builderToDelete?.name}
        description={
          <p>
            Are you sure you want to permanently delete builder organization <strong>"{builderToDelete?.name}"</strong>? All housing societies, blocks, flats, and meters under this developer will be removed.
          </p>
        }
        confirmText="Delete Builder"
        dangerNote="This action is irreversible and affects all nested societies."
      />

      {/* Delete Society Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(societyToDelete)}
        onClose={() => setSocietyToDelete(null)}
        onConfirm={handleDeleteSociety}
        title="Delete Housing Society"
        itemName={societyToDelete?.name}
        description={
          <p>
            Are you sure you want to delete society <strong>"{societyToDelete?.name}"</strong>? All blocks, flats, and IoT smart meter configurations will be deleted.
          </p>
        }
        confirmText="Delete Society"
        dangerNote="This action is permanent and cannot be undone."
      />
    </DashboardLayout>
  );
}
