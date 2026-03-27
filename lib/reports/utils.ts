import type { UnreturnedReaderRow } from "@/lib/librarian/types";
import {
  readIntSearchParam,
  readTrimmedSearchParam,
  type SearchParamRecord,
} from "@/lib/librarian/utils";

export const DEFAULT_REPORT_WINDOW_DAYS = 30;

export interface ReportSearchState {
  from: string;
  to: string;
  topPage: number;
  topLimit: number;
  openPage: number;
  openLimit: number;
}

interface ReportWindowValidationError {
  title: string;
  description: string;
}

function formatLocalDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate()
  ).padStart(2, "0")}`;
}

export function getDefaultReportWindow(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);

  from.setDate(from.getDate() - (days - 1));

  return {
    from: formatLocalDate(from),
    to: formatLocalDate(to),
  };
}

export function readReportSearchParams(
  searchParams: SearchParamRecord,
  defaultWindowDays = DEFAULT_REPORT_WINDOW_DAYS
): ReportSearchState {
  const defaults = getDefaultReportWindow(defaultWindowDays);

  return {
    from: readTrimmedSearchParam(searchParams.from) ?? defaults.from,
    to: readTrimmedSearchParam(searchParams.to) ?? defaults.to,
    topPage: readIntSearchParam(searchParams.top_page, 1, { min: 1, max: 1000 }),
    topLimit: readIntSearchParam(searchParams.top_limit, 10, { min: 1, max: 100 }),
    openPage: readIntSearchParam(searchParams.open_page, 1, { min: 1, max: 1000 }),
    openLimit: readIntSearchParam(searchParams.open_limit, 10, { min: 1, max: 100 }),
  };
}

export function validateReportWindow(
  from: string,
  to: string
): ReportWindowValidationError | null {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  const daysBetween = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return {
      title: "Khoảng ngày không hợp lệ",
      description:
        "Bộ lọc báo cáo cần ngày bắt đầu và ngày kết thúc đúng định dạng YYYY-MM-DD.",
    };
  }

  if (fromDate > toDate) {
    return {
      title: "Khoảng ngày bị đảo ngược",
      description:
        "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc để truy vấn top borrowed titles.",
    };
  }

  if (daysBetween > 366) {
    return {
      title: "Khoảng ngày vượt giới hạn runtime",
      description:
        "Backend hiện giới hạn báo cáo top borrowed trong tối đa 366 ngày cho mỗi lần truy vấn.",
    };
  }

  return null;
}

export function countOpenLoans(rows: UnreturnedReaderRow[]): number {
  return rows.reduce((total, reader) => total + reader.so_phieu_muon_dang_mo, 0);
}
