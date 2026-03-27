import type { AccountRole } from "@/lib/auth/auth.types";

export type StaffStatus = "ACTIVE" | "LOCKED" | "INACTIVE";
export type AccountStatus = "ACTIVE" | "LOCKED" | "INACTIVE";

export const STAFF_STATUS_VALUES: readonly StaffStatus[] = [
  "ACTIVE",
  "LOCKED",
  "INACTIVE",
];

export const ACCOUNT_STATUS_VALUES: readonly AccountStatus[] = [
  "ACTIVE",
  "LOCKED",
  "INACTIVE",
];

export const ACCOUNT_ROLE_VALUES: readonly AccountRole[] = [
  "ADMIN",
  "LIBRARIAN",
  "LEADER",
];

export interface Staff {
  code: string;
  fullName: string;
  contactInfo: string | null;
  status: StaffStatus;
}

export interface Account {
  username: string;
  role: AccountRole;
  staffCode: string;
  status: AccountStatus;
  staffName?: string | null;
}
