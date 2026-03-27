"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
  description: string;
}

export function NavLink({ href, label, description }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className={`text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>
          {description}
        </p>
      </div>
    </Link>
  );
}
