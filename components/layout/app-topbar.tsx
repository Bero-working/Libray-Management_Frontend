import type { AuthUser } from "@/lib/auth/auth.types";

interface AppTopbarProps {
  eyebrow?: string;
  title: string;
  description: string;
  user: AuthUser;
}

export function AppTopbar({
  eyebrow = "Scholaris Workspace",
  title,
  description,
  user,
}: AppTopbarProps) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 xl:px-10">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            {eyebrow}
          </p>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Signed in
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">{user.username}</p>
          <p className="text-sm text-slate-500">{user.role}</p>
        </div>
      </div>
    </header>
  );
}
