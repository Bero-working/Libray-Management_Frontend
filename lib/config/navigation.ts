import type { AccountRole } from "@/lib/auth/auth.types";
import { APP_ROUTES } from "@/lib/config/routes";

export interface NavigationItem {
  href: string;
  label: string;
  description: string;
  allowedRoles: readonly AccountRole[];
}

export const navigationItems: readonly NavigationItem[] = [
  {
    href: APP_ROUTES.admin,
    label: "Admin Dashboard",
    description: "Tổng quan nhân sự, role và truy cập",
    allowedRoles: ["ADMIN"],
  },
  {
    href: APP_ROUTES.adminStaff,
    label: "Staff",
    description: "CRUD nhân viên và theo dõi account linking",
    allowedRoles: ["ADMIN"],
  },
  {
    href: APP_ROUTES.adminAccounts,
    label: "Accounts",
    description: "Cấp tài khoản, role, status và reset password",
    allowedRoles: ["ADMIN"],
  },
  {
    href: APP_ROUTES.librarian,
    label: "Librarian Overview",
    description: "Bảng điều phối vận hành",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianReaders,
    label: "Readers",
    description: "Quản lý hồ sơ độc giả",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianMajors,
    label: "Majors",
    description: "Quản lý chuyên ngành và phụ thuộc đầu sách",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianTitles,
    label: "Book Titles",
    description: "Quản lý metadata đầu sách",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianCopies,
    label: "Book Copies",
    description: "Theo dõi bản sao vật lý",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianSearch,
    label: "Catalog Search",
    description: "Tra cứu theo mã, tác giả, trạng thái",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianLoans,
    label: "Borrow / Return",
    description: "Lập phiếu mượn và ghi nhận trả",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.librarianReports,
    label: "Reports",
    description: "Top borrowed và unreturned readers",
    allowedRoles: ["LIBRARIAN"],
  },
  {
    href: APP_ROUTES.leader,
    label: "Leader Dashboard",
    description: "Theo dõi báo cáo điều hành",
    allowedRoles: ["LEADER"],
  },
];
