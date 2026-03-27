import Link from "next/link";

import {
  createReaderAction,
  deleteReaderAction,
  updateReaderAction,
} from "@/app/actions/librarian";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import { SubmitButton } from "@/components/librarian/submit-button";
import { getLibrarianErrorMessage, getReaderDetail, getReaders } from "@/lib/librarian/data";
import {
  formatCount,
  formatDate,
  getGenderLabel,
  toDateInputValue,
} from "@/lib/librarian/presenters";
import type { ReaderStatus } from "@/lib/librarian/types";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readTrimmedSearchParam,
} from "@/lib/librarian/utils";
import { APP_ROUTES } from "@/lib/config/routes";

interface ReadersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const labelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";
const inputClass = "mt-2 ui-input w-full px-4 py-3 text-sm";
const readerStatuses: ReaderStatus[] = ["ACTIVE", "LOCKED", "INACTIVE"];

function buildReaderCardHref(code: string): string {
  return `${APP_ROUTES.librarianReaders}/${encodeURIComponent(code)}/card`;
}

export default async function LibrarianReadersPage({ searchParams }: ReadersPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const query = readTrimmedSearchParam(resolvedSearchParams.query) ?? "";
  const status = readTrimmedSearchParam(resolvedSearchParams.status) ?? "";
  const editCode = readTrimmedSearchParam(resolvedSearchParams.edit);
  let readers;
  let selectedReader;

  try {
    [readers, selectedReader] = await Promise.all([
      getReaders(),
      editCode ? getReaderDetail(editCode).catch(() => null) : Promise.resolve(null),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module độc giả"
        description={getLibrarianErrorMessage(error)}
      />
    );
  }

  const normalizedQuery = query.toLocaleLowerCase("vi");
  const filteredReaders = readers.filter((reader) => {
    const matchesQuery =
      !normalizedQuery ||
      [reader.code, reader.fullName, reader.className, reader.gender ?? "", reader.status]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalizedQuery);
    const matchesStatus = !status || reader.status === status;

    return matchesQuery && matchesStatus;
  });

  const resolvedSelectedReader =
    selectedReader ??
    filteredReaders.find((reader) => reader.code === editCode) ??
    readers.find((reader) => reader.code === editCode) ??
    null;

  const currentHref = buildHref(APP_ROUTES.librarianReaders, {
    query: query || undefined,
    status: status || undefined,
    edit: resolvedSelectedReader?.code,
  });

  const activeReaders = readers.filter((reader) => reader.status === "ACTIVE").length;
  const lockedReaders = readers.filter((reader) => reader.status === "LOCKED").length;
  const inactiveReaders = readers.filter((reader) => reader.status === "INACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quản lý độc giả"
        description="Theo dõi hồ sơ độc giả, cập nhật trạng thái thẻ và thao tác in thẻ thư viện. Màn này bám runtime hiện tại: `GET /readers` chưa hỗ trợ filter hoặc pagination nên bộ lọc đang chạy ở phía frontend."
        actions={
          <>
            <Link
              href={APP_ROUTES.librarianLoans}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Mở borrow / return
            </Link>
            <Link
              href={APP_ROUTES.librarianReports}
              className="ui-button-primary px-4 py-3 text-sm font-semibold"
            >
              Xem reports
            </Link>
          </>
        }
      />

      {feedback ? <FlashBanner tone={feedback.tone} message={feedback.message} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng độc giả"
          value={formatCount(readers.length)}
          hint={`${formatCount(filteredReaders.length)} hồ sơ khớp bộ lọc hiện tại`}
          accent="blue"
        />
        <StatCard
          label="Đang hoạt động"
          value={formatCount(activeReaders)}
          hint={`${formatCount(lockedReaders)} đã khóa`}
          accent="teal"
        />
        <StatCard
          label="Ngừng hoạt động"
          value={formatCount(inactiveReaders)}
          hint="Phù hợp để rà soát hoặc tái kích hoạt"
          accent="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <form
              action={APP_ROUTES.librarianReaders}
              className="grid gap-3 lg:grid-cols-[1fr,220px,auto]"
            >
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Lọc theo mã, họ tên, lớp, giới tính"
                className="ui-input w-full px-4 py-3 text-sm"
              />
              <select
                name="status"
                defaultValue={status}
                className="ui-input w-full px-4 py-3 text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                {readerStatuses.map((readerStatus) => (
                  <option key={readerStatus} value={readerStatus}>
                    {readerStatus}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="ui-button-primary px-4 py-3 text-sm font-semibold"
              >
                Áp dụng
              </button>
            </form>
          </div>

          {filteredReaders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mã độc giả</th>
                    <th className="px-5 py-3">Hồ sơ</th>
                    <th className="px-5 py-3">Ngày sinh</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReaders.map((reader) => (
                    <tr key={reader.code} className="align-top">
                      <td className="px-5 py-4 font-semibold text-slate-900">{reader.code}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{reader.fullName}</p>
                        <p className="text-sm text-slate-500">
                          {reader.className} • {getGenderLabel(reader.gender)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(reader.birthDate)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={reader.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={buildHref(APP_ROUTES.librarianReaders, {
                            query: query || undefined,
                            status: status || undefined,
                            edit: reader.code,
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
                title="Không có độc giả phù hợp"
                description="Điều chỉnh bộ lọc hoặc tạo hồ sơ độc giả mới ở panel bên phải."
              />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {resolvedSelectedReader
                    ? `Cập nhật ${resolvedSelectedReader.code}`
                    : "Tạo độc giả mới"}
                </h2>
                <p className="text-sm text-slate-500">
                  {resolvedSelectedReader
                    ? "Điều chỉnh thông tin hồ sơ và trạng thái hoạt động của độc giả đang chọn."
                    : "Tạo hồ sơ độc giả mới và sẵn sàng in thẻ thư viện ngay sau khi lưu."}
                </p>
              </div>
              {resolvedSelectedReader ? (
                <Link
                  href={buildHref(APP_ROUTES.librarianReaders, {
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
                resolvedSelectedReader
                  ? updateReaderAction.bind(null, resolvedSelectedReader.code)
                  : createReaderAction
              }
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="redirect_to" value={currentHref} />

              <div>
                <label htmlFor="ma_doc_gia" className={labelClass}>
                  Mã độc giả
                </label>
                <input
                  id="ma_doc_gia"
                  name="ma_doc_gia"
                  defaultValue={resolvedSelectedReader?.code ?? ""}
                  disabled={Boolean(resolvedSelectedReader)}
                  className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  placeholder="DG001"
                />
              </div>

              <div>
                <label htmlFor="ho_ten" className={labelClass}>
                  Họ tên
                </label>
                <input
                  id="ho_ten"
                  name="ho_ten"
                  defaultValue={resolvedSelectedReader?.fullName ?? ""}
                  className={inputClass}
                  placeholder="Nguyen Van A"
                />
              </div>

              <div>
                <label htmlFor="lop" className={labelClass}>
                  Lớp
                </label>
                <input
                  id="lop"
                  name="lop"
                  defaultValue={resolvedSelectedReader?.className ?? ""}
                  className={inputClass}
                  placeholder="CNTT-K18"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="ngay_sinh" className={labelClass}>
                    Ngày sinh
                  </label>
                  <input
                    id="ngay_sinh"
                    name="ngay_sinh"
                    type="date"
                    defaultValue={toDateInputValue(resolvedSelectedReader?.birthDate)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="gioi_tinh" className={labelClass}>
                    Giới tính
                  </label>
                  <select
                    id="gioi_tinh"
                    name="gioi_tinh"
                    defaultValue={resolvedSelectedReader?.gender ?? ""}
                    className={inputClass}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="trang_thai" className={labelClass}>
                  Trạng thái
                </label>
                <select
                  id="trang_thai"
                  name="trang_thai"
                  defaultValue={resolvedSelectedReader?.status ?? "ACTIVE"}
                  className={inputClass}
                >
                  {readerStatuses.map((readerStatus) => (
                    <option key={readerStatus} value={readerStatus}>
                      {readerStatus}
                    </option>
                  ))}
                </select>
              </div>

              <SubmitButton
                label={resolvedSelectedReader ? "Lưu cập nhật" : "Tạo độc giả"}
                pendingLabel={resolvedSelectedReader ? "Đang lưu..." : "Đang tạo..."}
                className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>

          {resolvedSelectedReader ? (
            <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Hồ sơ đang chọn</h2>
              <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Mã:</span>{" "}
                  {resolvedSelectedReader.code}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Họ tên:</span>{" "}
                  {resolvedSelectedReader.fullName}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Lớp:</span>{" "}
                  {resolvedSelectedReader.className}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Ngày sinh:</span>{" "}
                  {formatDate(resolvedSelectedReader.birthDate)}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Giới tính:</span>{" "}
                  {getGenderLabel(resolvedSelectedReader.gender)}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">Trạng thái:</span>
                  <StatusBadge status={resolvedSelectedReader.status} />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <form action={buildReaderCardHref(resolvedSelectedReader.code)} method="post" target="_blank">
                  <button
                    type="submit"
                    className="ui-button-secondary w-full px-4 py-3 text-sm font-semibold"
                  >
                    In thẻ thư viện
                  </button>
                </form>

                <form action={deleteReaderAction.bind(null, resolvedSelectedReader.code)}>
                  <input type="hidden" name="redirect_to" value={currentHref} />
                  <SubmitButton
                    label="Xóa độc giả"
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
