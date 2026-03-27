export const authEndpoints = {
  login: "/auth/login",
  refresh: "/auth/refresh",
  logout: "/auth/logout",
} as const;

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

export const majorEndpoints = {
  list: "/majors",
  detail: (code: string) => `/majors/${encodeSegment(code)}`,
} as const;

export const readerEndpoints = {
  list: "/readers",
  detail: (code: string) => `/readers/${encodeSegment(code)}`,
  printCard: (code: string) => `/readers/${encodeSegment(code)}/print-card`,
} as const;

export const titleEndpoints = {
  list: "/titles",
  detail: (code: string) => `/titles/${encodeSegment(code)}`,
} as const;

export const copyEndpoints = {
  list: "/copies",
  detail: (code: string) => `/copies/${encodeSegment(code)}`,
} as const;

export const loanEndpoints = {
  list: "/loans",
  detail: (id: string) => `/loans/${encodeSegment(id)}`,
  return: (id: string) => `/loans/${encodeSegment(id)}/return`,
} as const;

export const searchEndpoints = {
  books: "/search/books",
} as const;

export const reportEndpoints = {
  topBorrowedTitles: "/reports/top-borrowed-titles",
  unreturnedReaders: "/reports/unreturned-readers",
} as const;
