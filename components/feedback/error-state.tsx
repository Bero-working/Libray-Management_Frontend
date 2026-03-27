interface ErrorStateProps {
  title: string;
  description: string;
}

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-red-100 bg-white px-6 py-10 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600">
        !
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
