import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/auth.session";
import { assertRole } from "@/lib/auth/rbac";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireSession();
  const user = session.sessionData.user;

  assertRole(user.role, ["ADMIN"]);

  return (
    <AppShell
      role={user.role}
      user={user}
      eyebrow="Phase 2 admin"
      title="Scholaris Admin"
      description="Không gian quản trị nhân sự nội bộ, tạo account, gán role, reset password và theo dõi trạng thái truy cập."
    >
      {children}
    </AppShell>
  );
}
