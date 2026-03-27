import Link from "next/link";

import {
  createAccountAction,
  deleteAccountAction,
  updateAccountAction,
} from "@/app/actions/admin";
import { RoleBadge } from "@/components/admin/role-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { FlashBanner } from "@/components/librarian/flash-banner";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import { SubmitButton } from "@/components/librarian/submit-button";
import {
  getAccountDetail,
  getAccounts,
  getAdminErrorMessage,
  getStaff,
} from "@/lib/admin/data";
import {
  ACCOUNT_ROLE_VALUES,
  ACCOUNT_STATUS_VALUES,
} from "@/lib/admin/types";
import {
  buildHref,
  getFeedbackFromSearchParams,
  readTrimmedSearchParam,
} from "@/lib/admin/utils";
import { formatCount } from "@/lib/librarian/presenters";
import { APP_ROUTES } from "@/lib/config/routes";

interface AdminAccountsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const inputClass = "mt-2 ui-input w-full px-4 py-3 text-sm";
const labelClass = "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500";

export default async function AdminAccountsPage({ searchParams }: AdminAccountsPageProps) {
  const resolvedSearchParams = await searchParams;
  const feedback = getFeedbackFromSearchParams(resolvedSearchParams);
  const query = readTrimmedSearchParam(resolvedSearchParams.query) ?? "";
  const role = readTrimmedSearchParam(resolvedSearchParams.role) ?? "";
  const status = readTrimmedSearchParam(resolvedSearchParams.status) ?? "";
  const editUsername = readTrimmedSearchParam(resolvedSearchParams.edit);
  let accounts;
  let staff;
  let selectedAccount;

  try {
    [accounts, staff, selectedAccount] = await Promise.all([
      getAccounts(),
      getStaff(),
      editUsername ? getAccountDetail(editUsername).catch(() => null) : Promise.resolve(null),
    ]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải module accounts"
        description={getAdminErrorMessage(error)}
      />
    );
  }

  const staffByCode = new Map(staff.map((member) => [member.code, member]));
  const accountsByStaffCode = new Map(accounts.map((account) => [account.staffCode, account]));
  const normalizedQuery = query.toLocaleLowerCase("vi");
  const filteredAccounts = accounts.filter((account) => {
    const linkedStaff = staffByCode.get(account.staffCode);
    const matchesQuery =
      !normalizedQuery ||
      [
        account.username,
        account.role,
        account.status,
        account.staffCode,
        account.staffName ?? "",
        linkedStaff?.fullName ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("vi")
        .includes(normalizedQuery);
    const matchesRole = !role || account.role === role;
    const matchesStatus = !status || account.status === status;

    return matchesQuery && matchesRole && matchesStatus;
  });

  const resolvedSelectedAccount =
    selectedAccount ??
    filteredAccounts.find((account) => account.username === editUsername) ??
    accounts.find((account) => account.username === editUsername) ??
    null;
  const selectedStaff = resolvedSelectedAccount
    ? staffByCode.get(resolvedSelectedAccount.staffCode) ?? null
    : null;
  const currentHref = buildHref(APP_ROUTES.adminAccounts, {
    query: query || undefined,
    role: role || undefined,
    status: status || undefined,
    edit: resolvedSelectedAccount?.username,
  });
  const provisionableStaff = staff
    .filter((member) => !accountsByStaffCode.has(member.code))
    .toSorted((left, right) => {
      if (left.status === right.status) {
        return left.code.localeCompare(right.code, "vi");
      }

      if (left.status === "ACTIVE") {
        return -1;
      }

      if (right.status === "ACTIVE") {
        return 1;
      }

      return left.status.localeCompare(right.status, "vi");
    });
  const activeAccountsCount = accounts.filter((account) => account.status === "ACTIVE").length;
  const lockedAccountsCount = accounts.filter((account) => account.status === "LOCKED").length;
  const inactiveAccountsCount = accounts.filter((account) => account.status === "INACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Management"
        title="Quản lý tài khoản và phân quyền"
        description="Tạo account mới cho staff chưa được provision, cập nhật role, khóa hoặc ngừng hoạt động account, và đổi mật khẩu qua `newPassword` khi cần."
        actions={
          <>
            <Link
              href={APP_ROUTES.admin}
              className="ui-button-secondary px-4 py-3 text-sm font-semibold"
            >
              Về dashboard admin
            </Link>
            <Link
              href={APP_ROUTES.adminStaff}
              className="ui-button-primary px-4 py-3 text-sm font-semibold"
            >
              Mở module staff
            </Link>
          </>
        }
      />

      {feedback ? <FlashBanner tone={feedback.tone} message={feedback.message} /> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng account"
          value={formatCount(accounts.length)}
          hint={`${formatCount(filteredAccounts.length)} account khớp bộ lọc hiện tại`}
          accent="blue"
        />
        <StatCard
          label="Đang active"
          value={formatCount(activeAccountsCount)}
          hint={`${formatCount(lockedAccountsCount)} account đang bị khóa`}
          accent="teal"
        />
        <StatCard
          label="Có thể cấp mới"
          value={formatCount(provisionableStaff.length)}
          hint={`${formatCount(inactiveAccountsCount)} account đang ở trạng thái inactive`}
          accent="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr,1fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <form
              action={APP_ROUTES.adminAccounts}
              className="grid gap-3 lg:grid-cols-[1fr,200px,200px,auto]"
            >
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Lọc theo username, staff hoặc role"
                className="ui-input w-full px-4 py-3 text-sm"
              />
              <select
                name="role"
                defaultValue={role}
                className="ui-input w-full px-4 py-3 text-sm"
              >
                <option value="">Tất cả role</option>
                {ACCOUNT_ROLE_VALUES.map((accountRole) => (
                  <option key={accountRole} value={accountRole}>
                    {accountRole}
                  </option>
                ))}
              </select>
              <select
                name="status"
                defaultValue={status}
                className="ui-input w-full px-4 py-3 text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                {ACCOUNT_STATUS_VALUES.map((accountStatus) => (
                  <option key={accountStatus} value={accountStatus}>
                    {accountStatus}
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

          {filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Username</th>
                    <th className="px-5 py-3">Nhân viên</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.map((account) => {
                    const linkedStaff = staffByCode.get(account.staffCode);

                    return (
                      <tr key={account.username} className="align-top">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{account.username}</p>
                          <p className="text-sm text-slate-500">{account.staffCode}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {account.staffName ?? linkedStaff?.fullName ?? "Chưa đồng bộ staff"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {linkedStaff?.contactInfo ?? "Chưa có thông tin liên hệ"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <RoleBadge role={account.role} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={account.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={buildHref(APP_ROUTES.adminAccounts, {
                              query: query || undefined,
                              role: role || undefined,
                              status: status || undefined,
                              edit: account.username,
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
                title="Không có account phù hợp"
                description="Điều chỉnh bộ lọc hoặc cấp account mới ở panel bên phải."
              />
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {resolvedSelectedAccount
                    ? `Cập nhật ${resolvedSelectedAccount.username}`
                    : "Cấp account mới"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {resolvedSelectedAccount
                    ? "Đổi role, trạng thái hoặc reset mật khẩu cho account đã tồn tại."
                    : "Ưu tiên chọn staff chưa có account để đảm bảo quan hệ 1 - 0..1."}
                </p>
              </div>
              {resolvedSelectedAccount ? (
                <Link
                  href={buildHref(APP_ROUTES.adminAccounts, {
                    query: query || undefined,
                    role: role || undefined,
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
                resolvedSelectedAccount
                  ? updateAccountAction.bind(null, resolvedSelectedAccount.username)
                  : createAccountAction
              }
              className="mt-5 space-y-4"
            >
              <input type="hidden" name="redirect_to" value={currentHref} />

              {resolvedSelectedAccount ? (
                <>
                  <div>
                    <label htmlFor="username-readonly" className={labelClass}>
                      Username
                    </label>
                    <input
                      id="username-readonly"
                      value={resolvedSelectedAccount.username}
                      readOnly
                      disabled
                      className={`${inputClass} bg-slate-50 text-slate-500`}
                    />
                  </div>

                  <div>
                    <label htmlFor="staffCode-readonly" className={labelClass}>
                      Staff liên kết
                    </label>
                    <input
                      id="staffCode-readonly"
                      value={
                        selectedStaff
                          ? `${selectedStaff.fullName} (${selectedStaff.code})`
                          : resolvedSelectedAccount.staffCode
                      }
                      readOnly
                      disabled
                      className={`${inputClass} bg-slate-50 text-slate-500`}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="username" className={labelClass}>
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      placeholder="admin01"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="staffCode" className={labelClass}>
                      Staff được cấp account
                    </label>
                    <select
                      id="staffCode"
                      name="staffCode"
                      className={inputClass}
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        {provisionableStaff.length > 0
                          ? "Chọn staff chưa có account"
                          : "Không còn staff khả dụng"}
                      </option>
                      {provisionableStaff.map((member) => (
                        <option key={member.code} value={member.code}>
                          {member.fullName} ({member.code}) - {member.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Mật khẩu khởi tạo
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className={inputClass}
                      placeholder="Tối thiểu 8 ký tự"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="role" className={labelClass}>
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue={resolvedSelectedAccount?.role ?? "LIBRARIAN"}
                  className={inputClass}
                >
                  {ACCOUNT_ROLE_VALUES.map((accountRole) => (
                    <option key={accountRole} value={accountRole}>
                      {accountRole}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className={labelClass}>
                  Trạng thái
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={resolvedSelectedAccount?.status ?? "ACTIVE"}
                  className={inputClass}
                >
                  {ACCOUNT_STATUS_VALUES.map((accountStatus) => (
                    <option key={accountStatus} value={accountStatus}>
                      {accountStatus}
                    </option>
                  ))}
                </select>
              </div>

              {resolvedSelectedAccount ? (
                <div>
                  <label htmlFor="newPassword" className={labelClass}>
                    Mật khẩu mới
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className={inputClass}
                    placeholder="Bỏ trống nếu chưa cần đổi"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Nếu chỉnh đúng tài khoản đang đăng nhập, hệ thống sẽ yêu cầu đăng nhập lại để đồng bộ role và session.
                  </p>
                </div>
              ) : null}

              {resolvedSelectedAccount || provisionableStaff.length > 0 ? (
                <SubmitButton
                  label={resolvedSelectedAccount ? "Lưu cập nhật account" : "Cấp account"}
                  pendingLabel={
                    resolvedSelectedAccount
                      ? "Đang cập nhật account..."
                      : "Đang cấp account..."
                  }
                  className="ui-button-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Không còn staff nào chưa có account. Hãy tạo staff mới hoặc chỉnh sửa account hiện có.
                </div>
              )}
            </form>

            {resolvedSelectedAccount ? (
              <form
                action={deleteAccountAction.bind(null, resolvedSelectedAccount.username)}
                className="mt-4"
              >
                <input type="hidden" name="redirect_to" value={currentHref} />
                <button
                  type="submit"
                  className="ui-button-danger w-full px-4 py-3 text-sm font-semibold"
                >
                  Xóa mềm account này
                </button>
              </form>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Staff có thể provision</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Danh sách staff chưa có account để admin cấp quyền nhanh.
                </p>
              </div>
              <Link
                href={APP_ROUTES.adminStaff}
                className="text-sm font-semibold text-slate-700 hover:text-slate-950"
              >
                Xem staff
              </Link>
            </div>

            {provisionableStaff.length > 0 ? (
              <div className="mt-5 space-y-3">
                {provisionableStaff.slice(0, 6).map((member) => (
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
                  title="Không còn staff khả dụng"
                  description="Mọi nhân viên hiện đã được gắn account hoặc chưa có staff mới để provision."
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
