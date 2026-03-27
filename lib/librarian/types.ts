export type BookCopyStatus =
  | "AVAILABLE"
  | "BORROWED"
  | "DAMAGED"
  | "LOST"
  | "NEEDS_REVIEW";

export type LoanStatus = "BORROWED" | "RETURNED" | "NEEDS_REVIEW";

export type ReaderStatus = "ACTIVE" | "LOCKED" | "INACTIVE";

export interface Major {
  code: string;
  name: string;
  description?: string | null;
}

export interface Title {
  ma_dau_sach: string;
  ten_dau_sach: string;
  nha_xuat_ban: string;
  so_trang: number | null;
  kich_thuoc: string | null;
  tac_gia: string;
  ma_chuyen_nganh: string;
  so_luong_sach: number;
}

export interface Copy {
  ma_sach: string;
  ma_dau_sach: string;
  tinh_trang: BookCopyStatus;
  ngay_nhap: string;
}

export interface Reader {
  code: string;
  fullName: string;
  className: string;
  birthDate?: string;
  gender?: string;
  status: ReaderStatus;
}

export interface Loan {
  id: string;
  ma_doc_gia: string;
  ma_sach: string;
  ma_thu_thu: string;
  ngay_muon: string;
  ngay_tra: string | null;
  tinh_trang: LoanStatus;
  ghi_chu_tinh_trang: string | null;
}

export interface SearchMatchedCopy {
  ma_sach: string;
  tinh_trang: BookCopyStatus;
}

export interface SearchBookResult {
  ma_dau_sach: string;
  ten_dau_sach: string;
  nha_xuat_ban: string;
  so_trang: number | null;
  kich_thuoc: string | null;
  tac_gia: string;
  ma_chuyen_nganh: string;
  ten_chuyen_nganh: string;
  so_luong_sach: number;
  ban_sao_phu_hop: SearchMatchedCopy[];
}

export interface TopBorrowedTitleRow {
  rank: number;
  ma_dau_sach: string;
  ten_dau_sach: string;
  tac_gia: string;
  ma_chuyen_nganh: string;
  ten_chuyen_nganh: string;
  so_luot_muon: number;
}

export interface UnreturnedLoanRow {
  loan_id: string;
  ma_sach: string;
  ma_dau_sach: string;
  ten_dau_sach: string;
  ngay_muon: string;
  tinh_trang: LoanStatus;
}

export interface UnreturnedReaderRow {
  ma_doc_gia: string;
  ho_ten: string;
  lop: string;
  trang_thai: ReaderStatus;
  so_phieu_muon_dang_mo: number;
  phieu_muon_dang_mo: UnreturnedLoanRow[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  from?: string;
  to?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface LoanFilters {
  page?: number;
  limit?: number;
  status?: LoanStatus;
  ma_doc_gia?: string;
  ma_sach?: string;
  ngay_muon_from?: string;
  ngay_muon_to?: string;
}

export interface SearchBookFilters {
  page?: number;
  limit?: number;
  ma_dau_sach?: string;
  ten_dau_sach?: string;
  tac_gia?: string;
  ma_chuyen_nganh?: string;
  ma_sach?: string;
  tinh_trang?: BookCopyStatus;
}

export interface TopBorrowedFilters {
  from: string;
  to: string;
  page?: number;
  limit?: number;
}

export interface UnreturnedReaderFilters {
  page?: number;
  limit?: number;
}
