import type { ReactNode } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { PaginationControls } from "@/components/librarian/pagination-controls";
import { StatusBadge } from "@/components/librarian/status-badge";
import { formatCount, formatDate } from "@/lib/librarian/presenters";
import type { PaginatedResult, UnreturnedReaderRow } from "@/lib/librarian/types";

interface PaginationConfig {
  pathname: string;
  params: Record<string, string | number | undefined>;
  pageParamName?: string;
}

interface UnreturnedReadersSectionProps {
  data: PaginatedResult<UnreturnedReaderRow>;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  title?: string;
  action?: ReactNode;
  pagination?: PaginationConfig;
}

export function UnreturnedReadersSection({
  data,
  description,
  emptyTitle,
  emptyDescription,
  title = "Unreturned readers",
  action,
  pagination,
}: UnreturnedReadersSectionProps) {
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
          <div className="space-y-4 p-5">
            {data.items.map((reader) => (
              <article
                key={reader.ma_doc_gia}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{reader.ho_ten}</p>
                    <p className="text-sm text-slate-500">
                      {reader.ma_doc_gia} • {reader.lop}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={reader.trang_thai} />
                    <span className="rounded-full border border-[#dce9fb] bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#132b49]">
                      {formatCount(reader.so_phieu_muon_dang_mo)} loan mở
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {reader.phieu_muon_dang_mo.map((loan) => (
                    <div
                      key={`${reader.ma_doc_gia}-${loan.loan_id}`}
                      className="rounded-2xl border border-white bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{loan.ten_dau_sach}</p>
                          <p className="text-sm text-slate-500">
                            {loan.ma_sach} • {loan.ma_dau_sach}
                          </p>
                        </div>
                        <StatusBadge status={loan.tinh_trang} />
                      </div>
                      <p className="mt-3 text-sm text-slate-500">
                        Mượn ngày {formatDate(loan.ngay_muon)}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
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
