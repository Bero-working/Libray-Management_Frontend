interface FlashBannerProps {
  tone: "success" | "error";
  message: string;
}

export function FlashBanner({ tone, message }: FlashBannerProps) {
  const classes =
    tone === "success"
      ? "ui-banner-success"
      : "ui-banner-error";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${classes}`}>
      {message}
    </div>
  );
}
