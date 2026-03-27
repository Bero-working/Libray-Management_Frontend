import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/auth.session";
import { assertRole } from "@/lib/auth/rbac";

interface LeaderLayoutProps {
  children: ReactNode;
}

export default async function LeaderLayout({ children }: LeaderLayoutProps) {
  const session = await requireSession();
  const user = session.sessionData.user;

  assertRole(user.role, ["LEADER"]);

  return (
    <AppShell
      role={user.role}
      user={user}
      eyebrow="Phase 3 leader reporting"
      title="Scholaris Leader"
      description="Không gian báo cáo read-only cho vai trò lãnh đạo, tập trung vào dashboard điều hành và thống kê vận hành."
    >
      {children}
    </AppShell>
  );
}
