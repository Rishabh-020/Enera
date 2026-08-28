import { useState, type ReactNode, Component, type ErrorInfo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { DashboardLayout, NAV_ITEMS_RESIDENT } from "../../components/layout/DashboardLayout";
import { FlatDashboardView } from "../../components/FlatDashboardView";
import { Card, CardHeader, CardTitle, CardDescription, Button } from "../../components/ui/primitives";
import { AlertTriangle, FileText, Settings, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border border-red-200 bg-red-50/40 p-6 text-center">
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="p-3 rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Something went wrong loading this view</h3>
            <p className="text-xs text-slate-500 max-w-md">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-2 flex items-center gap-2"
            >
              <RefreshCw size={14} /> Reload Dashboard
            </Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default function FlatOwnerDashboard() {
  const { flatId } = useParams<{ flatId: string }>();
  const { user, isDemoMode } = useAuth();
  const [activeKey, setActiveKey] = useState("dashboard");

  // Enforce flat ownership: redirect residents to their assigned flat if navigating to another flatId
  if (!isDemoMode && user?.role === "RESIDENT" && user.flatId && String(user.flatId) !== String(flatId)) {
    return <Navigate to={`/flat/${user.flatId}`} replace />;
  }

  return (
    <DashboardLayout
      nav={NAV_ITEMS_RESIDENT}
      activeKey={activeKey}
      onNav={setActiveKey}
    >
      <DashboardErrorBoundary>
        {activeKey === "dashboard" && <FlatDashboardView flatId={flatId!} />}

        {activeKey === "bills" && (
          <Card className="border border-[var(--color-sage-mist,#afc4bf)] bg-white p-4 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <FileText size={18} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">My Electricity Bills</CardTitle>
                <CardDescription className="text-xs text-slate-500">Monthly billing statements and payment history</CardDescription>
              </div>
            </CardHeader>
            <div className="py-12 text-center text-xs sm:text-sm text-slate-500">
              No pending bills. Your current billing cycle consumption is up to date.
            </div>
          </Card>
        )}

        {activeKey === "alerts" && (
          <Card className="border border-[var(--color-sage-mist,#afc4bf)] bg-white p-4 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Telemetry Alerts</CardTitle>
                <CardDescription className="text-xs text-slate-500">High load notifications and anomaly alerts</CardDescription>
              </div>
            </CardHeader>
            <div className="py-12 text-center text-xs sm:text-sm text-slate-500">
              All devices operating normally. No active power alerts.
            </div>
          </Card>
        )}

        {activeKey === "settings" && (
          <Card className="border border-[var(--color-sage-mist,#afc4bf)] bg-white p-4 sm:p-6">
            <CardHeader className="p-0 pb-4 border-b border-slate-100 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                <Settings size={18} />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">Meter & Profile Settings</CardTitle>
                <CardDescription className="text-xs text-slate-500">Configure alert thresholds and preferences</CardDescription>
              </div>
            </CardHeader>
            <div className="py-12 text-center text-xs sm:text-sm text-slate-500">
              Threshold alerts configured to 4.0 kW. Smart meter status: Active.
            </div>
          </Card>
        )}
      </DashboardErrorBoundary>
    </DashboardLayout>
  );
}
