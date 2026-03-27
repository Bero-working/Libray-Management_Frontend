import Link from "next/link";

import { ApiError } from "@/lib/api/api-errors";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/librarian/page-header";
import { PaginationControls } from "@/components/librarian/pagination-controls";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import {
  getCopies,
  getLibrarianErrorMessage,
  getLoans,
  getReaderDetail,
  getTitles,
} from "@/lib/librarian/data";
import {
  formatCount,
  formatDate,
  getGenderLabel,
  getStatusLabel,
} from "@/lib/librarian/presenters";
import type { Copy, Loan, LoanStatus, Title } from "@/lib/librarian/types";
import {
  buildHref,
  buildLibrarianReaderCardHref,
  readIntSearchParam,
  readTrimmedSearchParam,
  sanitizeLibrarianRedirect,
} from "@/lib/librarian/utils";
import {
  APP_ROUTES,
  getLibrarianReaderDetailRoute,
} from "@/lib/config/routes";

interface ReaderDetailPageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const loanStatuses: Array<LoanStatus | ""> = ["", "BORROWED", "RETURNED", "NEEDS_REVIEW"];

const infoLabelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";

function getReturnLabel(returnTo: string): string {
  if (returnTo.startsWith(APP_ROUTES.librarianLoans)) {
    return "Quay lại loans";
  }

  if (returnTo === APP_ROUTES.librarian) {
    return "Quay lại dashboard";
  }

  return "Quay lại readers";
}

function resolveLoanContext(
  loan: Loan,
  copiesByCode: Map<string, Copy>,
  titlesByCode: Map<string, Title>
) {
  const copy = copiesByCode.get(loan.ma_sach);
  const title = copy ? titlesByCode.get(copy.ma_dau_sach) : null;

  return {
    titleName: title?.ten_dau_sach ?? "Chưa đồng bộ đầu sách",
    titleCode: title?.ma_dau_sach ?? copy?.ma_dau_sach ?? "Không rõ mã đầu sách",
    copyStatus: copy?.tinh_trang ?? null,
  };
}

function buildLoanActionHref(readerCode: string, loan: Loan): string {
  if (loan.tinh_trang !== "BORROWED") {
    return buildHref(APP_ROUTES.librarianLoans, {
      ma_doc_gia: readerCode,
      status: loan.tinh_trang,
    });
  }

  return buildHref(APP_ROUTES.librarianLoans, {
    ma_doc_gia: readerCode,
    status: "BORROWED",
    return_loan: loan.id,
  });
}

export default async function ReaderDetailPage({
  params,
  searchParams,
}: ReaderDetailPageProps) {
  const { code } = await params;
  const resolvedSearchParams = await searchParams;

  const returnTo = sanitizeLibrarianRedirect(
    readTrimmedSearchParam(resolvedSearchParams.return_to),
    APP_ROUTES.librarianReaders
  );
  const loanPage = readIntSearchParam(resolvedSearchParams.loan_page, 1, {
    min: 1,
    max: 1000,
  });
  const loanLimit = readIntSearchParam(resolvedSearchParams.loan_limit, 10, {
    min: 5,
    max: 50,
  });
  const loanStatus = readTrimmedSearchParam(
    resolvedSearchParams.loan_status
  ) as LoanStatus | undefined;

  let reader;
  let loanHistory;
  let openLoans;
  let returnedLoans;
  let reviewLoans;
  let copies;
  let titles;

  try {
    [reader, loanHistory, openLoans, returnedLoans, reviewLoans, copies, titles] =
      await Promise.all([
        getReaderDetail(code),
        getLoans({
          ma_doc_gia: code,
          page: loanPage,
          limit: loanLimit,
          status: loanStatus,
        }),
        getLoans({
          ma_doc_gia: code,
          page: 1,
          limit: 1,
          status: "BORROWED",
        }),
        getLoans({
          ma_doc_gia: code,
          page: 1,
          limit: 1,
          status: "RETURNED",
        }),
        getLoans({
          ma_doc_gia: code,
          page: 1,
          limit: 1,
          status: "NEEDS_REVIEW",
        }),
        getCopies(),
        getTitles(),
      ]);
  } catch (error: unknown) {
    const message =
      error instanceof ApiError && error.status === 404
        ? `Độc giả ${code} không còn tồn tại hoặc đã bị xóa khỏi hệ thống.`
        : getLibrarianErrorMessage(error);

    return (
      <div className="space-y-4">
        <ErrorState
          title={
            error instanceof ApiError && error.status === 404
              ? "Không tìm thấy hồ sơ độc giả"
              : "Không thể tải hồ sơ độc giả"
          }
          description={message}
        />
        <div className="flex justify-center">
          <Link
            href={returnTo}
            className="ui-button-secondary px-4 py-3 text-sm font-semibold"
          >
            {getReturnLabel(returnTo)}
          </Link>
        </div>
      </div>
    );
  }

  const copiesByCode = new Map(copies.map((copy) => [copy.ma_sach, copy]));
  const titlesByCode = new Map(titles.map((title) => [title.ma_dau_sach, title]));
  const activeLoan = openLoans.items[0] ?? null;
  const activeLoanContext = activeLoan
    ? resolveLoanContext(activeLoan, copiesByCode, titlesByCode)
    : null;
  const totalLoanCount =
    openLoans.meta.total + returnedLoans.meta.total + reviewLoans.meta.total;

  const currentReaderRoute = getLibrarianReaderDetailRoute(reader.code);
  const historyFilters = {
    return_to: returnTo !== APP_ROUTES.librarianReaders ? returnTo : undefined,
    loan_limit: loanLimit,
    loan_status: loanStatus,
  };
  const clearHistoryHref = buildHref(currentReaderRoute, {
    return_to: historyFilters.return_to,
    loan_limit: historyFilters.loan_limit,
  });
  const manageLoansHref = buildHref(APP_ROUTES.librarianLoans, {
    ma_doc_gia: reader.code,
  });
  const activeLoanHref = activeLoan
    ? buildHref(APP_ROUTES.librarianLoans, {
        ma_doc_gia: reader.code,
        status: "BORROWED",
        return_loan: activeLoan.id,
      })
    : manageLoansHref;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Phase 4 reader flows"
        title={`Hồ sơ độc giả ${reader.code}`}
        description="Tập trung vào tra cứu nhanh tại quầy: trạng thái thẻ, thông tin cơ bản, phiếu đang mở và toàn bộ lịch sử mượn/trả gắn với độc giả này."
        actions={
          <>
            <Link
              href={returnTo}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              {getReturnLabel(returnTo)}
            </Link>
            <Link
              href={manageLoansHref}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Xem trong loans
            </Link>
            <form
              action={buildLibrarianReaderCardHref(reader.code)}
              method="post"
              target="_blank"
            >
              <button
                type="submit"
                className="ui-button-primary px-4 py-3 text-sm font-semibold"
              >
                In thẻ thư viện
              </button>
            </form>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng lịch sử"
          value={formatCount(totalLoanCount)}
          hint={`${formatCount(loanHistory.meta.total)} bản ghi khớp bộ lọc đang xem`}
          accent="blue"
        />
        <StatCard
          label="Phiếu đang mở"
          value={formatCount(openLoans.meta.total)}
          hint={
            activeLoan
              ? `Đang có phiếu #${activeLoan.id} chờ hoàn tất`
              : "Độc giả hiện không giữ sách nào"
          }
          accent="amber"
        />
        <StatCard
          label="Đã trả"
          value={formatCount(returnedLoans.meta.total)}
          hint="Các phiếu đã hoàn tất bình thường"
          accent="teal"
        />
        <StatCard
          label="Cần kiểm tra"
          value={formatCount(reviewLoans.meta.total)}
          hint="Các lần trả sách cần follow-up thêm"
          accent="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Reader Detail
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {reader.fullName}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {reader.code} • {reader.className}
              </p>
            </div>
            <StatusBadge status={reader.status} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className={infoLabelClass}>Giới tính</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {getGenderLabel(reader.gender)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className={infoLabelClass}>Ngày sinh</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {formatDate(reader.birthDate)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className={infoLabelClass}>Trạng thái thẻ</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {getStatusLabel(reader.status)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
              <p className={infoLabelClass}>Quy tắc nghiệp vụ</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mỗi độc giả chỉ được giữ tối đa 1 phiếu mượn chưa trả tại cùng một
                thời điểm.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Trạng thái hiện tại
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Phần này dùng cho tra cứu nhanh tại quầy trước khi lập phiếu mới
                  hoặc tiếp nhận trả sách.
                </p>
              </div>
              <Link
                href={activeLoanHref}
                className="text-sm font-semibold text-slate-700 hover:text-slate-950"
              >
                {activeLoan ? "Mở luồng trả sách" : "Mở lịch sử loans"}
              </Link>
            </div>

            {activeLoan ? (
              <div className="mt-5 rounded-[1.5rem] border border-white bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {activeLoanContext?.titleName}
                    </p>
                    <p className="text-sm text-slate-500">
                      Loan #{activeLoan.id} • {activeLoan.ma_sach} •{" "}
                      {activeLoanContext?.titleCode}
                    </p>
                  </div>
                  <StatusBadge status={activeLoan.tinh_trang} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className={infoLabelClass}>Ngày mượn</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {formatDate(activeLoan.ngay_muon)}
                    </p>
                  </div>
                  <div>
                    <p className={infoLabelClass}>Tình trạng bản sao</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {activeLoanContext?.copyStatus
                        ? getStatusLabel(activeLoanContext.copyStatus)
                        : "Chưa đồng bộ"}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className={infoLabelClass}>Ghi chú</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {activeLoan.ghi_chu_tinh_trang || "Chưa có ghi chú tình trạng."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-white/80 p-4 text-sm text-slate-600">
                Độc giả hiện không có phiếu mượn mở. Có thể chuyển sang module loans
                để tra lịch sử hoặc lập phiếu mới nếu trạng thái reader hợp lệ.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Thao tác nhanh tại quầy
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Từ hồ sơ reader, thủ thư có thể chuyển thẳng sang đúng flow nghiệp vụ
              mà không phải tra cứu lại từ đầu.
            </p>

            <div className="mt-5 grid gap-3">
              <Link
                href={activeLoanHref}
                className="ui-button-primary px-4 py-3 text-center text-sm font-semibold"
              >
                {activeLoan ? `Xử lý phiếu mở #${activeLoan.id}` : "Mở module loans"}
              </Link>
              <Link
                href={manageLoansHref}
                className="ui-button-secondary px-4 py-3 text-center text-sm font-semibold"
              >
                Lọc loans theo reader này
              </Link>
              <Link
                href={returnTo}
                className="ui-button-secondary px-4 py-3 text-center text-sm font-semibold"
              >
                {getReturnLabel(returnTo)}
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Kiểm tra trước khi thao tác
            </h2>
            <div className="mt-4 space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <div>
                <p className={infoLabelClass}>Reader status</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={reader.status} />
                  <span>{getStatusLabel(reader.status)}</span>
                </div>
              </div>
              <div>
                <p className={infoLabelClass}>Phiếu mở hiện tại</p>
                <p className="mt-2">
                  {openLoans.meta.total > 0
                    ? `${formatCount(openLoans.meta.total)} phiếu BORROWED đang tồn tại`
                    : "Không có phiếu BORROWED"}
                </p>
              </div>
              <div>
                <p className={infoLabelClass}>Lần trả cần review</p>
                <p className="mt-2">
                  {reviewLoans.meta.total > 0
                    ? `${formatCount(reviewLoans.meta.total)} lần trả cần follow-up`
                    : "Chưa ghi nhận lần trả cần review"}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Lịch sử mượn / trả
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {loanStatus
                ? `Đang lọc theo trạng thái ${loanStatus}.`
                : "Hiển thị toàn bộ lịch sử loan của độc giả này."}
            </p>
          </div>
          <Link
            href={manageLoansHref}
            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
          >
            Xem cùng bộ lọc ở màn loans
          </Link>
        </div>

        <form action={currentReaderRoute} className="mt-5 grid gap-4 lg:grid-cols-[220px,auto]">
          <input type="hidden" name="return_to" value={historyFilters.return_to ?? ""} />
          <input type="hidden" name="loan_limit" value={String(loanLimit)} />

          <select
            name="loan_status"
            defaultValue={loanStatus ?? ""}
            className="ui-input w-full px-4 py-3 text-sm"
          >
            {loanStatuses.map((statusOption) => (
              <option key={statusOption || "ALL"} value={statusOption}>
                {statusOption ? getStatusLabel(statusOption) : "Tất cả trạng thái"}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="ui-button-primary px-4 py-3 text-sm font-semibold"
            >
              Lọc lịch sử
            </button>
            <Link
              href={clearHistoryHref}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Xóa bộ lọc
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
        {loanHistory.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Loan</th>
                    <th className="px-5 py-3">Tài liệu</th>
                    <th className="px-5 py-3">Ngày mượn</th>
                    <th className="px-5 py-3">Ngày trả</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Thủ thư</th>
                    <th className="px-5 py-3">Ghi chú</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loanHistory.items.map((loan) => {
                    const loanContext = resolveLoanContext(
                      loan,
                      copiesByCode,
                      titlesByCode
                    );

                    return (
                      <tr key={loan.id} className="align-top">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          #{loan.id}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {loanContext.titleName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {loan.ma_sach} • {loanContext.titleCode}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(loan.ngay_muon)}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {loan.ngay_tra ? formatDate(loan.ngay_tra) : "Chưa trả"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={loan.tinh_trang} />
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {loan.ma_thu_thu}
                        </td>
                        <td className="max-w-72 px-5 py-4 text-sm leading-6 text-slate-600">
                          {loan.ghi_chu_tinh_trang || "Chưa có ghi chú"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={buildLoanActionHref(reader.code, loan)}
                            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                          >
                            {loan.tinh_trang === "BORROWED"
                              ? "Mở return"
                              : "Xem trong loans"}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PaginationControls
              pathname={currentReaderRoute}
              params={historyFilters}
              pageParamName="loan_page"
              page={loanHistory.meta.page}
              total={loanHistory.meta.total}
              totalPages={loanHistory.meta.totalPages}
            />
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không có lịch sử phù hợp"
              description={
                loanStatus
                  ? "Độc giả này chưa có bản ghi nào khớp với trạng thái đang chọn."
                  : "Độc giả này chưa phát sinh giao dịch mượn/trả nào trong hệ thống."
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
