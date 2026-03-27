import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow = "Librarian Core Operations",
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-sm sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#002045] via-[#13696a] to-[#adc7f7]" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.15rem]">
              {title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {actions ? (
          <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
