import { getStatusLabel } from "@/lib/librarian/presenters";

interface StatusBadgeProps {
  status: string;
}

const statusClasses: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  BORROWED: "bg-blue-50 text-blue-700 ring-blue-200",
  DAMAGED: "bg-amber-50 text-amber-700 ring-amber-200",
  LOST: "bg-rose-50 text-rose-700 ring-rose-200",
  NEEDS_REVIEW: "bg-violet-50 text-violet-700 ring-violet-200",
  RETURNED: "bg-slate-100 text-slate-700 ring-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOCKED: "bg-amber-50 text-amber-700 ring-amber-200",
  INACTIVE: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusClasses[status] ?? "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
