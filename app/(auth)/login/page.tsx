import Image from "next/image";
import { Inter, Manrope } from "next/font/google";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getDefaultRouteForRole, getSession } from "@/lib/auth/auth.session";

const headlineFont = Manrope({
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(getDefaultRouteForRole(session.sessionData.user.role));
  }

  return (
    <main
      className={`${bodyFont.className} relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fafc] px-4 py-10 sm:px-6`}
    >
      <div className="absolute inset-0">
        <Image
          alt="Library Interior"
          className="object-cover opacity-40 mix-blend-multiply"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeR0Kn98yH89yI0BjfoPrPkFjEPUHQDp5HzQPNStpkhgk5q6bkdYTxDLU0-Nho6bc2tKTL52jwJXrMdantlp8dtpMQNsPbMJGzZlEm_2-9-W3PJd0N1t7hz8AibLJTXLcbimvG_SXERN1WQ8RxbGwQWDGB19qfROp2t8TVe76rNBU32YoyKyoI2xwcHdfdMxIcYMrFXNY82KY6lDEcL-dYcMywiaaxR2CPsc7ssBTD4zAyb6LmNMhrLaaHZPy3AWVBfuvh7ReiP-UN"
          fill
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/18 via-slate-900/8 to-blue-900/18" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(26,54,93,0.18),transparent_42%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="mb-10 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a365d] shadow-xl shadow-slate-900/15">
            <svg
              aria-hidden="true"
              className="h-8 w-8 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3Zm-8 9.18V16l8 4 8-4v-3.82l-8 4.36-8-4.36Z" />
            </svg>
          </div>
          <h1
            className={`${headlineFont.className} text-3xl font-extrabold tracking-[-0.02em] text-[#002045]`}
          >
            Scholaris Library
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Hệ thống Quản lý Thư viện Học thuật
          </p>
        </div>

        <section className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/88 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-10">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#002045] via-[#1a365d] to-[#13696a]" />
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className={`${headlineFont.className} text-3xl font-bold text-[#002045]`}>
                Chào mừng trở lại
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Vui lòng đăng nhập vào tài khoản của bạn
              </p>
            </div>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
