import { ApiError } from "@/lib/api/api-errors";
import { apiRequest } from "@/lib/api/api-client";
import { accountEndpoints, staffEndpoints } from "@/lib/api/endpoints";
import type { AccountRole } from "@/lib/auth/auth.types";
import type { Account, AccountStatus, Staff, StaffStatus } from "@/lib/admin/types";

interface BackendStaff {
  code?: string;
  ma_nhan_vien?: string;
  fullName?: string;
  ho_ten?: string;
  contactInfo?: string | null;
  thong_tin_lien_he?: string | null;
  status?: StaffStatus;
  trang_thai?: StaffStatus;
}

interface BackendAccount {
  username?: string;
  role?: AccountRole;
  staffCode?: string | null;
  ma_nhan_vien?: string | null;
  status?: AccountStatus;
  trang_thai?: AccountStatus;
  staffName?: string | null;
  fullName?: string | null;
  staff?: BackendStaff | null;
}

function readOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized ? normalized : null;
}

function mapStaff(staff: BackendStaff): Staff {
  return {
    code: readOptionalString(staff.code) ?? readOptionalString(staff.ma_nhan_vien) ?? "",
    fullName:
      readOptionalString(staff.fullName) ??
      readOptionalString(staff.ho_ten) ??
      "Chưa có tên nhân viên",
    contactInfo:
      readOptionalString(staff.contactInfo) ?? readOptionalString(staff.thong_tin_lien_he),
    status: (staff.status ?? staff.trang_thai ?? "ACTIVE") as StaffStatus,
  };
}

function mapAccount(account: BackendAccount): Account {
  return {
    username: readOptionalString(account.username) ?? "",
    role: (account.role ?? "LIBRARIAN") as AccountRole,
    staffCode:
      readOptionalString(account.staffCode) ??
      readOptionalString(account.ma_nhan_vien) ??
      readOptionalString(account.staff?.code) ??
      readOptionalString(account.staff?.ma_nhan_vien) ??
      "",
    status: (account.status ?? account.trang_thai ?? "ACTIVE") as AccountStatus,
    staffName:
      readOptionalString(account.staffName) ??
      readOptionalString(account.fullName) ??
      readOptionalString(account.staff?.fullName) ??
      readOptionalString(account.staff?.ho_ten),
  };
}

export async function getStaff(): Promise<Staff[]> {
  const staff = await apiRequest<BackendStaff[]>(staffEndpoints.list);

  return staff.map(mapStaff).toSorted((left, right) => left.code.localeCompare(right.code, "vi"));
}

export async function getStaffDetail(code: string): Promise<Staff> {
  const staff = await apiRequest<BackendStaff>(staffEndpoints.detail(code));

  return mapStaff(staff);
}

export async function getAccounts(): Promise<Account[]> {
  const accounts = await apiRequest<BackendAccount[]>(accountEndpoints.list);

  return accounts
    .map(mapAccount)
    .toSorted((left, right) => left.username.localeCompare(right.username, "vi"));
}

export async function getAccountDetail(username: string): Promise<Account> {
  const account = await apiRequest<BackendAccount>(accountEndpoints.detail(username));

  return mapAccount(account);
}

export function getAdminErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu quản trị từ API.";
}
