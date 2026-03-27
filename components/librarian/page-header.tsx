import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-[#002045] via-[#13696a] to-[#adc7f7]" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Librarian Core Operations
          </p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
