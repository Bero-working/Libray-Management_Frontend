import Link from "next/link";

import { createLoanAction, returnLoanAction } from "@/app/actions/librarian";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { PaginationControls } from "@/components/librarian/pagination-controls";
import { StatusBadge } from "@/components/librarian/status-badge";
import { SubmitButton } from "@/components/librarian/submit-button";
import {
  getCopies,
  getLibrarianErrorMessage,
  getLoans,
  getReaders,
  getTitles,
} from "@/lib/librarian/data";
import { formatDate } from "@/lib/librarian/presenters";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readIntSearchParam,
  readTrimmedSearchParam,
} from "@/lib/librarian/utils";
import type { LoanStatus } from "@/lib/librarian/types";
import { APP_ROUTES } from "@/lib/config/routes";

interface LoansPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const inputClass = "ui-input w-full px-4 py-3 text-sm";
const textareaClass = `${inputClass} min-h-28 resize-y`;

function formatLocalDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
}

export default async function LibrarianLoansPage({ searchParams }: LoansPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const today = formatLocalDate(new Date());

  const filters = {
    page: readIntSearchParam(resolvedSearchParams.page, 1, { min: 1, max: 1000 }),
    limit: readIntSearchParam(resolvedSearchParams.limit, 10, { min: 1, max: 100 }),
    status: readTrimmedSearchParam(resolvedSearchParams.status) as LoanStatus | undefined,
    ma_doc_gia: readTrimmedSearchParam(resolvedSearchParams.ma_doc_gia),
    ma_sach: readTrimmedSearchParam(resolvedSearchParams.ma_sach),
    ngay_muon_from: readTrimmedSearchParam(resolvedSearchParams.ngay_muon_from),
    ngay_muon_to: readTrimmedSearchParam(resolvedSearchParams.ngay_muon_to),
  } as const;
  const returnLoanId = readTrimmedSearchParam(resolvedSearchParams.return_loan);

  try {
    const [loans, readers, copies, titles] = await Promise.all([
      getLoans(filters),
      getReaders(),
      getCopies(),
      getTitles(),
    ]);

    const readersByCode = new Map(readers.map((reader) => [reader.code, reader]));
    const copiesByCode = new Map(copies.map((copy) => [copy.ma_sach, copy]));
    const titlesByCode = new Map(titles.map((title) => [title.ma_dau_sach, title]));
    const availableCopies = copies.filter((copy) => copy.tinh_trang === "AVAILABLE");
    const selectedReturnLoan =
      loans.items.find((loan) => loan.id === returnLoanId && loan.tinh_trang !== "RETURNED") ??
      null;

    const currentHref = buildHref(APP_ROUTES.librarianLoans, {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      ma_doc_gia: filters.ma_doc_gia,
      ma_sach: filters.ma_sach,
      ngay_muon_from: filters.ngay_muon_from,
      ngay_muon_to: filters.ngay_muon_to,
      return_loan: selectedReturnLoan?.id,
    });

    const paginationParams = {
      limit: filters.limit,
      status: filters.status,
      ma_doc_gia: filters.ma_doc_gia,
      ma_sach: filters.ma_sach,
      ngay_muon_from: filters.ngay_muon_from,
      ngay_muon_to: filters.ngay_muon_to,
    };

    return (
      <div className="space-y-6">
        <PageHeader
          title="Xử lý mượn / trả"
          description="Lập phiếu mượn mới, ghi nhận trả sách và rà soát loan history theo bộ lọc nghiệp vụ. Từng mutation đều gọi Server Action có role check riêng để tránh phụ thuộc vào UI."
          actions={
            <>
              <Link
                href={APP_ROUTES.librarianReports}
                className="ui-button-secondary px-4 py-3 text-sm font-semibold"
              >
                Xem báo cáo
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

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Lập phiếu mượn</h2>
            <p className="mt-2 text-sm text-slate-500">
              Backend đang enforce 2 rule chính của phase 1: mỗi độc giả chỉ có tối đa 1 loan mở và chỉ copy `AVAILABLE` mới được mượn.
            </p>

            <form action={createLoanAction} className="mt-5 space-y-4">
              <input type="hidden" name="redirect_to" value={currentHref} />

              <div>
                <label htmlFor="ma_doc_gia" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Mã độc giả
                </label>
                <input
                  id="ma_doc_gia"
                  name="ma_doc_gia"
                  list="reader-codes"
                  className={`${inputClass} mt-2`}
                  placeholder="DG001"
                />
                <datalist id="reader-codes">
                  {readers.map((reader) => (
                    <option key={reader.code} value={reader.code}>
                      {reader.fullName} - {reader.className}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="ma_sach" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Mã bản sao
                </label>
                <input
                  id="ma_sach"
                  name="ma_sach"
                  list="copy-codes"
                  className={`${inputClass} mt-2`}
                  placeholder="S001"
                />
                <datalist id="copy-codes">
                  {availableCopies.map((copy) => {
                    const title = titlesByCode.get(copy.ma_dau_sach);

                    return (
                      <option key={copy.ma_sach} value={copy.ma_sach}>
                        {title?.ten_dau_sach ?? copy.ma_dau_sach}
                      </option>
                    );
                  })}
                </datalist>
              </div>

              <div>
                <label htmlFor="ngay_muon" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Ngày mượn
                </label>
                <input
                  id="ngay_muon"
                  name="ngay_muon"
                  type="date"
                  defaultValue={today}
                  className={`${inputClass} mt-2`}
                />
              </div>

              <div>
                <label
                  htmlFor="ghi_chu_tinh_trang"
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"
                >
                  Ghi chú tình trạng khi giao
                </label>
                <textarea
                  id="ghi_chu_tinh_trang"
                  name="ghi_chu_tinh_trang"
                  className={`${textareaClass} mt-2`}
                  placeholder="Ví dụ: Sách còn tốt, bìa hơi cũ..."
                />
              </div>

              <SubmitButton
                label="Lập phiếu mượn"
                pendingLabel="Đang tạo phiếu..."
                className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Ghi nhận trả sách</h2>
            <p className="mt-2 text-sm text-slate-500">
              Chọn một loan đang mở ở bảng bên dưới để mở form trả sách. Trạng thái copy sau trả sẽ quyết định `Loan.status` là `RETURNED` hay `NEEDS_REVIEW`.
            </p>

            {selectedReturnLoan ? (
              <form action={returnLoanAction.bind(null, selectedReturnLoan.id)} className="mt-5 space-y-4">
                <input type="hidden" name="redirect_to" value={currentHref} />

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Phiếu #{selectedReturnLoan.id}</p>
                  <p className="mt-2">
                    Độc giả: {selectedReturnLoan.ma_doc_gia}{" "}
                    {readersByCode.get(selectedReturnLoan.ma_doc_gia)
                      ? `• ${readersByCode.get(selectedReturnLoan.ma_doc_gia)?.fullName}`
                      : ""}
                  </p>
                  <p className="mt-1">
                    Bản sao: {selectedReturnLoan.ma_sach}{" "}
                    {copiesByCode.get(selectedReturnLoan.ma_sach)
                      ? `• ${
                          titlesByCode.get(copiesByCode.get(selectedReturnLoan.ma_sach)?.ma_dau_sach ?? "")
                            ?.ten_dau_sach ?? ""
                        }`
                      : ""}
                  </p>
                  <p className="mt-1">Ngày mượn: {formatDate(selectedReturnLoan.ngay_muon)}</p>
                  <div className="mt-3">
                    <StatusBadge status={selectedReturnLoan.tinh_trang} />
                  </div>
                </div>

                <div>
                  <label htmlFor="ngay_tra" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Ngày trả
                  </label>
                  <input
                    id="ngay_tra"
                    name="ngay_tra"
                    type="date"
                    defaultValue={today}
                    className={`${inputClass} mt-2`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="tinh_trang_sau_tra"
                    className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"
                  >
                    Tình trạng sau trả
                  </label>
                  <select
                    id="tinh_trang_sau_tra"
                    name="tinh_trang_sau_tra"
                    defaultValue="AVAILABLE"
                    className={`${inputClass} mt-2`}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="LOST">LOST</option>
                    <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="return_note"
                    className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"
                  >
                    Ghi chú khi nhận lại
                  </label>
                  <textarea
                    id="return_note"
                    name="ghi_chu_tinh_trang"
                    className={`${textareaClass} mt-2`}
                    placeholder="Ví dụ: góc bìa cong, cần kiểm tra trước khi cho mượn lại..."
                  />
                </div>

                <SubmitButton
                  label="Ghi nhận trả sách"
                  pendingLabel="Đang xử lý..."
                  className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title={
                    returnLoanId
                      ? "Loan được chọn không còn trong trang hiện tại"
                      : "Chưa chọn phiếu để trả"
                  }
                  description={
                    returnLoanId
                      ? "Hãy lọc lại hoặc chọn loan khác từ danh sách để mở form trả sách."
                      : "Dùng hành động “Chọn trả” ở bảng danh sách để nạp thông tin loan vào form này."
                  }
                />
              </div>
            )}
          </section>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <form action={APP_ROUTES.librarianLoans} className="grid gap-4 lg:grid-cols-3">
              <input type="hidden" name="limit" value={String(filters.limit)} />

              <input
                className={inputClass}
                name="ma_doc_gia"
                defaultValue={filters.ma_doc_gia}
                placeholder="Mã độc giả"
              />
              <input
                className={inputClass}
                name="ma_sach"
                defaultValue={filters.ma_sach}
                placeholder="Mã bản sao"
              />
              <select className={inputClass} name="status" defaultValue={filters.status}>
                <option value="">Tất cả trạng thái</option>
                <option value="BORROWED">BORROWED</option>
                <option value="RETURNED">RETURNED</option>
                <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
              </select>

              <input
                className={inputClass}
                name="ngay_muon_from"
                type="date"
                defaultValue={filters.ngay_muon_from}
              />
              <input
                className={inputClass}
                name="ngay_muon_to"
                type="date"
                defaultValue={filters.ngay_muon_to}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="ui-button-primary px-4 py-3 text-sm font-semibold"
                >
                  Lọc phiếu mượn
                </button>
                <Link
                  href={buildHref(APP_ROUTES.librarianLoans, { limit: filters.limit })}
                  className="ui-button-secondary px-4 py-3 text-sm font-semibold"
                >
                  Xóa bộ lọc
                </Link>
              </div>
            </form>
          </div>

          {loans.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Loan</th>
                      <th className="px-5 py-3">Độc giả</th>
                      <th className="px-5 py-3">Bản sao</th>
                      <th className="px-5 py-3">Ngày mượn</th>
                      <th className="px-5 py-3">Ngày trả</th>
                      <th className="px-5 py-3">Trạng thái</th>
                      <th className="px-5 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loans.items.map((loan) => {
                      const reader = readersByCode.get(loan.ma_doc_gia);
                      const copy = copiesByCode.get(loan.ma_sach);
                      const title = copy ? titlesByCode.get(copy.ma_dau_sach) : null;

                      return (
                        <tr key={loan.id} className="align-top">
                          <td className="px-5 py-4 font-semibold text-slate-900">#{loan.id}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{loan.ma_doc_gia}</p>
                            <p className="text-sm text-slate-500">
                              {reader ? `${reader.fullName} • ${reader.className}` : "Không có reader cache"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">{loan.ma_sach}</p>
                            <p className="text-sm text-slate-500">
                              {title?.ten_dau_sach ?? copy?.ma_dau_sach ?? "Không rõ đầu sách"}
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
                          <td className="px-5 py-4 text-right">
                            {loan.tinh_trang !== "RETURNED" ? (
                              <Link
                                href={buildHref(APP_ROUTES.librarianLoans, {
                                  ...paginationParams,
                                  page: filters.page,
                                  return_loan: loan.id,
                                })}
                                className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                              >
                                Chọn trả
                              </Link>
                            ) : (
                              <span className="text-sm text-slate-400">Đã hoàn tất</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                pathname={APP_ROUTES.librarianLoans}
                params={paginationParams}
                page={loans.meta.page}
                total={loans.meta.total}
                totalPages={loans.meta.totalPages}
              />
            </>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Không có phiếu mượn phù hợp"
                description="Điều chỉnh bộ lọc hoặc lập phiếu mới ở panel phía trên."
              />
            </div>
          )}
        </section>
      </div>
    );
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module mượn / trả"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }
}
