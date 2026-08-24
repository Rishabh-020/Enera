import type { ReactElement } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role, User } from "../lib/types";

const HOME_BY_ROLE: Record<Role, (user: User) => string> = {
  RESIDENT: (user) => `/flat/${user.flatId || "1"}`,
  SOCIETY_ADMIN: (user) => `/society/${user.societyId || "1"}`,
  BUILDER_ADMIN: (user) => `/builder/${user.builderId || "1"}`,
  SUPER_ADMIN: (user) => `/superAdmin/${user.id || "1"}`,
};

interface RequireRoleProps {
  roles: Role[];
  children: ReactElement;
}

export function RequireRole({ roles, children }: RequireRoleProps): ReactElement {
  const { user, isDemoMode } = useAuth();
  const params = useParams<{ flatId?: string; societyId?: string; builderId?: string; id?: string }>();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Allow unrestricted navigation in interactive demo mode
  if (isDemoMode) {
    return children;
  }

  // 1. Role-based Authorization check
  if (!roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role](user)} replace />;
  }

  // 2. Resource Ownership Guards
  // Resident: Restrict to only their assigned flat
  if (user.role === "RESIDENT" && params.flatId && user.flatId && String(user.flatId) !== String(params.flatId)) {
    return <Navigate to={`/flat/${user.flatId}`} replace />;
  }

  // Society Admin: Restrict to only their assigned society
  if (user.role === "SOCIETY_ADMIN" && params.societyId && user.societyId && String(user.societyId) !== String(params.societyId)) {
    return <Navigate to={`/society/${user.societyId}`} replace />;
  }

  // Builder Admin: Restrict to only their assigned builder organization
  if (user.role === "BUILDER_ADMIN" && params.builderId && user.builderId && String(user.builderId) !== String(params.builderId)) {
    return <Navigate to={`/builder/${user.builderId}`} replace />;
  }

  return children;
}
