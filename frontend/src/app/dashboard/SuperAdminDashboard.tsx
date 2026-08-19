import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Plus, Zap, Shield, Home, Cpu, CheckCircle2, ChevronRight, Layers } from "lucide-react";
import * as api from "../../lib/api";
import { DashboardLayout, NAV_ITEMS_SUPER_ADMIN } from "../../components/layout/DashboardLayout";
import { StatCard } from "../../components/chart/StatCard";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge,
  Table, Thead, Th, Td, Tr, Input, Select, TabPills
} from "../../components/ui/primitives";
import type { SuperAdminOverview, BuilderListItem, BuilderSocietyRow } from "../../lib/types";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [builders, setBuilders] = useState<BuilderListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Forms
  const [builderForm, setBuilderForm] = useState({ name: "", email: "" });
  const [societyForm, setSocietyForm] = useState({
    name: "",
    address: "",
    city: "",
    totalBlocks: 4,
    builderId: 1,
  });
  const [blockForm, setBlockForm] = useState({ blockName: "", societyId: 1 });
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Multi-society list collected from builders
  const [allSocieties, setAllSocieties] = useState<Array<BuilderSocietyRow & { builderName: string; builderId: number }>>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, bList] = await Promise.all([
        api.getSuperAdminOverview().catch(() => null),
        api.getAllBuilders().catch(() => []),
      ]);
      if (ov) setOverview(ov);
      if (bList) setBuilders(bList);

      if (bList && bList.length > 0) {
        setSocietyForm((prev) => ({ ...prev, builderId: bList[0].id }));
      }

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
      if (societiesAcc.length > 0) {
        setBlockForm((prev) => ({ ...prev, societyId: Number(societiesAcc[0].id) }));
      }
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
      setBuilderForm({ name: "", email: "" });
      setActionSuccess(`Builder "${builderForm.name}" created successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error("Create builder error:", err);
      setShowBuilderModal(false);
      setBuilderForm({ name: "", email: "" });
      loadData();
    }
  }

  async function handleCreateSociety(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createSociety({
        name: societyForm.name,
        address: societyForm.address,
        city: societyForm.city,
        totalBlocks: Number(societyForm.totalBlocks),
        builderId: Number(societyForm.builderId),
      });
      setShowSocietyModal(false);
      setSocietyForm({ name: "", address: "", city: "", totalBlocks: 4, builderId: builders[0]?.id || 1 });
      setActionSuccess(`Society "${societyForm.name}" created successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error("Create society error:", err);
      setShowSocietyModal(false);
      loadData();
    }
  }

  async function handleCreateBlock(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createBlock({
        blockName: blockForm.blockName,
        societyId: Number(blockForm.societyId),
      });
      setShowBlockModal(false);
      setBlockForm({ blockName: "", societyId: allSocieties[0]?.id ? Number(allSocieties[0].id) : 1 });
      setActionSuccess(`Block "${blockForm.blockName}" registered successfully!`);
      setTimeout(() => setActionSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error("Create block error:", err);
      setShowBlockModal(false);
      loadData();
    }
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
      onNav={setActiveTab}
    >
      <div className="flex flex-col gap-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="text-teal-600" size={24} />
              <h1 className="font-display text-2xl font-bold text-slate-900">Platform Super Admin</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Global infrastructure control, builder portfolios & smart energy grid provisioning
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setShowBuilderModal(true)}>
              <Plus size={15} /> Add Builder
            </Button>
            <Button variant="teal" size="sm" onClick={() => setShowSocietyModal(true)}>
              <Home size={15} /> Add Society
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowBlockModal(true)}>
              <Layers size={15} /> Add Block
            </Button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 size={18} className="text-emerald-600" />
            {actionSuccess}
          </div>
        )}

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Builders"
            value={overview?.totalBuilders ?? builders.length}
            icon={<Building2 size={18} />}
          />
          <StatCard
            label="Total Societies"
            value={overview?.totalSocieties ?? allSocieties.length}
            icon={<Home size={18} />}
          />
          <StatCard
            label="Connected Meters"
            value={overview?.totalMeters ?? 0}
            unit="Meters"
            icon={<Cpu size={18} />}
          />
          <StatCard
            label="Active Grid Load"
            value={overview?.liveGridKw != null ? overview.liveGridKw.toFixed(1) : "0.0"}
            unit="kW"
            icon={<Zap size={18} />}
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
          <TabPills
            tabs={["overview", "builders", "societies", "topology"]}
            active={activeTab}
            onChange={setActiveTab}
          />
          <div className="w-56 hidden sm:block">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search builders, societies..."
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Quick Builder Summary */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Builder Organizations ({builders.length})</CardTitle>
                  <CardDescription>Major builder enterprises actively managing housing societies</CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab("builders")}>
                  View All Builders <ChevronRight size={14} />
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <Thead>
                    <tr>
                      <Th>Builder Name</Th>
                      <Th>Contact Email</Th>
                      <Th>Societies</Th>
                      <Th>Total Flats</Th>
                      <Th>Active Load (kW)</Th>
                      <Th>Actions</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {builders.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} className="text-center py-6 text-slate-400 text-xs">
                          No builders registered yet. Click "Add Builder" above.
                        </Td>
                      </Tr>
                    ) : (
                      builders.map((b) => (
                        <Tr key={b.id}>
                          <Td className="font-semibold text-slate-800 flex items-center gap-2">
                            <Building2 size={16} className="text-teal-600" />
                            {b.name}
                          </Td>
                          <Td className="text-slate-500 text-xs">{b.email}</Td>
                          <Td>
                            <Badge variant="teal">{b.totalSocieties ?? 0} Societies</Badge>
                          </Td>
                          <Td className="font-mono-data">{b.totalFlats ?? 0} Flats</Td>
                          <Td className="font-mono-data font-semibold text-slate-800">
                            {b.liveKw != null ? `${b.liveKw} kW` : "0.0 kW"}
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/builder/${b.id}`)}
                            >
                              Open Portfolio <ChevronRight size={12} />
                            </Button>
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
                  <CardDescription>Live societies provisioned with smart metering topology</CardDescription>
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
                          No societies provisioned yet. Click "Add Society" above.
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
                <CardDescription>Housing societies assigned under respective builder portfolios</CardDescription>
              </div>
              <Button size="sm" variant="teal" onClick={() => setShowSocietyModal(true)}>
                <Plus size={14} /> Add New Society
              </Button>
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
                <div>
                  <CardTitle>Provision New Block</CardTitle>
                  <CardDescription>Attach building blocks (Tower A, B, etc.) to an existing society</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBlock} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Select Target Society</label>
                    <Select
                      value={blockForm.societyId}
                      onChange={(e) => setBlockForm({ ...blockForm, societyId: Number(e.target.value) })}
                      required
                    >
                      {allSocieties.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.builderName})</option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Block / Tower Name</label>
                    <Input
                      placeholder="e.g. Block E or Tower 2"
                      value={blockForm.blockName}
                      onChange={(e) => setBlockForm({ ...blockForm, blockName: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" variant="teal" className="mt-2">
                    <Plus size={14} /> Register Block
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Topology Guidelines</CardTitle>
                  <CardDescription>Hierarchy requirements for smart meter commissioning</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">1. Builder Organization</span>
                  <p className="mt-1 text-slate-500">Top-level entity representing developers like Prestige or DLF.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">2. Housing Society</span>
                  <p className="mt-1 text-slate-500">Physical residential complex with unique address, city, and common areas.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-800">3. Blocks, Floors & Flats</span>
                  <p className="mt-1 text-slate-500">Each flat and common area receives an IoT meter ID for live telemetry.</p>
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

      {/* ─── MODAL: ADD SOCIETY ─── */}
      {showSocietyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <Card className="w-full max-w-lg bg-white">
            <CardHeader>
              <div>
                <CardTitle>Add Society to Builder Portfolio</CardTitle>
                <CardDescription>Provision a new housing society under an existing builder</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateSociety} className="p-5 pt-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Select Builder Organization</label>
                <Select
                  value={societyForm.builderId}
                  onChange={(e) => setSocietyForm({ ...societyForm, builderId: Number(e.target.value) })}
                  required
                >
                  {builders.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Society Name</label>
                <Input
                  placeholder="e.g. Green Valley Residency"
                  value={societyForm.name}
                  onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <Input
                    placeholder="e.g. New Delhi"
                    value={societyForm.city}
                    onChange={(e) => setSocietyForm({ ...societyForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700">Initial Blocks Count</label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={societyForm.totalBlocks}
                    onChange={(e) => setSocietyForm({ ...societyForm, totalBlocks: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Address / Location</label>
                <Input
                  placeholder="e.g. Sector 21, Expressway"
                  value={societyForm.address}
                  onChange={(e) => setSocietyForm({ ...societyForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowSocietyModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal">
                  Create Society
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ─── MODAL: ADD BLOCK ─── */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <Card className="w-full max-w-md bg-white">
            <CardHeader>
              <div>
                <CardTitle>Add Block to Society</CardTitle>
                <CardDescription>Register a new tower or block</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateBlock} className="p-5 pt-0 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Target Society</label>
                <Select
                  value={blockForm.societyId}
                  onChange={(e) => setBlockForm({ ...blockForm, societyId: Number(e.target.value) })}
                  required
                >
                  {allSocieties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.builderName})</option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Block Name</label>
                <Input
                  placeholder="e.g. Block E, Tower C"
                  value={blockForm.blockName}
                  onChange={(e) => setBlockForm({ ...blockForm, blockName: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setShowBlockModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal">
                  Add Block
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
