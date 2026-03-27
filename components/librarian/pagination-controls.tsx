import Link from "next/link";

import { buildHref } from "@/lib/librarian/utils";

interface PaginationControlsProps {
  pathname: string;
  params: Record<string, string | number | undefined>;
  pageParamName?: string;
  page: number;
  totalPages: number;
  total: number;
}

export function PaginationControls({
  pathname,
  params,
  pageParamName = "page",
  page,
  totalPages,
  total,
}: PaginationControlsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Trang {page}/{totalPages} • {total} bản ghi
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={buildHref(pathname, { ...params, [pageParamName]: page - 1 })}
          aria-disabled={page <= 1}
          className={`rounded-xl border px-3 py-2 ${
            page <= 1
              ? "pointer-events-none border-slate-200 text-slate-300"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
          }`}
        >
          Trang trước
        </Link>
        <Link
          href={buildHref(pathname, { ...params, [pageParamName]: page + 1 })}
          aria-disabled={page >= totalPages}
          className={`rounded-xl border px-3 py-2 ${
            page >= totalPages
              ? "pointer-events-none border-slate-200 text-slate-300"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
          }`}
        >
          Trang sau
        </Link>
      </div>
    </div>
  );
}
