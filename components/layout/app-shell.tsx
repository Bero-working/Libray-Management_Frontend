import type { ReactNode } from "react";

import type { AccountRole, AuthUser } from "@/lib/auth/auth.types";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";

interface AppShellProps {
  role: AccountRole;
  eyebrow?: string;
  title: string;
  description: string;
  user: AuthUser;
  children: ReactNode;
}

export function AppShell({
  role,
  eyebrow,
  title,
  description,
  user,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="min-h-screen w-full lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar role={role} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <AppTopbar eyebrow={eyebrow} title={title} description={description} user={user} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
