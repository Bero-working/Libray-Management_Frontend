interface ReportPeriodFormProps {
  action: string;
  from: string;
  to: string;
  topLimit: number;
  openLimit: number;
  submitLabel?: string;
}

const inputClass = "ui-input w-full px-4 py-3 text-sm";

export function ReportPeriodForm({
  action,
  from,
  to,
  topLimit,
  openLimit,
  submitLabel = "Cập nhật kỳ báo cáo",
}: ReportPeriodFormProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <form action={action} className="grid gap-4 md:grid-cols-[1fr,1fr,auto]">
        <input type="hidden" name="top_limit" value={String(topLimit)} />
        <input type="hidden" name="open_limit" value={String(openLimit)} />
        <input className={inputClass} type="date" name="from" defaultValue={from} />
        <input className={inputClass} type="date" name="to" defaultValue={to} />
        <button type="submit" className="ui-button-primary px-4 py-3 text-sm font-semibold">
          {submitLabel}
        </button>
      </form>
    </section>
  );
}
