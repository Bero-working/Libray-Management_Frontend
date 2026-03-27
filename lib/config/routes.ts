import type { AccountRole } from "@/lib/auth/auth.types";

export const APP_ROUTES = {
  home: "/",
  login: "/login",
  admin: "/admin",
  librarian: "/librarian",
  librarianTitles: "/librarian/titles",
  librarianCopies: "/librarian/copies",
  librarianSearch: "/librarian/search",
  librarianLoans: "/librarian/loans",
  librarianReports: "/librarian/reports",
  leader: "/leader",
  forbidden: "/forbidden",
} as const;

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
