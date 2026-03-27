import { LoadingState } from "@/components/feedback/loading-state";

export default function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <LoadingState
          title="Đang chuẩn bị trang đăng nhập"
          description="Thiết lập giao diện và kiểm tra phiên làm việc hiện tại."
        />
      </div>
    </main>
  );
}
