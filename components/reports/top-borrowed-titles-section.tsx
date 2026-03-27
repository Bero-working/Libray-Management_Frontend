import type { ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PaginationControls } from "@/components/librarian/pagination-controls";
import { formatCount } from "@/lib/librarian/presenters";
import type { PaginatedResult, TopBorrowedTitleRow } from "@/lib/librarian/types";

interface PaginationConfig {
  pathname: string;
  params: Record<string, string | number | undefined>;
  pageParamName?: string;
}

interface TopBorrowedTitlesSectionProps {
  data: PaginatedResult<TopBorrowedTitleRow>;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  title?: string;
  action?: ReactNode;
  pagination?: PaginationConfig;
}

export function TopBorrowedTitlesSection({
  data,
  description,
  emptyTitle,
  emptyDescription,
  title = "Top borrowed titles",
  action,
  pagination,
}: TopBorrowedTitlesSectionProps) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {data.items.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Hạng</th>
                  <th className="px-5 py-3">Đầu sách</th>
                  <th className="px-5 py-3">Tác giả</th>
                  <th className="px-5 py-3">Chuyên ngành</th>
                  <th className="px-5 py-3 text-right">Lượt mượn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((row) => (
                  <tr key={row.ma_dau_sach}>
                    <td className="px-5 py-4 font-semibold text-slate-900">#{row.rank}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{row.ten_dau_sach}</p>
                      <p className="text-sm text-slate-500">{row.ma_dau_sach}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{row.tac_gia}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {row.ten_chuyen_nganh} ({row.ma_chuyen_nganh})
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                      {formatCount(row.so_luot_muon)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination ? (
            <PaginationControls
              pathname={pagination.pathname}
              params={pagination.params}
              pageParamName={pagination.pageParamName}
              page={data.meta.page}
              total={data.meta.total}
              totalPages={data.meta.totalPages}
            />
          ) : null}
        </>
      ) : (
        <div className="p-5">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      )}
    </section>
  );
}
