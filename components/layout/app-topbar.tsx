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
    <header className="flex flex-col gap-6 border-b border-slate-200 bg-white/80 px-6 py-6 backdrop-blur sm:flex-row sm:items-start sm:justify-between lg:px-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {eyebrow}
        </p>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Signed in
        </p>
        <p className="mt-2 text-base font-semibold text-slate-900">{user.username}</p>
        <p className="text-sm text-slate-500">{user.role}</p>
      </div>
    </header>
  );
}
