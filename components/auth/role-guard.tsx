import type { ReactNode } from "react";

import type { AccountRole } from "@/lib/auth/auth.types";
import { hasRequiredRole } from "@/lib/auth/rbac";

interface RoleGuardProps {
  role: AccountRole;
  allowedRoles: readonly AccountRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({
  role,
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  if (!hasRequiredRole(role, allowedRoles)) {
    return fallback;
  }

  return children;
}
