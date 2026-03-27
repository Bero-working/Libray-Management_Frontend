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
      className={`block w-full rounded-[1.5rem] border px-4 py-3.5 transition ${
        isActive
          ? "ui-nav-link-active"
          : "ui-nav-link border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="space-y-1.5">
        <p
          className={`text-sm font-semibold leading-5 ${
            isActive ? "text-white" : "text-slate-900"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-xs leading-5 ${
            isActive ? "text-slate-200" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
