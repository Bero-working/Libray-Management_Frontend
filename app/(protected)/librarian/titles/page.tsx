import Link from "next/link";

import {
  createTitleAction,
  deleteTitleAction,
  updateTitleAction,
} from "@/app/actions/librarian";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { SubmitButton } from "@/components/librarian/submit-button";
import { getLibrarianErrorMessage, getMajors, getTitles } from "@/lib/librarian/data";
import { formatCount } from "@/lib/librarian/presenters";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readTrimmedSearchParam,
} from "@/lib/librarian/utils";
import { APP_ROUTES } from "@/lib/config/routes";

interface TitlesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const labelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";
const inputClass = "mt-2 ui-input w-full px-4 py-3 text-sm";

export default async function LibrarianTitlesPage({ searchParams }: TitlesPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const query = readTrimmedSearchParam(resolvedSearchParams.query) ?? "";
  const editCode = readTrimmedSearchParam(resolvedSearchParams.edit);
  let titles;
  let majors;

  try {
    [titles, majors] = await Promise.all([getTitles(), getMajors()]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module đầu sách"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const majorsByCode = new Map(majors.map((major) => [major.code, major]));
  const normalizedQuery = query.toLocaleLowerCase("vi");

  const filteredTitles = titles.filter((title) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      title.ma_dau_sach,
      title.ten_dau_sach,
      title.tac_gia,
      title.ma_chuyen_nganh,
      majorsByCode.get(title.ma_chuyen_nganh)?.name ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("vi")
      .includes(normalizedQuery);
  });

  const selectedTitle =
    filteredTitles.find((title) => title.ma_dau_sach === editCode) ??
    titles.find((title) => title.ma_dau_sach === editCode) ??
    null;

  const currentHref = buildHref(APP_ROUTES.librarianTitles, {
    query: query || undefined,
    edit: selectedTitle?.ma_dau_sach,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý đầu sách"
        description="Thêm, cập nhật và rà soát metadata đầu sách đang hoạt động. Form sử dụng major runtime thật để giữ đồng bộ với contract backend hiện tại."
        actions={
          <>
            <Link
              href={APP_ROUTES.librarianCopies}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Xem bản sao
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

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Danh mục đầu sách</h2>
                <p className="text-sm text-slate-500">
                  {formatCount(filteredTitles.length)} / {formatCount(titles.length)} bản ghi phù hợp
                </p>
              </div>
              <form action={APP_ROUTES.librarianTitles} className="flex w-full gap-3 lg:max-w-md">
                <input
                  type="text"
                  name="query"
                  defaultValue={query}
                  placeholder="Tìm theo mã, tên sách, tác giả, chuyên ngành"
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

          {filteredTitles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mã</th>
                    <th className="px-5 py-3">Đầu sách</th>
                    <th className="px-5 py-3">Chuyên ngành</th>
                    <th className="px-5 py-3 text-right">Bản sao</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTitles.map((title) => (
                    <tr key={title.ma_dau_sach} className="align-top">
                      <td className="px-5 py-4 font-semibold text-slate-900">{title.ma_dau_sach}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{title.ten_dau_sach}</p>
                        <p className="text-sm text-slate-500">
                          {title.tac_gia} • {title.nha_xuat_ban}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {majorsByCode.get(title.ma_chuyen_nganh)?.name ?? title.ma_chuyen_nganh}
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-slate-900">
                        {formatCount(title.so_luong_sach)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={buildHref(APP_ROUTES.librarianTitles, {
                            query: query || undefined,
                            edit: title.ma_dau_sach,
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
                title="Không có đầu sách phù hợp"
                description="Thử đổi bộ lọc hoặc tạo mới một đầu sách ngay ở panel bên phải."
              />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {selectedTitle ? `Cập nhật ${selectedTitle.ma_dau_sach}` : "Tạo đầu sách mới"}
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedTitle
                    ? "Patch metadata hiện có của title đang chọn."
                    : "Tạo mới một book title để nối tiếp sang quản lý bản sao."}
                </p>
              </div>
              {selectedTitle ? (
                <Link
                  href={buildHref(APP_ROUTES.librarianTitles, {
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
                selectedTitle
                  ? updateTitleAction.bind(null, selectedTitle.ma_dau_sach)
                  : createTitleAction
              }
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="redirect_to" value={currentHref} />

              <div>
                <label htmlFor="ma_dau_sach" className={labelClass}>
                  Mã đầu sách
                </label>
                <input
                  id="ma_dau_sach"
                  name="ma_dau_sach"
                  defaultValue={selectedTitle?.ma_dau_sach ?? ""}
                  disabled={Boolean(selectedTitle)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  placeholder="DS001"
                />
              </div>

              <div>
                <label htmlFor="ten_dau_sach" className={labelClass}>
                  Tên đầu sách
                </label>
                <input
                  id="ten_dau_sach"
                  name="ten_dau_sach"
                  defaultValue={selectedTitle?.ten_dau_sach ?? ""}
                  className={inputClass}
                  placeholder="Clean Code"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="tac_gia" className={labelClass}>
                    Tác giả
                  </label>
                  <input
                    id="tac_gia"
                    name="tac_gia"
                    defaultValue={selectedTitle?.tac_gia ?? ""}
                    className={inputClass}
                    placeholder="Robert C. Martin"
                  />
                </div>
                <div>
                  <label htmlFor="nha_xuat_ban" className={labelClass}>
                    Nhà xuất bản
                  </label>
                  <input
                    id="nha_xuat_ban"
                    name="nha_xuat_ban"
                    defaultValue={selectedTitle?.nha_xuat_ban ?? ""}
                    className={inputClass}
                    placeholder="Prentice Hall"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="so_trang" className={labelClass}>
                    Số trang
                  </label>
                  <input
                    id="so_trang"
                    name="so_trang"
                    type="number"
                    min={1}
                    defaultValue={selectedTitle?.so_trang ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="kich_thuoc" className={labelClass}>
                    Kích thước
                  </label>
                  <input
                    id="kich_thuoc"
                    name="kich_thuoc"
                    defaultValue={selectedTitle?.kich_thuoc ?? ""}
                    className={inputClass}
                    placeholder="16x24 cm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ma_chuyen_nganh" className={labelClass}>
                  Chuyên ngành
                </label>
                <select
                  id="ma_chuyen_nganh"
                  name="ma_chuyen_nganh"
                  defaultValue={selectedTitle?.ma_chuyen_nganh ?? ""}
                  className={inputClass}
                >
                  <option value="">Chọn chuyên ngành</option>
                  {majors.map((major) => (
                    <option key={major.code} value={major.code}>
                      {major.name} ({major.code})
                    </option>
                  ))}
                </select>
              </div>

              <SubmitButton
                label={selectedTitle ? "Lưu cập nhật" : "Tạo đầu sách"}
                pendingLabel={selectedTitle ? "Đang lưu..." : "Đang tạo..."}
                className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          {selectedTitle ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Chi tiết đang chọn</h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Mã:</span> {selectedTitle.ma_dau_sach}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Tên:</span> {selectedTitle.ten_dau_sach}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Chuyên ngành:</span>{" "}
                  {majorsByCode.get(selectedTitle.ma_chuyen_nganh)?.name ??
                    selectedTitle.ma_chuyen_nganh}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Bản sao hiện có:</span>{" "}
                  {formatCount(selectedTitle.so_luong_sach)}
                </p>
              </div>

              <form action={deleteTitleAction.bind(null, selectedTitle.ma_dau_sach)} className="mt-4">
                <input type="hidden" name="redirect_to" value={currentHref} />
                <SubmitButton
                  label="Xóa đầu sách"
                  pendingLabel="Đang xoá..."
                  className="ui-button-danger w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                />
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
