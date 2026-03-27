import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { PaginationControls } from "@/components/librarian/pagination-controls";
import { StatusBadge } from "@/components/librarian/status-badge";
import { getLibrarianErrorMessage, getMajors, searchBooks } from "@/lib/librarian/data";
import { formatCount } from "@/lib/librarian/presenters";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readIntSearchParam,
  readTrimmedSearchParam,
} from "@/lib/librarian/utils";
import type { BookCopyStatus } from "@/lib/librarian/types";
import { APP_ROUTES } from "@/lib/config/routes";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500";

export default async function LibrarianSearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);

  const filters = {
    page: readIntSearchParam(resolvedSearchParams.page, 1, { min: 1, max: 1000 }),
    limit: readIntSearchParam(resolvedSearchParams.limit, 10, { min: 1, max: 100 }),
    ma_dau_sach: readTrimmedSearchParam(resolvedSearchParams.ma_dau_sach),
    ten_dau_sach: readTrimmedSearchParam(resolvedSearchParams.ten_dau_sach),
    tac_gia: readTrimmedSearchParam(resolvedSearchParams.tac_gia),
    ma_chuyen_nganh: readTrimmedSearchParam(resolvedSearchParams.ma_chuyen_nganh),
    ma_sach: readTrimmedSearchParam(resolvedSearchParams.ma_sach),
    tinh_trang: readTrimmedSearchParam(
      resolvedSearchParams.tinh_trang
    ) as BookCopyStatus | undefined,
  } as const;
  let majors;
  let results;

  try {
    [majors, results] = await Promise.all([getMajors(), searchBooks(filters)]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải màn tra cứu"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const paginationParams = {
    limit: filters.limit,
    ma_dau_sach: filters.ma_dau_sach,
    ten_dau_sach: filters.ten_dau_sach,
    tac_gia: filters.tac_gia,
    ma_chuyen_nganh: filters.ma_chuyen_nganh,
    ma_sach: filters.ma_sach,
    tinh_trang: filters.tinh_trang,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tra cứu catalog"
        description="Tra cứu title-centric theo mã đầu sách, tên sách, tác giả, major, mã bản sao và trạng thái. Kết quả hiển thị đúng runtime backend hiện tại với `ban_sao_phu_hop`."
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
              Đi tới borrow / return
            </Link>
          </>
        }
      />

      {feedback ? <FlashBanner tone={feedback.tone} message={feedback.message} /> : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <form action={APP_ROUTES.librarianSearch} className="grid gap-4 lg:grid-cols-3">
          <input type="hidden" name="limit" value={String(filters.limit)} />

          <input
            className={inputClass}
            name="ma_dau_sach"
            defaultValue={filters.ma_dau_sach}
            placeholder="Mã đầu sách"
          />
          <input
            className={inputClass}
            name="ten_dau_sach"
            defaultValue={filters.ten_dau_sach}
            placeholder="Tên đầu sách"
          />
          <input
            className={inputClass}
            name="tac_gia"
            defaultValue={filters.tac_gia}
            placeholder="Tác giả"
          />
          <select
            className={inputClass}
            name="ma_chuyen_nganh"
            defaultValue={filters.ma_chuyen_nganh}
          >
            <option value="">Tất cả chuyên ngành</option>
            {majors.map((major) => (
              <option key={major.code} value={major.code}>
                {major.name} ({major.code})
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            name="ma_sach"
            defaultValue={filters.ma_sach}
            placeholder="Mã bản sao"
          />
          <select className={inputClass} name="tinh_trang" defaultValue={filters.tinh_trang}>
            <option value="">Tất cả tình trạng</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="BORROWED">BORROWED</option>
            <option value="DAMAGED">DAMAGED</option>
            <option value="LOST">LOST</option>
            <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
          </select>

          <div className="lg:col-span-3 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Áp dụng bộ lọc
            </button>
            <Link
              href={buildHref(APP_ROUTES.librarianSearch, { limit: filters.limit })}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
            >
              Xóa bộ lọc
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Kết quả tra cứu</h2>
            <p className="text-sm text-slate-500">
              {formatCount(results.meta.total)} đầu sách phù hợp với điều kiện hiện tại
            </p>
          </div>
        </div>

        {results.items.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Đầu sách</th>
                    <th className="px-5 py-3">Tác giả</th>
                    <th className="px-5 py-3">Chuyên ngành</th>
                    <th className="px-5 py-3">Matching copies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.items.map((result) => (
                    <tr key={result.ma_dau_sach} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{result.ten_dau_sach}</p>
                        <p className="text-sm text-slate-500">
                          {result.ma_dau_sach} • {result.nha_xuat_ban}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatCount(result.so_luong_sach)} bản sao trong hệ thống
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p>{result.tac_gia}</p>
                        <p className="mt-2 text-xs text-slate-500">
                          {result.so_trang ?? "?"} trang • {result.kich_thuoc ?? "Không rõ kích thước"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">{result.ten_chuyen_nganh}</p>
                        <p className="text-xs text-slate-500">{result.ma_chuyen_nganh}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {result.ban_sao_phu_hop.length > 0 ? (
                            result.ban_sao_phu_hop.map((copy) => (
                              <div
                                key={copy.ma_sach}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                              >
                                <p className="text-sm font-semibold text-slate-900">{copy.ma_sach}</p>
                                <div className="mt-2">
                                  <StatusBadge status={copy.tinh_trang} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">
                              Không có bản sao khớp bộ lọc hiện tại
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              pathname={APP_ROUTES.librarianSearch}
              params={paginationParams}
              page={results.meta.page}
              total={results.meta.total}
              totalPages={results.meta.totalPages}
            />
          </>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Không tìm thấy kết quả"
              description="Thử nới lỏng bộ lọc hoặc chuyển sang màn quản lý đầu sách / bản sao để bổ sung dữ liệu."
            />
          </div>
        )}
      </section>
    </div>
  );
}
