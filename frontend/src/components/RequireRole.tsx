import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role, User } from "../lib/types";

const HOME_BY_ROLE: Record<Role, (user: User) => string> = {
  flat_owner: (user) => `/flat/${user.flatId}`,
  society_admin: (user) => `/society/${user.societyId}`,
  builder_admin: (user) => `/builder/${user.builderId}`,
};

interface RequireRoleProps {
  roles: Role[];
  children: ReactElement;
}

export function RequireRole({ roles, children }: RequireRoleProps): ReactElement {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role](user)} replace />;
  return children;
}
