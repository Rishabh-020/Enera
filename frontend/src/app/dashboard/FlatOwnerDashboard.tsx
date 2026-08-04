import { useParams } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { FlatDashboardView } from "../../components/FlatDashboardView";

export default function FlatOwnerDashboard() {
  const { flatId } = useParams<{ flatId: string }>();

  return (
    <DashboardLayout
      nav={[{ key: "dashboard", label: "My Dashboard", icon: <LayoutGrid size={16} /> }]}
      activeKey="dashboard"
    >
      <FlatDashboardView flatId={flatId!} />
    </DashboardLayout>
  );
} 
