import Link from "next/link";

import {
  createMajorAction,
  deleteMajorAction,
  updateMajorAction,
} from "@/app/actions/librarian";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { SubmitButton } from "@/components/librarian/submit-button";
import {
  getLibrarianErrorMessage,
  getMajorDetail,
  getMajors,
  getTitles,
} from "@/lib/librarian/data";
import { formatCount } from "@/lib/librarian/presenters";
import { buildHref, getFeedbackFromSearchParams, readTrimmedSearchParam } from "@/lib/librarian/utils";
import { APP_ROUTES } from "@/lib/config/routes";

interface MajorsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const labelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";
const inputClass = "mt-2 ui-input w-full px-4 py-3 text-sm";

export default async function LibrarianMajorsPage({ searchParams }: MajorsPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const query = readTrimmedSearchParam(resolvedSearchParams.query) ?? "";
  const editCode = readTrimmedSearchParam(resolvedSearchParams.edit);
  let majors;
  let titles;
  let selectedMajor;

  try {
    [majors, titles, selectedMajor] = await Promise.all([
      getMajors(),
      getTitles(),
      editCode ? getMajorDetail(editCode).catch(() => null) : Promise.resolve(null),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module chuyên ngành"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const titleCountByMajor = new Map<string, number>();

  for (const title of titles) {
    titleCountByMajor.set(
      title.ma_chuyen_nganh,
      (titleCountByMajor.get(title.ma_chuyen_nganh) ?? 0) + 1
    );
  }

  const normalizedQuery = query.toLocaleLowerCase("vi");
  const filteredMajors = majors.filter((major) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      major.code,
      major.name,
      major.description ?? "",
      String(titleCountByMajor.get(major.code) ?? 0),
    ]
      .join(" ")
      .toLocaleLowerCase("vi")
      .includes(normalizedQuery);
  });

  const resolvedSelectedMajor =
    selectedMajor ??
    filteredMajors.find((major) => major.code === editCode) ??
    majors.find((major) => major.code === editCode) ??
    null;
  const selectedTitles = resolvedSelectedMajor
    ? titles
        .filter((title) => title.ma_chuyen_nganh === resolvedSelectedMajor.code)
        .toSorted((left, right) => left.ten_dau_sach.localeCompare(right.ten_dau_sach, "vi"))
    : [];

  const currentHref = buildHref(APP_ROUTES.librarianMajors, {
    query: query || undefined,
    edit: resolvedSelectedMajor?.code,
  });

  const majorsWithTitles = majors.filter((major) => (titleCountByMajor.get(major.code) ?? 0) > 0).length;
  const majorsWithoutDescription = majors.filter((major) => !major.description?.trim()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý chuyên ngành"
        description="Quản lý danh mục chuyên ngành làm nguồn chuẩn cho titles và catalog search. Màn này dùng `GET /majors` kết hợp title runtime hiện tại để hiển thị luôn mức độ phụ thuộc trước khi xóa."
        actions={
          <>
            <Link
              href={APP_ROUTES.librarianTitles}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Quản lý đầu sách
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
          label="Tổng chuyên ngành"
          value={formatCount(majors.length)}
          hint={`${formatCount(filteredMajors.length)} mục khớp bộ lọc hiện tại`}
          accent="blue"
        />
        <StatCard
          label="Có đầu sách liên kết"
          value={formatCount(majorsWithTitles)}
          hint={`${formatCount(titles.length)} đầu sách đang dùng major hiện có`}
          accent="teal"
        />
        <StatCard
          label="Thiếu mô tả"
          value={formatCount(majorsWithoutDescription)}
          hint="Nên bổ sung để hỗ trợ phân loại và tra cứu nội bộ"
          accent="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Danh mục chuyên ngành</h2>
                <p className="text-sm text-slate-500">
                  {formatCount(filteredMajors.length)} / {formatCount(majors.length)} mục phù hợp
                </p>
              </div>
              <form action={APP_ROUTES.librarianMajors} className="flex w-full gap-3 lg:max-w-md">
                <input
                  type="text"
                  name="query"
                  defaultValue={query}
                  placeholder="Tìm theo mã, tên hoặc mô tả"
                  className="ui-input w-full px-4 py-3 text-sm"
                />
                <button
                  type="submit"
                  className="ui-button-primary px-4 py-3 text-sm font-semibold"
                >
                  Lọc
                </button>
              </form>
            </div>
          </div>

          {filteredMajors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mã</th>
                    <th className="px-5 py-3">Tên chuyên ngành</th>
                    <th className="px-5 py-3">Mô tả</th>
                    <th className="px-5 py-3 text-right">Đầu sách</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMajors.map((major) => (
                    <tr key={major.code} className="align-top">
                      <td className="px-5 py-4 font-semibold text-slate-900">{major.code}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{major.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {major.description ? (
                          major.description
                        ) : (
                          <span className="text-slate-400">Chưa có mô tả</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCount(titleCountByMajor.get(major.code) ?? 0)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={buildHref(APP_ROUTES.librarianMajors, {
                            query: query || undefined,
                            edit: major.code,
                          })}
                          className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                        >
                          Sửa
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Không có chuyên ngành phù hợp"
                description="Điều chỉnh bộ lọc hoặc tạo chuyên ngành mới ở panel bên phải."
              />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {resolvedSelectedMajor
                    ? `Cập nhật ${resolvedSelectedMajor.code}`
                    : "Tạo chuyên ngành mới"}
                </h2>
                <p className="text-sm text-slate-500">
                  {resolvedSelectedMajor
                    ? "Điều chỉnh tên hoặc mô tả của chuyên ngành đang chọn."
                    : "Thêm chuyên ngành mới để tái sử dụng nhất quán ở titles và search."}
                </p>
              </div>
              {resolvedSelectedMajor ? (
                <Link
                  href={buildHref(APP_ROUTES.librarianMajors, {
                    query: query || undefined,
                  })}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                >
                  Bỏ chọn
                </Link>
              ) : null}
            </div>

            <form
              action={
                resolvedSelectedMajor
                  ? updateMajorAction.bind(null, resolvedSelectedMajor.code)
                  : createMajorAction
              }
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="redirect_to" value={currentHref} />

              <div>
                <label htmlFor="ma_chuyen_nganh" className={labelClass}>
                  Mã chuyên ngành
                </label>
                <input
                  id="ma_chuyen_nganh"
                  name="ma_chuyen_nganh"
                  defaultValue={resolvedSelectedMajor?.code ?? ""}
                  disabled={Boolean(resolvedSelectedMajor)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  placeholder="CN001"
                />
              </div>

              <div>
                <label htmlFor="ten_chuyen_nganh" className={labelClass}>
                  Tên chuyên ngành
                </label>
                <input
                  id="ten_chuyen_nganh"
                  name="ten_chuyen_nganh"
                  defaultValue={resolvedSelectedMajor?.name ?? ""}
                  className={inputClass}
                  placeholder="Công nghệ thông tin"
                />
              </div>

              <div>
                <label htmlFor="mo_ta" className={labelClass}>
                  Mô tả
                </label>
                <textarea
                  id="mo_ta"
                  name="mo_ta"
                  defaultValue={resolvedSelectedMajor?.description ?? ""}
                  className={`${inputClass} min-h-32 resize-y`}
                  placeholder="Mô tả ngắn về phạm vi chuyên ngành"
                />
              </div>

              <SubmitButton
                label={resolvedSelectedMajor ? "Lưu cập nhật" : "Tạo chuyên ngành"}
                pendingLabel={resolvedSelectedMajor ? "Đang lưu..." : "Đang tạo..."}
                className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          {resolvedSelectedMajor ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Thông tin chuyên ngành</h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Mã:</span>{" "}
                  {resolvedSelectedMajor.code}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Tên:</span>{" "}
                  {resolvedSelectedMajor.name}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Mô tả:</span>{" "}
                  {resolvedSelectedMajor.description || "Chưa có mô tả"}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Đầu sách liên kết:</span>{" "}
                  {formatCount(selectedTitles.length)}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Một số đầu sách đang tham chiếu
                </p>
                {selectedTitles.length > 0 ? (
                  <>
                    {selectedTitles.slice(0, 3).map((title) => (
                      <div
                        key={title.ma_dau_sach}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-900">{title.ten_dau_sach}</p>
                        <p className="text-xs text-slate-500">
                          {title.ma_dau_sach} • {title.tac_gia}
                        </p>
                      </div>
                    ))}
                    {selectedTitles.length > 3 ? (
                      <p className="text-xs text-slate-500">
                        + {formatCount(selectedTitles.length - 3)} đầu sách khác
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                    Chưa có đầu sách nào tham chiếu chuyên ngành này.
                  </p>
                )}
              </div>

              {selectedTitles.length > 0 ? (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Chuyên ngành này đang được dùng bởi đầu sách hiện có, nên thao tác xóa có thể bị backend chặn với lỗi phụ thuộc.
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link
                  href={buildHref(APP_ROUTES.librarianTitles, {
                    query: resolvedSelectedMajor.code,
                  })}
                  className="ui-button-secondary flex items-center justify-center px-4 py-3 text-sm font-semibold"
                >
                  Xem đầu sách liên quan
                </Link>

                <form action={deleteMajorAction.bind(null, resolvedSelectedMajor.code)}>
                  <input type="hidden" name="redirect_to" value={currentHref} />
                  <SubmitButton
                    label="Xóa chuyên ngành"
                    pendingLabel="Đang xóa..."
                    className="ui-button-danger w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </form>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
