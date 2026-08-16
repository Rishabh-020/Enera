import { useParams } from "react-router-dom";
import { DashboardLayout, NAV_ITEMS_RESIDENT } from "../../components/layout/DashboardLayout";
import { FlatDashboardView } from "../../components/FlatDashboardView";

export default function FlatOwnerDashboard() {
  const { flatId } = useParams<{ flatId: string }>();

  return (
    <DashboardLayout
      nav={NAV_ITEMS_RESIDENT}
      activeKey="dashboard"
    >
      <FlatDashboardView flatId={flatId!} />
    </DashboardLayout>
  );
}
