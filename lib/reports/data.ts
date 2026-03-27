import { ApiError } from "@/lib/api/api-errors";
import { apiRequest } from "@/lib/api/api-client";
import { reportEndpoints } from "@/lib/api/endpoints";
import type {
  PaginatedResult,
  TopBorrowedFilters,
  TopBorrowedTitleRow,
  UnreturnedReaderFilters,
  UnreturnedReaderRow,
} from "@/lib/librarian/types";
import { buildHref } from "@/lib/librarian/utils";

export async function getTopBorrowedTitles(
  filters: TopBorrowedFilters
): Promise<PaginatedResult<TopBorrowedTitleRow>> {
  return apiRequest<PaginatedResult<TopBorrowedTitleRow>>(
    buildHref(reportEndpoints.topBorrowedTitles, {
      from: filters.from,
      to: filters.to,
      page: filters.page,
      limit: filters.limit,
    })
  );
}

export async function getUnreturnedReaders(
  filters: UnreturnedReaderFilters
): Promise<PaginatedResult<UnreturnedReaderRow>> {
  return apiRequest<PaginatedResult<UnreturnedReaderRow>>(
    buildHref(reportEndpoints.unreturnedReaders, {
      page: filters.page,
      limit: filters.limit,
    })
  );
}

export function getReportsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu báo cáo từ API.";
}
