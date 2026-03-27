"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/app/actions/auth";

const initialState = undefined;

function PersonIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 2.24-6 5v1h12v-1c0-2.76-2.67-5-6-5Z" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 5c-5 0-9.27 3.11-11 7 1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 4-4 4 4 0 0 1-4 4Zm0-6.4A2.4 2.4 0 1 0 14.4 12 2.4 2.4 0 0 0 12 9.6Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="m2.81 2.81 18.38 18.38-1.42 1.42-3.13-3.13A11.86 11.86 0 0 1 12 19c-5 0-9.27-3.11-11-7a12.9 12.9 0 0 1 4.3-5.1L1.39 4.23l1.42-1.42Zm5.36 5.36A3.96 3.96 0 0 0 8 9.3 4 4 0 0 0 12 16c.39 0 .77-.06 1.13-.17l-1.66-1.66A2.4 2.4 0 0 1 9.83 9.83l-1.66-1.66ZM12 5c5 0 9.27 3.11 11 7a12.4 12.4 0 0 1-3.76 4.67l-2.86-2.86A4 4 0 0 0 10.19 7.6L8.11 5.52A12.63 12.63 0 0 1 12 5Z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.17 4.17 11.75 5.59 16.33 10.17H4v2h12.33l-4.58 4.58 1.42 1.42L20.17 11l-7-6.83Z" />
    </svg>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const usernameErrorId = state?.fieldErrors?.username ? "username-error" : undefined;
  const passwordErrorId = state?.fieldErrors?.password ? "password-error" : undefined;

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500"
        >
          Tên đăng nhập
        </label>
        <div className="group relative border-b-2 border-slate-300 transition-colors focus-within:border-[#002045]">
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            aria-invalid={Boolean(state?.fieldErrors?.username)}
            aria-describedby={usernameErrorId}
            className="w-full bg-transparent py-3 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Nhập tên người dùng"
          />
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#002045]">
            <PersonIcon />
          </span>
        </div>
        {state?.fieldErrors?.username ? (
          <p id={usernameErrorId} className="text-sm text-red-600">
            {state.fieldErrors.username}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500"
        >
          Mật khẩu
        </label>
        <div className="group relative border-b-2 border-slate-300 transition-colors focus-within:border-[#002045]">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(state?.fieldErrors?.password)}
            aria-describedby={passwordErrorId}
            className="w-full bg-transparent py-3 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-[#002045] focus:outline-none"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={showPassword}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {state?.fieldErrors?.password ? (
          <p id={passwordErrorId} className="text-sm text-red-600">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state?.message ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#002045] to-[#1a365d] px-4 py-4 text-sm font-bold tracking-[0.2em] text-white uppercase shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
      >
        <span>{pending ? "Đang đăng nhập..." : "Đăng nhập"}</span>
        <ArrowRightIcon />
      </button>
    </form>
  );
}
