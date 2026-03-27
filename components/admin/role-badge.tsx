import type { AccountRole } from "@/lib/auth/auth.types";

interface RoleBadgeProps {
  role: AccountRole;
}

const roleClasses: Record<AccountRole, string> = {
  ADMIN: "bg-slate-900 text-white ring-slate-900/10",
  LIBRARIAN: "bg-teal-50 text-teal-700 ring-teal-200",
  LEADER: "bg-amber-50 text-amber-700 ring-amber-200",
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        roleClasses[role]
      }`}
    >
      {role}
    </span>
  );
}
