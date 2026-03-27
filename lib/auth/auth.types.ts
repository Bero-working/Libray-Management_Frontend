export type AccountRole = "ADMIN" | "LIBRARIAN" | "LEADER";

export interface AuthUser {
  id: string;
  role: AccountRole;
  staffCode?: string;
  staffId?: string;
  username: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface SessionData {
  user: AuthUser;
  issuedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginFormState {
  message?: string;
  fieldErrors?: {
    username?: string;
    password?: string;
  };
}
