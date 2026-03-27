interface FlashBannerProps {
  tone: "success" | "error";
  message: string;
}

export function FlashBanner({ tone, message }: FlashBannerProps) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${classes}`}>
      {message}
    </div>
  );
}
