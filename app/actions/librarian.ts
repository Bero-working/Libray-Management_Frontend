"use server";

import { redirect } from "next/navigation";

import { apiRequest } from "@/lib/api/api-client";
import { isApiError } from "@/lib/api/api-errors";
import {
  copyEndpoints,
  loanEndpoints,
  majorEndpoints,
  readerEndpoints,
  titleEndpoints,
} from "@/lib/api/endpoints";
import { requireSession } from "@/lib/auth/auth.session";
import { assertRole } from "@/lib/auth/rbac";
import { APP_ROUTES } from "@/lib/config/routes";
import type {
  BookCopyStatus,
  ReaderGender,
  ReaderStatus,
} from "@/lib/librarian/types";
import { sanitizeLibrarianRedirect, updateHref } from "@/lib/librarian/utils";

class LibrarianValidationError extends Error {}

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, name: string): string | undefined {
  const value = readText(formData, name);

  return value ? value : undefined;
}

function readNullableText(formData: FormData, name: string): string | null {
  const value = readText(formData, name);

  return value || null;
}

function readRequiredText(formData: FormData, name: string, label: string): string {
  const value = readText(formData, name);

  if (!value) {
    throw new LibrarianValidationError(`${label} là bắt buộc.`);
  }

  return value;
}

function readPositiveInteger(formData: FormData, name: string, label: string): number {
  const value = readRequiredText(formData, name, label);
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new LibrarianValidationError(`${label} phải là số nguyên dương.`);
  }

  return parsed;
}

function translateApiError(error: unknown): string {
  if (!isApiError(error)) {
    return "Không thể hoàn tất thao tác. Vui lòng thử lại.";
  }

  const messageByCode: Record<string, string> = {
    BR_04_ACTIVE_LOAN_EXISTS:
      "Độc giả hiện đang có phiếu mượn chưa trả nên chưa thể lập phiếu mới.",
    BR_06_COPY_NOT_AVAILABLE:
      "Bản sao hiện không ở trạng thái AVAILABLE nên không thể cho mượn.",
    BR_07_TITLE_HAS_DEPENDENCIES:
      "Không thể xóa đầu sách vì vẫn còn bản sao hoặc giao dịch đang phụ thuộc.",
    BR_08_COPY_HAS_ACTIVE_LOAN:
      "Không thể xóa bản sao vì đang có phiếu mượn chưa hoàn tất.",
    BR_09_READER_HAS_UNRETURNED_LOAN:
      "Không thể xóa độc giả vì vẫn còn phiếu mượn chưa trả.",
    BR_11_LOAN_ALREADY_RETURNED: "Phiếu mượn này đã được ghi nhận trả trước đó.",
    SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  };

  if (error.code && messageByCode[error.code]) {
    return messageByCode[error.code];
  }

  const messageByText: Record<string, string> = {
    "Major not found": "Chuyên ngành không tồn tại hoặc đã bị xóa.",
    "Title not found": "Đầu sách không tồn tại hoặc đã bị xóa.",
    "Copy not found": "Bản sao sách không tồn tại hoặc đã bị xóa.",
    "Reader not found": "Độc giả không tồn tại.",
    "Loan not found": "Không tìm thấy phiếu mượn.",
    "Major code already exists": "Mã chuyên ngành đã tồn tại.",
    "Reader code already exists": "Mã độc giả đã tồn tại.",
    "Title code already exists": "Mã đầu sách đã tồn tại.",
    "Copy code already exists": "Mã bản sao đã tồn tại.",
    "Cannot delete major with active titles":
      "Không thể xóa chuyên ngành vì vẫn còn đầu sách đang tham chiếu.",
    "Failed to create loan": "Không thể lập phiếu mượn.",
    "Failed to return loan": "Không thể ghi nhận trả sách.",
  };

  return messageByText[error.message] ?? error.message;
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
  const basePath = sanitizeLibrarianRedirect(rawRedirectTo, fallbackPath);

  return updateHref(basePath, {
    notice: options.notice ?? null,
    error: options.error ?? null,
    ...(options.dropParams ?? []).reduce<Record<string, null>>((accumulator, key) => {
      accumulator[key] = null;
      return accumulator;
    }, {}),
  });
}

async function ensureLibrarian(): Promise<void> {
  const session = await requireSession();

  assertRole(session.sessionData.user.role, ["LIBRARIAN"]);
}

function buildReaderPayload(formData: FormData, withCode: boolean) {
  return {
    ...(withCode
      ? {
          ma_doc_gia: readRequiredText(formData, "ma_doc_gia", "Mã độc giả"),
        }
      : {}),
    ho_ten: readRequiredText(formData, "ho_ten", "Họ tên"),
    lop: readRequiredText(formData, "lop", "Lớp"),
    ngay_sinh: readRequiredText(formData, "ngay_sinh", "Ngày sinh"),
    gioi_tinh: readRequiredText(formData, "gioi_tinh", "Giới tính") as ReaderGender,
    trang_thai: readRequiredText(formData, "trang_thai", "Trạng thái") as ReaderStatus,
  };
}

function buildMajorPayload(formData: FormData, withCode: boolean) {
  return {
    ...(withCode
      ? {
          ma_chuyen_nganh: readRequiredText(formData, "ma_chuyen_nganh", "Mã chuyên ngành"),
        }
      : {}),
    ten_chuyen_nganh: readRequiredText(formData, "ten_chuyen_nganh", "Tên chuyên ngành"),
    mo_ta: readNullableText(formData, "mo_ta"),
  };
}

function buildTitlePayload(formData: FormData, withCode: boolean) {
  return {
    ...(withCode
      ? {
          ma_dau_sach: readRequiredText(formData, "ma_dau_sach", "Mã đầu sách"),
        }
      : {}),
    ten_dau_sach: readRequiredText(formData, "ten_dau_sach", "Tên đầu sách"),
    nha_xuat_ban: readRequiredText(formData, "nha_xuat_ban", "Nhà xuất bản"),
    so_trang: readPositiveInteger(formData, "so_trang", "Số trang"),
    kich_thuoc: readRequiredText(formData, "kich_thuoc", "Kích thước"),
    tac_gia: readRequiredText(formData, "tac_gia", "Tác giả"),
    ma_chuyen_nganh: readRequiredText(formData, "ma_chuyen_nganh", "Chuyên ngành"),
  };
}

function buildCopyPayload(formData: FormData, withCode: boolean) {
  return {
    ...(withCode
      ? {
          ma_sach: readRequiredText(formData, "ma_sach", "Mã bản sao"),
          ma_dau_sach: readRequiredText(formData, "ma_dau_sach", "Đầu sách"),
        }
      : {}),
    tinh_trang: readRequiredText(formData, "tinh_trang", "Tình trạng") as BookCopyStatus,
    ngay_nhap: readRequiredText(formData, "ngay_nhap", "Ngày nhập"),
  };
}

export async function createMajorAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {});

  try {
    await ensureLibrarian();
    await apiRequest(majorEndpoints.list, {
      method: "POST",
      body: JSON.stringify(buildMajorPayload(formData, true)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {
      notice: "Chuyên ngành mới đã được tạo.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function updateMajorAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {});

  try {
    await ensureLibrarian();
    await apiRequest(majorEndpoints.detail(code), {
      method: "PATCH",
      body: JSON.stringify(buildMajorPayload(formData, false)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {
      notice: `Chuyên ngành ${code} đã được cập nhật.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function deleteMajorAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {});

  try {
    await ensureLibrarian();
    await apiRequest(majorEndpoints.detail(code), {
      method: "DELETE",
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {
      notice: `Chuyên ngành ${code} đã được xóa khỏi danh mục hoạt động.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianMajors, {
      error: translateApiError(error),
    });
  }

  redirect(nextHref);
}

export async function createReaderAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {});

  try {
    await ensureLibrarian();
    await apiRequest(readerEndpoints.list, {
      method: "POST",
      body: JSON.stringify(buildReaderPayload(formData, true)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {
      notice: "Độc giả mới đã được tạo.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function updateReaderAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {});

  try {
    await ensureLibrarian();
    await apiRequest(readerEndpoints.detail(code), {
      method: "PATCH",
      body: JSON.stringify(buildReaderPayload(formData, false)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {
      notice: `Độc giả ${code} đã được cập nhật.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function deleteReaderAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {});

  try {
    await ensureLibrarian();
    await apiRequest(readerEndpoints.detail(code), {
      method: "DELETE",
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {
      notice: `Độc giả ${code} đã được xóa khỏi danh mục hoạt động.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianReaders, {
      error: translateApiError(error),
    });
  }

  redirect(nextHref);
}

export async function createTitleAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {});

  try {
    await ensureLibrarian();
    await apiRequest(titleEndpoints.list, {
      method: "POST",
      body: JSON.stringify(buildTitlePayload(formData, true)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {
      notice: "Đầu sách mới đã được tạo.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function updateTitleAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {});

  try {
    await ensureLibrarian();
    await apiRequest(titleEndpoints.detail(code), {
      method: "PATCH",
      body: JSON.stringify(buildTitlePayload(formData, false)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {
      notice: `Đầu sách ${code} đã được cập nhật.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function deleteTitleAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {});

  try {
    await ensureLibrarian();
    await apiRequest(titleEndpoints.detail(code), {
      method: "DELETE",
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {
      notice: `Đầu sách ${code} đã được xóa khỏi danh mục hoạt động.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianTitles, {
      error: translateApiError(error),
    });
  }

  redirect(nextHref);
}

export async function createCopyAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {});

  try {
    await ensureLibrarian();
    await apiRequest(copyEndpoints.list, {
      method: "POST",
      body: JSON.stringify(buildCopyPayload(formData, true)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {
      notice: "Bản sao mới đã được thêm vào kho.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function updateCopyAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {});

  try {
    await ensureLibrarian();
    await apiRequest(copyEndpoints.detail(code), {
      method: "PATCH",
      body: JSON.stringify(buildCopyPayload(formData, false)),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {
      notice: `Bản sao ${code} đã được cập nhật.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function deleteCopyAction(code: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {});

  try {
    await ensureLibrarian();
    await apiRequest(copyEndpoints.detail(code), {
      method: "DELETE",
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {
      notice: `Bản sao ${code} đã được xóa khỏi kho hoạt động.`,
      dropParams: ["edit"],
    });
  } catch (error: unknown) {
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianCopies, {
      error: translateApiError(error),
    });
  }

  redirect(nextHref);
}

export async function createLoanAction(formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianLoans, {});

  try {
    await ensureLibrarian();
    await apiRequest(loanEndpoints.list, {
      method: "POST",
      body: JSON.stringify({
        ma_doc_gia: readRequiredText(formData, "ma_doc_gia", "Mã độc giả"),
        ma_sach: readRequiredText(formData, "ma_sach", "Mã bản sao"),
        ngay_muon: readOptionalText(formData, "ngay_muon"),
        ghi_chu_tinh_trang: readOptionalText(formData, "ghi_chu_tinh_trang"),
      }),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianLoans, {
      notice: "Phiếu mượn đã được lập thành công.",
      dropParams: ["return_loan"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianLoans, {
      error: message,
    });
  }

  redirect(nextHref);
}

export async function returnLoanAction(loanId: string, formData: FormData): Promise<void> {
  const redirectTo = formData.get("redirect_to");
  let nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianLoans, {});

  try {
    await ensureLibrarian();
    await apiRequest(loanEndpoints.return(loanId), {
      method: "PATCH",
      body: JSON.stringify({
        ngay_tra: readOptionalText(formData, "ngay_tra"),
        tinh_trang_sau_tra: readRequiredText(
          formData,
          "tinh_trang_sau_tra",
          "Tình trạng sau trả"
        ) as BookCopyStatus,
        ghi_chu_tinh_trang: readOptionalText(formData, "ghi_chu_tinh_trang"),
      }),
    });
    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianLoans, {
      notice: `Đã ghi nhận trả sách cho phiếu #${loanId}.`,
      dropParams: ["return_loan"],
    });
  } catch (error: unknown) {
    const message =
      error instanceof LibrarianValidationError ? error.message : translateApiError(error);

    nextHref = buildFeedbackRedirectHref(redirectTo, APP_ROUTES.librarianLoans, {
      error: message,
    });
  }

  redirect(nextHref);
}
