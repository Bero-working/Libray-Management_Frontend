export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="max-w-lg rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          403
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Bạn không có quyền truy cập
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          Tài khoản hiện tại không được phép truy cập khu vực này. Hãy đăng nhập bằng vai trò phù hợp.
        </p>
      </div>
    </main>
  );
}
