export type SearchParamValue = string | string[] | undefined;

export type SearchParamRecord = Record<string, SearchParamValue>;

export function readFirstSearchParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === "string" ? value : undefined;
}

export function readTrimmedSearchParam(value: SearchParamValue): string | undefined {
  const resolved = readFirstSearchParam(value)?.trim();

  return resolved ? resolved : undefined;
}

export function readIntSearchParam(
  value: SearchParamValue,
  fallback: number,
  options: { min?: number; max?: number } = {}
): number {
  const raw = readFirstSearchParam(value);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const min = options.min ?? Number.MIN_SAFE_INTEGER;
  const max = options.max ?? Number.MAX_SAFE_INTEGER;

  return Math.min(Math.max(parsed, min), max);
}

export function buildHref(
  pathname: string,
  params: Record<string, string | number | null | undefined>
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function updateHref(
  href: string,
  params: Record<string, string | number | null | undefined>
): string {
  const [pathname, query = ""] = href.split("?");
  const searchParams = new URLSearchParams(query);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      searchParams.delete(key);
      continue;
    }

    searchParams.set(key, String(value));
  }

  const nextQuery = searchParams.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function sanitizeLibrarianRedirect(
  rawValue: FormDataEntryValue | string | null | undefined,
  fallbackPath: string
): string {
  const value =
    typeof rawValue === "string"
      ? rawValue.trim()
      : rawValue instanceof File
        ? ""
        : "";

  if (!value) {
    return fallbackPath;
  }

  if (value.startsWith("//") || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    return fallbackPath;
  }

  if (!value.startsWith("/librarian")) {
    return fallbackPath;
  }

  return value;
}

export function getFeedbackFromSearchParams(
  params: SearchParamRecord
): { tone: "success" | "error"; message: string } | null {
  const notice = readTrimmedSearchParam(params.notice);

  if (notice) {
    return {
      tone: "success",
      message: notice,
    };
  }

  const error = readTrimmedSearchParam(params.error);

  if (error) {
    return {
      tone: "error",
      message: error,
    };
  }

  return null;
}
