"use server";

import { redirect } from "next/navigation";

import { apiRequest } from "@/lib/api/api-client";
import { isApiError } from "@/lib/api/api-errors";
import { accountEndpoints, staffEndpoints } from "@/lib/api/endpoints";
import {
  ACCOUNT_ROLE_VALUES,
  ACCOUNT_STATUS_VALUES,
  STAFF_STATUS_VALUES,
} from "@/lib/admin/types";
import { buildHref, sanitizeAdminRedirect, updateHref } from "@/lib/admin/utils";
import { destroySession, requireSession } from "@/lib/auth/auth.session";
import { assertRole } from "@/lib/auth/rbac";
import { APP_ROUTES } from "@/lib/config/routes";

class AdminValidationError extends Error {}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, name: string): string | undefined {
  const value = readText(formData, name);

  return value ? value : undefined;
}

function readRequiredText(formData: FormData, name: string, label: string): string {
  const value = readText(formData, name);

  if (!value) {
    throw new AdminValidationError(`${label} là bắt buộc.`);
  }

  return value;
}

function readEnumValue<T extends string>(
  formData: FormData,
  name: string,
  label: string,
  allowedValues: readonly T[]
): T {
  const value = readRequiredText(formData, name, label) as T;

  if (!allowedValues.includes(value)) {
    throw new AdminValidationError(`${label} không hợp lệ.`);
  }

  return value;
}

function validatePassword(value: string, label: string): string {
  if (value.length < 8) {
    throw new AdminValidationError(`${label} phải có ít nhất 8 ký tự.`);
  }

  return value;
}

function translateAdminError(error: unknown): string {
  if (!isApiError(error)) {
    return "Không thể hoàn tất thao tác quản trị. Vui lòng thử lại.";
  }

  if (error.code === "SESSION_EXPIRED" || error.status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (error.status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  const normalizedMessage = error.message.toLocaleLowerCase("vi");

  if (normalizedMessage.includes("staff not found")) {
    return "Nhân viên không tồn tại hoặc đã bị xóa mềm.";
  }

  if (normalizedMessage.includes("account not found")) {
    return "Tài khoản không tồn tại hoặc đã bị xóa mềm.";
  }

  if (
    normalizedMessage.includes("staff code already exists") ||
    normalizedMessage.includes("staff already exists")
  ) {
    return "Mã nhân viên đã tồn tại.";
  }

  if (
    normalizedMessage.includes("username already exists") ||
    normalizedMessage.includes("username has already been taken")
  ) {
    return "Username đã tồn tại.";
  }

  if (
    normalizedMessage.includes("staff already has an account") ||
    normalizedMessage.includes("already linked to an account") ||
    normalizedMessage.includes("ma_nhan_vien")
  ) {
    return "Nhân viên này đã được gắn tài khoản khác. Hãy chọn nhân viên chưa có account.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("8")) {
    return "Mật khẩu phải có ít nhất 8 ký tự.";
  }

  if (error.status === 409) {
    return "Thao tác bị từ chối do dữ liệu đang phụ thuộc hoặc bị trùng. Hãy kiểm tra lại.";
  }

  return error.message;
}

function buildFeedbackRedirectHref(
  rawRedirectTo: FormDataEntryValue | string | null | undefined,
  fallbackPath: string,
  options: {
    notice?: string;
    error?: string;
    dropParams?: string[];
  }
): string {
  const basePath = sanitizeAdminRedirect(rawRedirectTo, fallbackPath);

  return updateHref(basePath, {
    notice: options.notice ?? null,
    error: options.error ?? null,
    ...(options.dropParams ?? []).reduce<Record<string, null>>((accumulator, key) => {
      accumulator[key] = null;
      return accumulator;
    }, {}),
  });
}

async function ensureAdmin() {
  const session = await requireSession();

  assertRole(session.sessionData.user.role, ["ADMIN"]);

  return session;
}

function buildStaffPayload(formData: FormData, withCode: boolean) {
  return {
    ...(withCode
      ? {
          code: readRequiredText(formData, "code", "Mã nhân viên"),
        }
      : {}),
    fullName: readRequiredText(formData, "fullName", "Họ tên"),
    contactInfo: readRequiredText(formData, "contactInfo", "Thông tin liên hệ"),
    status: readEnumValue(formData, "status", "Trạng thái", STAFF_STATUS_VALUES),
  };
}

function buildAccountCreatePayload(formData: FormData) {
  return {
    username: readRequiredText(formData, "username", "Username"),
    password: validatePassword(
      readRequiredText(formData, "password", "Mật khẩu"),
      "Mật khẩu"
    ),
    role: readEnumValue(formData, "role", "Role", ACCOUNT_ROLE_VALUES),
    staffCode: readRequiredText(formData, "staffCode", "Nhân viên"),
    status: readEnumValue(formData, "status", "Trạng thái", ACCOUNT_STATUS_VALUES),
  };
}

function buildAccountUpdatePayload(formData: FormData) {
  const newPassword = readOptionalText(formData, "newPassword");

  return {
    role: readEnumValue(formData, "role", "Role", ACCOUNT_ROLE_VALUES),
    status: readEnumValue(formData, "status", "Trạng thái", ACCOUNT_STATUS_VALUES),
    ...(newPassword
      ? {
          newPassword: validatePassword(newPassword, "Mật khẩu mới"),
        }
      : {}),
  };
}

export async function createStaffAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {});

  try {
    await ensureAdmin();
    const payload = buildStaffPayload(formData, true);

    await apiRequest(staffEndpoints.list, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {
      notice: `Nhân viên ${payload.code} đã được tạo.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof AdminValidationError ? error.message : translateAdminError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function updateStaffAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {});

  try {
    await ensureAdmin();

    await apiRequest(staffEndpoints.detail(code), {
      method: "PATCH",
      body: JSON.stringify(buildStaffPayload(formData, false)),
    });

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {
      notice: `Nhân viên ${code} đã được cập nhật.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof AdminValidationError ? error.message : translateAdminError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function deleteStaffAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {});

  try {
    await ensureAdmin();

    await apiRequest(staffEndpoints.detail(code), {
      method: "DELETE",
    });

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {
      notice: `Nhân viên ${code} đã được đưa ra khỏi danh sách hoạt động.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminStaff, {
      error: translateAdminError(error),
    });
  }

  redirect(nextHref);
}

export async function createAccountAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {});

  try {
    await ensureAdmin();
    const payload = buildAccountCreatePayload(formData);

    await apiRequest(accountEndpoints.list, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {
      notice: `Tài khoản ${payload.username} đã được cấp cho ${payload.staffCode}.`,
    });
  } catch (error: unknown) {
    const message =
      error instanceof AdminValidationError ? error.message : translateAdminError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function updateAccountAction(
  username: string,
  formData: FormData
): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {});
  let forceReloginNotice: string | null = null;

  try {
    const session = await ensureAdmin();

    await apiRequest(accountEndpoints.detail(username), {
      method: "PATCH",
      body: JSON.stringify(buildAccountUpdatePayload(formData)),
    });

    if (session.sessionData.user.username === username) {
      await destroySession();
      forceReloginNotice = "Tài khoản hiện tại đã thay đổi. Vui lòng đăng nhập lại.";
    } else {
      nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {
        notice: `Tài khoản ${username} đã được cập nhật.`,
        dropParams: ["edit"],
      });
    }
  } catch (error: unknown) {
    const message =
      error instanceof AdminValidationError ? error.message : translateAdminError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {
      error: message,
    });
  }

  if (forceReloginNotice) {
    redirect(
      buildHref(APP_ROUTES.login, {
        notice: forceReloginNotice,
      })
    );
  }

  redirect(nextHref);
}

export async function deleteAccountAction(
  username: string,
  formData: FormData
): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {});
  let forceReloginNotice: string | null = null;

  try {
    const session = await ensureAdmin();

    await apiRequest(accountEndpoints.detail(username), {
      method: "DELETE",
    });

    if (session.sessionData.user.username === username) {
      await destroySession();
      forceReloginNotice =
        "Tài khoản hiện tại đã bị gỡ. Vui lòng đăng nhập bằng tài khoản khác.";
    } else {
      nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {
        notice: `Tài khoản ${username} đã được xóa khỏi danh sách hoạt động.`,
        dropParams: ["edit"],
      });
    }
  } catch (error: unknown) {
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.adminAccounts, {
      error: translateAdminError(error),
    });
  }

  if (forceReloginNotice) {
    redirect(
      buildHref(APP_ROUTES.login, {
        notice: forceReloginNotice,
      })
    );
  }

  redirect(nextHref);
}
