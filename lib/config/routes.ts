import type { AccountRole } from "@/lib/auth/auth.types";

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  admin: "/admin",
  adminStaff: "/admin/staff",
  adminAccounts: "/admin/accounts",
  librarian: "/librarian",
  librarianReaders: "/librarian/readers",
  librarianMajors: "/librarian/majors",
  librarianTitles: "/librarian/titles",
  librarianCopies: "/librarian/copies",
  librarianSearch: "/librarian/search",
  librarianLoans: "/librarian/loans",
  librarianReports: "/librarian/reports",
  leader: "/leader",
  leaderReports: "/leader/reports",
  forbidden: "/forbidden",
} as const;

function encodeRouteSegment(value: string): string {
  return encodeURIComponent(value);
}

export function getLibrarianReaderDetailRoute(code: string): string {
  return `${APP_ROUTES.librarianReaders}/${encodeRouteSegment(code)}`;
}

export function getLibrarianReaderCardRoute(code: string): string {
  return `${getLibrarianReaderDetailRoute(code)}/card`;
}

export const ROLE_HOME_ROUTES: Record<AccountRole, string> = {
  ADMIN: APP_ROUTES.admin,
  LIBRARIAN: APP_ROUTES.librarian,
  LEADER: APP_ROUTES.leader,
};

export const PROTECTED_ROUTE_PREFIXES = [
  APP_ROUTES.admin,
  APP_ROUTES.librarian,
  APP_ROUTES.leader,
] as const;
