import Link from "next/link";

import { createCopyAction, deleteCopyAction, updateCopyAction } from "@/app/actions/librarian";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { StatusBadge } from "@/components/librarian/status-badge";
import { SubmitButton } from "@/components/librarian/submit-button";
import { getCopies, getLibrarianErrorMessage, getTitles } from "@/lib/librarian/data";
import { formatDate, toDateInputValue } from "@/lib/librarian/presenters";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readTrimmedSearchParam,
} from "@/lib/librarian/utils";
import { APP_ROUTES } from "@/lib/config/routes";

interface CopiesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const labelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";
const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500";

export default async function LibrarianCopiesPage({ searchParams }: CopiesPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const query = readTrimmedSearchParam(resolvedSearchParams.query) ?? "";
  const status = readTrimmedSearchParam(resolvedSearchParams.status) ?? "";
  const editCode = readTrimmedSearchParam(resolvedSearchParams.edit);
  let copies;
  let titles;

  try {
    [copies, titles] = await Promise.all([getCopies(), getTitles()]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module bản sao"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const titlesByCode = new Map(titles.map((title) => [title.ma_dau_sach, title]));
  const normalizedQuery = query.toLocaleLowerCase("vi");

  const filteredCopies = copies.filter((copy) => {
    const title = titlesByCode.get(copy.ma_dau_sach);
    const matchesQuery =
      !normalizedQuery ||
      [copy.ma_sach, copy.ma_dau_sach, title?.ten_dau_sach ?? "", copy.tinh_trang]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalizedQuery);
    const matchesStatus = !status || copy.tinh_trang === status;

    return matchesQuery && matchesStatus;
  });

  const selectedCopy =
    filteredCopies.find((copy) => copy.ma_sach === editCode) ??
    copies.find((copy) => copy.ma_sach === editCode) ??
    null;

  const currentHref = buildHref(APP_ROUTES.librarianCopies, {
    query: query || undefined,
    status: status || undefined,
    edit: selectedCopy?.ma_sach,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý bản sao sách"
        description="Theo dõi từng bản sao vật lý, cập nhật tình trạng và đồng bộ với title catalogue. Màn này bám runtime thực tế: `GET /copies` chưa phân trang nên bộ lọc đang chạy ở phía frontend."
        actions={
          <>
            <Link
              href={APP_ROUTES.librarianTitles}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Quản lý đầu sách
            </Link>
            <Link
              href={APP_ROUTES.librarianLoans}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Mở borrow / return
            </Link>
          </>
        }
      />

      {feedback ? <FlashBanner tone={feedback.tone} message={feedback.message} /> : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <form action={APP_ROUTES.librarianCopies} className="grid gap-3 lg:grid-cols-[1fr,220px,auto]">
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Lọc theo mã bản sao, mã đầu sách, tên sách"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
              <select
                name="status"
                defaultValue={status}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">Tất cả tình trạng</option>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="BORROWED">BORROWED</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="LOST">LOST</option>
                <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
              </select>
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Áp dụng
              </button>
            </form>
          </div>

          {filteredCopies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mã bản sao</th>
                    <th className="px-5 py-3">Đầu sách</th>
                    <th className="px-5 py-3">Ngày nhập</th>
                    <th className="px-5 py-3">Tình trạng</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCopies.map((copy) => {
                    const title = titlesByCode.get(copy.ma_dau_sach);

                    return (
                      <tr key={copy.ma_sach} className="align-top">
                        <td className="px-5 py-4 font-semibold text-slate-900">{copy.ma_sach}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {title?.ten_dau_sach ?? copy.ma_dau_sach}
                          </p>
                          <p className="text-sm text-slate-500">{copy.ma_dau_sach}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(copy.ngay_nhap)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={copy.tinh_trang} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={buildHref(APP_ROUTES.librarianCopies, {
                              query: query || undefined,
                              status: status || undefined,
                              edit: copy.ma_sach,
                            })}
                            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                          >
                            Sửa
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Không có bản sao phù hợp"
                description="Điều chỉnh bộ lọc hoặc thêm bản sao mới ở panel bên phải."
              />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {selectedCopy ? `Cập nhật ${selectedCopy.ma_sach}` : "Thêm bản sao mới"}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedCopy
                    ? "Chỉnh trạng thái và ngày nhập của bản sao đang chọn."
                    : "Liên kết bản sao mới với title đang hoạt động."}
                </p>
              </div>
              {selectedCopy ? (
                <Link
                  href={buildHref(APP_ROUTES.librarianCopies, {
                    query: query || undefined,
                    status: status || undefined,
                  })}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                >
                  Bỏ chọn
                </Link>
              ) : null}
            </div>

            <form
              action={
                selectedCopy
                  ? updateCopyAction.bind(null, selectedCopy.ma_sach)
                  : createCopyAction
              }
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="redirect_to" value={currentHref} />

              <div>
                <label htmlFor="ma_sach" className={labelClass}>
                  Mã bản sao
                </label>
                <input
                  id="ma_sach"
                  name="ma_sach"
                  defaultValue={selectedCopy?.ma_sach ?? ""}
                  disabled={Boolean(selectedCopy)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  placeholder="S001"
                />
              </div>

              <div>
                <label htmlFor="ma_dau_sach" className={labelClass}>
                  Đầu sách
                </label>
                <select
                  id="ma_dau_sach"
                  name="ma_dau_sach"
                  defaultValue={selectedCopy?.ma_dau_sach ?? ""}
                  disabled={Boolean(selectedCopy)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                >
                  <option value="">Chọn đầu sách</option>
                  {titles.map((title) => (
                    <option key={title.ma_dau_sach} value={title.ma_dau_sach}>
                      {title.ten_dau_sach} ({title.ma_dau_sach})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="tinh_trang" className={labelClass}>
                    Tình trạng
                  </label>
                  <select
                    id="tinh_trang"
                    name="tinh_trang"
                    defaultValue={selectedCopy?.tinh_trang ?? "AVAILABLE"}
                    className={inputClass}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BORROWED">BORROWED</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="LOST">LOST</option>
                    <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="ngay_nhap" className={labelClass}>
                    Ngày nhập
                  </label>
                  <input
                    id="ngay_nhap"
                    name="ngay_nhap"
                    type="date"
                    defaultValue={toDateInputValue(selectedCopy?.ngay_nhap)}
                    className={inputClass}
                  />
                </div>
              </div>

              <SubmitButton
                label={selectedCopy ? "Lưu cập nhật" : "Thêm bản sao"}
                pendingLabel={selectedCopy ? "Đang lưu..." : "Đang thêm..."}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          {selectedCopy ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Thông tin bản sao</h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Đầu sách:</span>{" "}
                  {titlesByCode.get(selectedCopy.ma_dau_sach)?.ten_dau_sach ?? selectedCopy.ma_dau_sach}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Ngày nhập:</span>{" "}
                  {formatDate(selectedCopy.ngay_nhap)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Tình trạng:</span>{" "}
                  {selectedCopy.tinh_trang}
                </p>
              </div>

              <form action={deleteCopyAction.bind(null, selectedCopy.ma_sach)} className="mt-4">
                <input type="hidden" name="redirect_to" value={currentHref} />
                <SubmitButton
                  label="Xóa bản sao"
                  pendingLabel="Đang xoá..."
                  className="w-full rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
