import type { AccountRole } from "@/lib/auth/auth.types";
import { LogoutButton } from "@/components/auth/logout-button";
import { NavLink } from "@/components/layout/nav-link";
import { navigationItems } from "@/lib/config/navigation";

interface AppSidebarProps {
  role: AccountRole;
}

export function AppSidebar({ role }: AppSidebarProps) {
  const allowedItems = navigationItems.filter((item) =>
    item.allowedRoles.includes(role)
  );

  return (
    <aside className="flex min-h-screen w-full max-w-sm flex-col justify-between border-r border-slate-200 bg-slate-50/90 p-6 lg:w-80">
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Scholaris Library
          </p>
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">Control Center</h1>
            <p className="text-sm text-slate-500">Shared navigation for authenticated roles.</p>
          </div>
        </div>
        <nav className="space-y-3">
          {allowedItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              description={item.description}
            />
          ))}
        </nav>
      </div>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Active role
          </p>
          <p className="mt-2 text-base font-semibold text-slate-900">{role}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
