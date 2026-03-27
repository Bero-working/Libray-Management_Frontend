import { forbidden } from "next/navigation";

import type { AccountRole } from "@/lib/auth/auth.types";

export function hasRequiredRole(
  role: AccountRole,
  allowedRoles: readonly AccountRole[]
): boolean {
  return allowedRoles.includes(role);
}

export function assertRole(
  role: AccountRole,
  allowedRoles: readonly AccountRole[]
): void {
  if (!hasRequiredRole(role, allowedRoles)) {
    forbidden();
  }
}
