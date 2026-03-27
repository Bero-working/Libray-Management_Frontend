import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { PaginationControls } from "@/components/librarian/pagination-controls";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import {
  getLibrarianErrorMessage,
  getTopBorrowedTitles,
  getUnreturnedReaders,
} from "@/lib/librarian/data";
import { formatCount, formatDate } from "@/lib/librarian/presenters";
import {
  getFeedbackFromSearchParams,
  readIntSearchParam,
  readTrimmedSearchParam,
} from "@/lib/librarian/utils";
import { APP_ROUTES } from "@/lib/config/routes";

interface ReportsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const inputClass = "ui-input w-full px-4 py-3 text-sm";

function formatLocalDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
}

function getDefaultWindow(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));

  return {
    from: formatLocalDate(from),
    to: formatLocalDate(to),
  };
}

export default async function LibrarianReportsPage({ searchParams }: ReportsPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const defaults = getDefaultWindow(30);

  const from = readTrimmedSearchParam(resolvedSearchParams.from) ?? defaults.from;
  const to = readTrimmedSearchParam(resolvedSearchParams.to) ?? defaults.to;
  const topPage = readIntSearchParam(resolvedSearchParams.top_page, 1, { min: 1, max: 1000 });
  const topLimit = readIntSearchParam(resolvedSearchParams.top_limit, 10, { min: 1, max: 100 });
  const openPage = readIntSearchParam(resolvedSearchParams.open_page, 1, {
    min: 1,
    max: 1000,
  });
  const openLimit = readIntSearchParam(resolvedSearchParams.open_limit, 10, {
    min: 1,
    max: 100,
  });
  let topBorrowedTitles;
  let unreturnedReaders;

  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const daysBetween = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return (
      <ErrorState
        title="Khoảng ngày không hợp lệ"
        description="Bộ lọc báo cáo cần ngày bắt đầu và ngày kết thúc đúng định dạng YYYY-MM-DD."
      />
    );
  }

  if (fromDate > toDate) {
    return (
      <ErrorState
        title="Khoảng ngày bị đảo ngược"
        description="Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc để truy vấn top borrowed titles."
      />
    );
  }

  if (daysBetween > 366) {
    return (
      <ErrorState
        title="Khoảng ngày vượt giới hạn runtime"
        description="Backend hiện giới hạn báo cáo top borrowed trong tối đa 366 ngày cho mỗi lần truy vấn."
      />
    );
  }

  try {
    [topBorrowedTitles, unreturnedReaders] = await Promise.all([
      getTopBorrowedTitles({
        from,
        to,
        page: topPage,
        limit: topLimit,
      }),
      getUnreturnedReaders({
        page: openPage,
        limit: openLimit,
      }),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải màn báo cáo"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const currentOpenLoanCount = unreturnedReaders.items.reduce(
    (total, reader) => total + reader.so_phieu_muon_dang_mo,
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo vận hành"
        description="Tổng hợp 2 báo cáo phase 1 cho Librarian: top borrowed titles theo khoảng ngày và danh sách độc giả còn phiếu mượn mở."
        actions={
          <>
            <Link
              href={APP_ROUTES.librarianLoans}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Quay lại loans
            </Link>
            <Link
              href={APP_ROUTES.librarianSearch}
              className="ui-button-primary px-4 py-3 text-sm font-semibold"
            >
              Tra cứu catalog
            </Link>
          </>
        }
      />

      {feedback ? <FlashBanner tone={feedback.tone} message={feedback.message} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Khoảng ngày"
          value={`${from} -> ${to}`}
          hint="Đang áp dụng cho top borrowed titles"
          accent="blue"
        />
        <StatCard
          label="Đầu sách có lượt mượn"
          value={formatCount(topBorrowedTitles.meta.total)}
          hint="Số title xuất hiện trong kỳ"
          accent="teal"
        />
        <StatCard
          label="Phiếu mở trên trang"
          value={formatCount(currentOpenLoanCount)}
          hint={`${formatCount(unreturnedReaders.meta.total)} độc giả đang có loan mở`}
          accent="amber"
        />
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <form action={APP_ROUTES.librarianReports} className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
          <input type="hidden" name="top_limit" value={String(topLimit)} />
          <input type="hidden" name="open_limit" value={String(openLimit)} />
          <input className={inputClass} type="date" name="from" defaultValue={from} />
          <input className={inputClass} type="date" name="to" defaultValue={to} />
          <button
            type="submit"
            className="ui-button-primary px-4 py-3 text-sm font-semibold"
          >
            Cập nhật kỳ báo cáo
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Top borrowed titles</h2>
            <p className="text-sm text-slate-500">
              {formatCount(topBorrowedTitles.meta.total)} title trong kỳ được chọn
            </p>
          </div>
        </div>

        {topBorrowedTitles.items.length > 0 ? (
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
                  {topBorrowedTitles.items.map((row) => (
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

            <PaginationControls
              pathname={APP_ROUTES.librarianReports}
              params={{
                from,
                to,
                top_limit: topLimit,
                open_page: openPage,
                open_limit: openLimit,
              }}
              pageParamName="top_page"
              page={topBorrowedTitles.meta.page}
              total={topBorrowedTitles.meta.total}
              totalPages={topBorrowedTitles.meta.totalPages}
            />
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có dữ liệu trong kỳ"
              description="Thử mở rộng khoảng ngày hoặc chờ thêm giao dịch mượn mới."
            />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Unreturned readers</h2>
            <p className="text-sm text-slate-500">
              {formatCount(unreturnedReaders.meta.total)} độc giả đang còn loan mở
            </p>
          </div>
        </div>

        {unreturnedReaders.items.length > 0 ? (
          <>
            <div className="space-y-4 p-5">
              {unreturnedReaders.items.map((reader) => (
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

            <PaginationControls
              pathname={APP_ROUTES.librarianReports}
              params={{
                from,
                to,
                top_page: topPage,
                top_limit: topLimit,
                open_limit: openLimit,
              }}
              pageParamName="open_page"
              page={unreturnedReaders.meta.page}
              total={unreturnedReaders.meta.total}
              totalPages={unreturnedReaders.meta.totalPages}
            />
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có độc giả nợ sách"
              description="Danh sách này sẽ xuất hiện khi hệ thống có loan chưa được hoàn tất trả."
            />
          </div>
        )}
      </section>
    </div>
  );
}
