import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RequireRole } from "./components/RequireRole";
import Login from "./app/login/LogIn";
import { EnergyWebSocketProvider } from "./context/WebSocketContext";
import FlatOwnerDashboard from "./app/dashboard/FlatOwnerDashboard";
import SocietyAdminDashboard from "./app/dashboard/SocietyAdminDashboard";
import DeviceManagement from "./app/dashboard/DeviceManagement";
import BuilderAdminDashboard from "./app/dashboard/BuilderAdminDashboard";
import BuilderAnalytics from "./app/dashboard/BuilderAnalytics";
import SuperAdminDashboard from "./app/dashboard/SuperAdminDashboard";

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
        <BrowserRouter>
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
        </BrowserRouter>
      </EnergyWebSocketProvider>
    </AuthProvider>
  );
}
