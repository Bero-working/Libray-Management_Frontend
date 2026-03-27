export {
  buildHref,
  getFeedbackFromSearchParams,
  readFirstSearchParam,
  readIntSearchParam,
  readTrimmedSearchParam,
  updateHref,
} from "@/lib/librarian/utils";

export function sanitizeAdminRedirect(
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

  if (!value.startsWith("/admin")) {
    return fallbackPath;
  }

  return value;
}
