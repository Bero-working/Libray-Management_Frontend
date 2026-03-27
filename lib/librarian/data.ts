import { ApiError } from "@/lib/api/api-errors";
import { apiRequest } from "@/lib/api/api-client";
import {
  copyEndpoints,
  loanEndpoints,
  majorEndpoints,
  readerEndpoints,
  searchEndpoints,
  titleEndpoints,
} from "@/lib/api/endpoints";
import type {
  Copy,
  Loan,
  LoanFilters,
  Major,
  PaginatedResult,
  Reader,
  ReaderGender,
  SearchBookFilters,
  SearchBookResult,
  Title,
} from "@/lib/librarian/types";
import { buildHref } from "@/lib/librarian/utils";

interface BackendMajor {
  code: string;
  name: string;
  description?: string | null;
}

interface BackendReader {
  code: string;
  fullName: string;
  className: string;
  birthDate?: string | null;
  gender?: ReaderGender | null;
  status: Reader["status"];
}

function mapMajor(major: BackendMajor): Major {
  return {
    code: major.code,
    name: major.name,
    description: major.description,
  };
}

function mapReader(reader: BackendReader): Reader {
  return {
    code: reader.code,
    fullName: reader.fullName,
    className: reader.className,
    birthDate: reader.birthDate,
    gender: reader.gender,
    status: reader.status,
  };
}

export async function getMajors(): Promise<Major[]> {
  const majors = await apiRequest<BackendMajor[]>(majorEndpoints.list);

  return majors.map(mapMajor).toSorted((left, right) => left.name.localeCompare(right.name, "vi"));
}

export async function getMajorDetail(code: string): Promise<Major> {
  const major = await apiRequest<BackendMajor>(majorEndpoints.detail(code));

  return mapMajor(major);
}

export async function getReaders(): Promise<Reader[]> {
  const readers = await apiRequest<BackendReader[]>(readerEndpoints.list);

  return readers.map(mapReader).toSorted((left, right) => left.code.localeCompare(right.code, "vi"));
}

export async function getReaderDetail(code: string): Promise<Reader> {
  const reader = await apiRequest<BackendReader>(readerEndpoints.detail(code));

  return mapReader(reader);
}

export async function getTitles(): Promise<Title[]> {
  return apiRequest<Title[]>(titleEndpoints.list);
}

export async function getCopies(): Promise<Copy[]> {
  return apiRequest<Copy[]>(copyEndpoints.list);
}

export async function getLoans(filters: LoanFilters): Promise<PaginatedResult<Loan>> {
  return apiRequest<PaginatedResult<Loan>>(
    buildHref(loanEndpoints.list, {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      ma_doc_gia: filters.ma_doc_gia,
      ma_sach: filters.ma_sach,
      ngay_muon_from: filters.ngay_muon_from,
      ngay_muon_to: filters.ngay_muon_to,
    })
  );
}

export async function searchBooks(
  filters: SearchBookFilters
): Promise<PaginatedResult<SearchBookResult>> {
  return apiRequest<PaginatedResult<SearchBookResult>>(
    buildHref(searchEndpoints.books, {
      page: filters.page,
      limit: filters.limit,
      ma_dau_sach: filters.ma_dau_sach,
      ten_dau_sach: filters.ten_dau_sach,
      tac_gia: filters.tac_gia,
      ma_chuyen_nganh: filters.ma_chuyen_nganh,
      ma_sach: filters.ma_sach,
      tinh_trang: filters.tinh_trang,
    })
  );
}

export function getLibrarianErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Không thể tải dữ liệu nghiệp vụ từ API.";
}
