import Link from "next/link";

import {
  createStaffAction,
  deleteStaffAction,
  updateStaffAction,
} from "@/app/actions/admin";
import { RoleBadge } from "@/components/admin/role-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import { SubmitButton } from "@/components/librarian/submit-button";
import { getAccounts, getAdminErrorMessage, getStaff, getStaffDetail } from "@/lib/admin/data";
import { STAFF_STATUS_VALUES } from "@/lib/admin/types";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readTrimmedSearchParam,
} from "@/lib/admin/utils";
import { formatCount } from "@/lib/librarian/presenters";
import { APP_ROUTES } from "@/lib/config/routes";

interface AdminStaffPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const inputClass = "mt-2 ui-input w-full px-4 py-3 text-sm";
const labelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";

export default async function AdminStaffPage({ searchParams }: AdminStaffPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const query = readTrimmedSearchParam(resolvedSearchParams.query) ?? "";
  const status = readTrimmedSearchParam(resolvedSearchParams.status) ?? "";
  const editCode = readTrimmedSearchParam(resolvedSearchParams.edit);
  let staff;
  let accounts;
  let selectedStaff;

  try {
    [staff, accounts, selectedStaff] = await Promise.all([
      getStaff(),
      getAccounts(),
      editCode ? getStaffDetail(editCode).catch(() => null) : Promise.resolve(null),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module staff"
        description={getAdminErrorMessage(error)}
      />
    );
  }

  const accountsByStaffCode = new Map(accounts.map((account) => [account.staffCode, account]));
  const normalizedQuery = query.toLocaleLowerCase("vi");
  const filteredStaff = staff.filter((member) => {
    const linkedAccount = accountsByStaffCode.get(member.code);
    const matchesQuery =
      !normalizedQuery ||
      [
        member.code,
        member.fullName,
        member.contactInfo ?? "",
        member.status,
        linkedAccount?.username ?? "",
        linkedAccount?.role ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalizedQuery);
    const matchesStatus = !status || member.status === status;

    return matchesQuery && matchesStatus;
  });

  const resolvedSelectedStaff =
    selectedStaff ??
    filteredStaff.find((member) => member.code === editCode) ??
    staff.find((member) => member.code === editCode) ??
    null;
  const currentHref = buildHref(APP_ROUTES.adminStaff, {
    query: query || undefined,
    status: status || undefined,
    edit: resolvedSelectedStaff?.code,
  });
  const activeStaffCount = staff.filter((member) => member.status === "ACTIVE").length;
  const unassignedStaff = staff.filter((member) => !accountsByStaffCode.has(member.code));
  const lockedStaffCount = staff.filter((member) => member.status === "LOCKED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Management"
        title="Quản lý nhân viên"
        description="Theo dõi staff master data, cập nhật trạng thái hoạt động và kiểm soát việc mỗi nhân viên chỉ gắn tối đa một account. Bộ lọc đang chạy phía frontend để giữ trải nghiệm mượt với runtime API hiện tại."
        actions={
          <>
            <Link
              href={APP_ROUTES.admin}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Về dashboard admin
            </Link>
            <Link
              href={APP_ROUTES.adminAccounts}
              className="ui-button-primary px-4 py-3 text-sm font-semibold"
            >
              Mở module accounts
            </Link>
          </>
        }
      />

      {feedback ? <FlashBanner tone={feedback.tone} message={feedback.message} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng nhân viên"
          value={formatCount(staff.length)}
          hint={`${formatCount(filteredStaff.length)} hồ sơ khớp bộ lọc hiện tại`}
          accent="blue"
        />
        <StatCard
          label="Đang hoạt động"
          value={formatCount(activeStaffCount)}
          hint={`${formatCount(lockedStaffCount)} hồ sơ đang bị khóa`}
          accent="teal"
        />
        <StatCard
          label="Chưa có account"
          value={formatCount(unassignedStaff.length)}
          hint="Có thể provision ngay trong module Accounts"
          accent="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <form
              action={APP_ROUTES.adminStaff}
              className="grid gap-3 lg:grid-cols-[1fr,220px,auto]"
            >
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Lọc theo mã, tên, liên hệ hoặc username"
                className="ui-input w-full px-4 py-3 text-sm"
              />
              <select
                name="status"
                defaultValue={status}
                className="ui-input w-full px-4 py-3 text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                {STAFF_STATUS_VALUES.map((staffStatus) => (
                  <option key={staffStatus} value={staffStatus}>
                    {staffStatus}
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

          {filteredStaff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Nhân viên</th>
                    <th className="px-5 py-3">Liên hệ</th>
                    <th className="px-5 py-3">Account liên kết</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((member) => {
                    const linkedAccount = accountsByStaffCode.get(member.code);

                    return (
                      <tr key={member.code} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{member.fullName}</p>
                          <p className="text-sm text-slate-500">{member.code}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {member.contactInfo ?? "Chưa cập nhật"}
                        </td>
                        <td className="px-5 py-4">
                          {linkedAccount ? (
                            <div className="space-y-2">
                              <p className="font-semibold text-slate-900">{linkedAccount.username}</p>
                              <div className="flex flex-wrap gap-2">
                                <RoleBadge role={linkedAccount.role} />
                                <StatusBadge status={linkedAccount.status} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-amber-700">Chưa có account</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={buildHref(APP_ROUTES.adminStaff, {
                              query: query || undefined,
                              status: status || undefined,
                              edit: member.code,
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
                title="Không có staff phù hợp"
                description="Thử nới lỏng bộ lọc hoặc tạo hồ sơ nhân viên mới ở panel bên phải."
              />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {resolvedSelectedStaff
                    ? `Cập nhật ${resolvedSelectedStaff.code}`
                    : "Tạo nhân viên mới"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {resolvedSelectedStaff
                    ? "Điều chỉnh hồ sơ nhân viên, thông tin liên hệ và trạng thái hoạt động."
                    : "Tạo hồ sơ staff trước khi cấp account và role ở module Accounts."}
                </p>
              </div>
              {resolvedSelectedStaff ? (
                <Link
                  href={buildHref(APP_ROUTES.adminStaff, {
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
                resolvedSelectedStaff
                  ? updateStaffAction.bind(null, resolvedSelectedStaff.code)
                  : createStaffAction
              }
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="redirect_to" value={currentHref} />

              {resolvedSelectedStaff ? (
                <div>
                  <label htmlFor="code-readonly" className={labelClass}>
                    Mã nhân viên
                  </label>
                  <input
                    id="code-readonly"
                    value={resolvedSelectedStaff.code}
                    readOnly
                    disabled
                    className={`${inputClass} bg-slate-50 text-slate-500`}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="code" className={labelClass}>
                    Mã nhân viên
                  </label>
                  <input
                    id="code"
                    name="code"
                    placeholder="NV001"
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="fullName" className={labelClass}>
                  Họ tên
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  defaultValue={resolvedSelectedStaff?.fullName}
                  placeholder="Nguyen Van B"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="contactInfo" className={labelClass}>
                  Thông tin liên hệ
                </label>
                <input
                  id="contactInfo"
                  name="contactInfo"
                  defaultValue={resolvedSelectedStaff?.contactInfo ?? ""}
                  placeholder="email, số điện thoại hoặc mô tả liên hệ"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Trạng thái
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={resolvedSelectedStaff?.status ?? "ACTIVE"}
                  className={inputClass}
                >
                  {STAFF_STATUS_VALUES.map((staffStatus) => (
                    <option key={staffStatus} value={staffStatus}>
                      {staffStatus}
                    </option>
                  ))}
                </select>
              </div>

              <SubmitButton
                label={resolvedSelectedStaff ? "Lưu cập nhật staff" : "Tạo staff"}
                pendingLabel={
                  resolvedSelectedStaff ? "Đang cập nhật staff..." : "Đang tạo staff..."
                }
                className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>

            {resolvedSelectedStaff ? (
              <form
                action={deleteStaffAction.bind(null, resolvedSelectedStaff.code)}
                className="mt-4"
              >
                <input type="hidden" name="redirect_to" value={currentHref} />
                <button
                  type="submit"
                  className="ui-button-danger w-full px-4 py-3 text-sm font-semibold"
                >
                  Xóa mềm staff này
                </button>
              </form>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Staff chưa có account</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Danh sách ưu tiên để chuyển sang bước provision tài khoản.
                </p>
              </div>
              <Link
                href={APP_ROUTES.adminAccounts}
                className="text-sm font-semibold text-slate-700 hover:text-slate-950"
              >
                Mở accounts
              </Link>
            </div>

            {unassignedStaff.length > 0 ? (
              <div className="mt-5 space-y-3">
                {unassignedStaff.slice(0, 5).map((member) => (
                  <article
                    key={member.code}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{member.fullName}</p>
                        <p className="text-sm text-slate-500">
                          {member.code}
                          {member.contactInfo ? ` • ${member.contactInfo}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={member.status} />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Không còn staff chờ cấp account"
                  description="Tất cả nhân viên hiện đã được gắn tài khoản hoặc chưa có hồ sơ mới."
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
