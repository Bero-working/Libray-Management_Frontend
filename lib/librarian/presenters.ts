const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  BORROWED: "Đang mượn",
  DAMAGED: "Hư hỏng",
  LOST: "Thất lạc",
  NEEDS_REVIEW: "Cần kiểm tra",
  RETURNED: "Đã trả",
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khóa",
  INACTIVE: "Ngừng hoạt động",
};

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Chưa có";
  }

  return dateFormatter.format(new Date(value));
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
