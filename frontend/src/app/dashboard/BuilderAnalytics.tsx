import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { DashboardLayout, NAV_ITEMS_BUILDER } from "../../components/layout/DashboardLayout";
import { AnalyticsView } from "../../components/chart/AnalyticsView";
import type { BuilderSocietyRow } from "../../lib/types";

export default function BuilderAnalytics() {
  const { builderId } = useParams<{ builderId: string }>();
  const navigate = useNavigate();
  const { session, isDemoMode } = useAuth();
  const [societies, setSocieties] = useState<BuilderSocietyRow[] | null>(null);

  useEffect(() => {
    if (builderId && (session || isDemoMode)) {
      api.getBuilderSocieties(builderId).then(setSocieties).catch(() => {});
    }
  }, [builderId, session, isDemoMode]);

  const filterOptions = useMemo(() => {
    const names = (societies ?? []).map((s) => s.name);
    return names.length > 0
      ? ["All societies", ...names, "Common areas"]
      : ["All societies", "Block A", "Block B", "Common areas"];
  }, [societies]);

  const handleNav = (key: string) => {
    if (key === "portfolio") navigate(`/builder/${builderId}/portfolio`);
  };

  return (
    <DashboardLayout
      nav={NAV_ITEMS_BUILDER}
      activeKey="analytics"
      onNav={handleNav}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-grid-900">Analytics</h1>
        <p className="text-sm text-slate-500">Deep dive into consumption patterns</p>
      </div>
      <AnalyticsView filters={filterOptions} />
    </DashboardLayout>
  );
}

