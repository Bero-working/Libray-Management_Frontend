interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  accent?: "slate" | "blue" | "teal" | "amber" | "rose";
}

const accentClasses: Record<NonNullable<StatCardProps["accent"]>, string> = {
  slate: "from-slate-900 to-slate-700 text-white",
  blue: "from-[#002045] to-[#1a365d] text-white",
  teal: "from-[#13696a] to-[#2b8f90] text-white",
  amber: "from-[#7c4a03] to-[#b45309] text-white",
  rose: "from-[#9f1239] to-[#e11d48] text-white",
};

export function StatCard({
  label,
  value,
  hint,
  accent = "slate",
}: StatCardProps) {
  return (
    <article
      className={`rounded-[1.75rem] bg-linear-to-br p-5 shadow-lg shadow-slate-900/5 ${accentClasses[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-white/75">{hint}</p>
    </article>
  );
}
