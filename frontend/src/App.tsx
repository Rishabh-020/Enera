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
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "flat_owner") return <Navigate to={`/flat/${user.flatId}`} replace />;
  if (user.role === "society_admin") return <Navigate to={`/society/${user.societyId}`} replace />;
  return <Navigate to={`/builder/${user.builderId}`} replace />;
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
              <RequireRole roles={["flat_owner"]}>
                <FlatOwnerDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/society/:societyId"
            element={
              <RequireRole roles={["society_admin", "builder_admin"]}>
                <SocietyAdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/society/:societyId/devices"
            element={
              <RequireRole roles={["society_admin"]}>
                <DeviceManagement />
              </RequireRole>
            }
          />
          <Route
            path="/builder/:builderId"
            element={
              <RequireRole roles={["builder_admin"]}>
                <BuilderAdminDashboard />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
