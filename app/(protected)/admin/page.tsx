import Link from "next/link";

import { RoleBadge } from "@/components/admin/role-badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/librarian/page-header";
import { StatCard } from "@/components/librarian/stat-card";
import { StatusBadge } from "@/components/librarian/status-badge";
import { getAccounts, getAdminErrorMessage, getStaff } from "@/lib/admin/data";
import { ACCOUNT_ROLE_VALUES } from "@/lib/admin/types";
import { formatCount } from "@/lib/librarian/presenters";
import { APP_ROUTES } from "@/lib/config/routes";

export default async function AdminDashboardPage() {
  let staff;
  let accounts;

  try {
    [staff, accounts] = await Promise.all([getStaff(), getAccounts()]);
  } catch (error: unknown) {
    return (
      <ErrorState
        title="Không thể tải dashboard Admin"
        description={getAdminErrorMessage(error)}
      />
    );
  }

  const accountsByStaffCode = new Map(accounts.map((account) => [account.staffCode, account]));
  const activeStaffCount = staff.filter((member) => member.status === "ACTIVE").length;
  const activeAccountsCount = accounts.filter((account) => account.status === "ACTIVE").length;
  const accountsNeedingAttention = accounts.filter((account) => account.status !== "ACTIVE").length;
  const unassignedStaff = staff.filter((member) => !accountsByStaffCode.has(member.code));
  const coverageRows = staff
    .map((member) => ({
      member,
      account: accountsByStaffCode.get(member.code) ?? null,
    }))
    .toSorted((left, right) => {
      if (!left.account && right.account) {
        return -1;
      }

      if (left.account && !right.account) {
        return 1;
      }

      return left.member.code.localeCompare(right.member.code, "vi");
    });

  const roleSummaries = ACCOUNT_ROLE_VALUES.map((role) => ({
    role,
    total: accounts.filter((account) => account.role === role).length,
    active: accounts.filter((account) => account.role === role && account.status === "ACTIVE").length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Management"
        title="Quản trị nhân viên và truy cập"
        description="Theo dõi nhanh độ phủ staff-account, phân bổ role và những account cần rà soát. Tác vụ chi tiết được tách riêng thành module Staff và Accounts để bám đúng boundary `ADMIN`."
        actions={
          <>
            <Link
              href={APP_ROUTES.adminStaff}
              className="ui-button-secondary min-h-12 px-5 py-3 text-sm font-semibold"
            >
              Quản lý staff
            </Link>
            <Link
              href={APP_ROUTES.adminAccounts}
              className="ui-button-primary min-h-12 px-5 py-3 text-sm font-semibold"
            >
              Quản lý accounts
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng nhân viên"
          value={formatCount(staff.length)}
          hint={`${formatCount(activeStaffCount)} nhân viên đang active`}
          accent="blue"
        />
        <StatCard
          label="Đã cấp account"
          value={formatCount(accounts.length)}
          hint={`${formatCount(activeAccountsCount)} account truy cập đang active`}
          accent="teal"
        />
        <StatCard
          label="Chưa có account"
          value={formatCount(unassignedStaff.length)}
          hint="Nhóm nhân viên còn chờ provision quyền truy cập"
          accent="amber"
        />
        <StatCard
          label="Cần rà soát truy cập"
          value={formatCount(accountsNeedingAttention)}
          hint="Account LOCKED / INACTIVE nên được kiểm tra lại"
          accent="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Tổng quan phân bổ role</h2>
            <p className="mt-1 text-sm text-slate-500">
              So sánh số account theo role và tình trạng active hiện tại.
            </p>
          </div>
          <div className="space-y-4 p-5">
            {roleSummaries.map((summary) => (
              <article
                key={summary.role}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <RoleBadge role={summary.role} />
                    <p className="text-sm text-slate-500">
                      {formatCount(summary.total)} account, trong đó {formatCount(summary.active)} account active
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Total
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatCount(summary.total)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white bg-white px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Active
                      </p>
                      <p className="mt-2 text-xl font-semibold text-slate-950">
                        {formatCount(summary.active)}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Staff chờ cấp account</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ưu tiên provision cho nhân viên chưa có tài khoản để tránh trùng `staffCode`.
            </p>
          </div>
          {unassignedStaff.length > 0 ? (
            <div className="space-y-3 p-5">
              {unassignedStaff.slice(0, 6).map((member) => (
                <article
                  key={member.code}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
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
              <Link
                href={APP_ROUTES.adminAccounts}
                className="ui-button-secondary mt-2 w-full px-4 py-3 text-sm font-semibold"
              >
                Đi tới module cấp account
              </Link>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="Tất cả staff đã có account"
                description="Danh sách này sẽ tự động hiện khi có nhân viên mới chưa được cấp quyền truy cập."
              />
            </div>
          )}
        </section>
      </div>

      <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Ma trận staff-account</h2>
            <p className="text-sm text-slate-500">
              Theo dõi nhanh account đang gắn với từng nhân viên và tình trạng truy cập.
            </p>
          </div>
          <Link
            href={APP_ROUTES.adminStaff}
            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
          >
            Mở chi tiết staff
          </Link>
        </div>

        {coverageRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nhân viên</th>
                  <th className="px-5 py-3">Thông tin liên hệ</th>
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Role / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coverageRows.slice(0, 10).map(({ member, account }) => (
                  <tr key={member.code} className="align-top">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{member.fullName}</p>
                      <p className="text-sm text-slate-500">{member.code}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {member.contactInfo ?? "Chưa cập nhật"}
                    </td>
                    <td className="px-5 py-4">
                      {account ? (
                        <div>
                          <p className="font-semibold text-slate-900">{account.username}</p>
                          <p className="text-sm text-slate-500">{account.staffCode}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-amber-700">Chưa có account</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {account ? (
                        <div className="flex flex-wrap gap-2">
                          <RoleBadge role={account.role} />
                          <StatusBadge status={account.status} />
                        </div>
                      ) : (
                        <StatusBadge status={member.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5">
            <EmptyState
              title="Chưa có dữ liệu staff"
              description="Hãy tạo nhân viên mới trong module Staff trước khi provision account."
            />
          </div>
        )}
      </section>
    </div>
  );
}
