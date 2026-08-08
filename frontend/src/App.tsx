import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RequireRole } from "./components/RequireRole";
import Login from "./app/login/LogIn";
import FlatOwnerDashboard from "./app/dashboard/FlatOwnerDashboard";
import SocietyAdminDashboard from "./app/dashboard/SocietyAdminDashboard";
import DeviceManagement from "./app/dashboard/DeviceManagement";
import BuilderAdminDashboard from "./app/dashboard/BuilderAdminDashboard";

function Root() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "RESIDENT") {
    return <Navigate to={`/flat/${user.flatId}`} replace />;
  }

  if (user.role === "SOCIETY_ADMIN") {
    return <Navigate to={`/society/${user.societyId}`} replace />;
  }

  if (user.role === "BUILDER_ADMIN") {
    return <Navigate to={`/builder/${user.builderId}`} replace />;
  }

  if (user.role === "SUPER_ADMIN") {
    return <Navigate to={`/superAdmin/${user.id}`} replace />;
  }
}

export default function App() {
  return (
    <AuthProvider>
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
            path="/superAdmin"
            element={
              <RequireRole roles={["SUPER_ADMIN"]}>
                {/* <SuperAdminDashboard /> */}
                <p>Super Admin Dashboard</p>
              </RequireRole>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
