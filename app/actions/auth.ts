"use server";

import { redirect } from "next/navigation";

import type { LoginFormState } from "@/lib/auth/auth.types";
import { destroySession, getDefaultRouteForRole, persistSession } from "@/lib/auth/auth.session";
import { loginRequest, logoutRequest } from "@/lib/api/api-client";
import { isApiError } from "@/lib/api/api-errors";
import { APP_ROUTES } from "@/lib/config/routes";

function readStringField(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previousState: LoginFormState | undefined,
  formData: FormData
): Promise<LoginFormState | undefined> {
  const username = readStringField(formData, "username");
  const password = readStringField(formData, "password");

  if (!username || !password) {
    return {
      message: "Vui lòng nhập đầy đủ thông tin đăng nhập.",
      fieldErrors: {
        username: !username ? "Tên đăng nhập là bắt buộc." : undefined,
        password: !password ? "Mật khẩu là bắt buộc." : undefined,
      },
    };
  }

  try {
    const response = await loginRequest(username, password);

    await persistSession({
      tokens: {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      },
      sessionData: {
        user: response.user,
        issuedAt: new Date().toISOString(),
      },
    });

    redirect(getDefaultRouteForRole(response.user.role));
  } catch (error: unknown) {
    if (isApiError(error)) {
      if (error.status === 401) {
        return {
          message: "Sai tên đăng nhập hoặc mật khẩu.",
        };
      }

      if (error.status === 403) {
        return {
          message: "Tài khoản hoặc nhân viên hiện không hoạt động.",
        };
      }

      return {
        message: error.message,
      };
    }

    return {
      message: "Đăng nhập thất bại. Vui lòng thử lại.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await logoutRequest();
  } finally {
    await destroySession();
  }

  redirect(APP_ROUTES.login);
}
