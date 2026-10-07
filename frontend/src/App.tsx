import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RequireRole } from "./components/RequireRole";
import { EnergyWebSocketProvider } from "./context/WebSocketContext";
import { ToastContainer } from "./components/ui/Toast";
import { PageLoadingFallback } from "./components/ui/LoadingFallback";

// Dynamically imported route components for code-splitting
const Login = lazy(() => import("./app/login/LogIn"));
const FlatOwnerDashboard = lazy(() => import("./app/dashboard/FlatOwnerDashboard"));
const SocietyAdminDashboard = lazy(() => import("./app/dashboard/SocietyAdminDashboard"));
const DeviceManagement = lazy(() => import("./app/dashboard/DeviceManagement"));
const BuilderAdminDashboard = lazy(() => import("./app/dashboard/BuilderAdminDashboard"));
const BuilderAnalytics = lazy(() => import("./app/dashboard/BuilderAnalytics"));
const SuperAdminDashboard = lazy(() => import("./app/dashboard/SuperAdminDashboard"));

function Root() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const routes: Record<string, string> = {
    RESIDENT: `/flat/${user.flatId || "1"}`,
    SOCIETY_ADMIN: `/society/${user.societyId || "1"}`,
    BUILDER_ADMIN: `/builder/${user.builderId || "1"}`,
    SUPER_ADMIN: `/superAdmin/${user.id || "1"}`,
  };

  return <Navigate to={routes[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <EnergyWebSocketProvider>
        <ToastContainer />
        <BrowserRouter>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={<Root />} />

              <Route
                path="/flat/:flatId"
                element={
                  <RequireRole roles={["RESIDENT"]}>
                    <FlatOwnerDashboard />
                  </RequireRole>
                }
              />

              <Route
                path="/society/:societyId"
                element={
                  <RequireRole roles={["SOCIETY_ADMIN", "BUILDER_ADMIN"]}>
                    <SocietyAdminDashboard />
                  </RequireRole>
                }
              />

              <Route
                path="/society/:societyId/devices"
                element={
                  <RequireRole roles={["SOCIETY_ADMIN", "BUILDER_ADMIN"]}>
                    <DeviceManagement />
                  </RequireRole>
                }
              />

              <Route
                path="/builder/:builderId"
                element={
                  <RequireRole roles={["BUILDER_ADMIN", "SUPER_ADMIN"]}>
                    <BuilderAdminDashboard />
                  </RequireRole>
                }
              />

              <Route
                path="/builder/:builderId/analytics"
                element={
                  <RequireRole roles={["BUILDER_ADMIN", "SUPER_ADMIN"]}>
                    <BuilderAnalytics />
                  </RequireRole>
                }
              />

              <Route
                path="/superAdmin/:id"
                element={
                  <RequireRole roles={["SUPER_ADMIN"]}>
                    <SuperAdminDashboard />
                  </RequireRole>
                }
              />

              <Route
                path="/superAdmin"
                element={
                  <RequireRole roles={["SUPER_ADMIN"]}>
                    <SuperAdminDashboard />
                  </RequireRole>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </EnergyWebSocketProvider>
    </AuthProvider>
  );
}
