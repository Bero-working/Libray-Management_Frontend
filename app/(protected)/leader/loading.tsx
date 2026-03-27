import { LoadingState } from "@/components/feedback/loading-state";

export default function LeaderLoading() {
  return (
    <LoadingState
      title="Đang tải báo cáo lãnh đạo"
      description="Hệ thống đang tổng hợp dữ liệu top borrowed titles và unreturned readers."
    />
  );
}
