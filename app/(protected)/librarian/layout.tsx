import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { assertRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/auth.session";

interface LibrarianLayoutProps {
  children: ReactNode;
}

export default async function LibrarianLayout({ children }: LibrarianLayoutProps) {
  const session = await requireSession();
  const user = session.sessionData.user;

  assertRole(user.role, ["LIBRARIAN"]);

  return (
    <AppShell
      role={user.role}
      user={user}
      eyebrow="Phase 1 librarian"
      title="Scholaris Librarian"
      description="Không gian vận hành chính cho quản lý đầu sách, bản sao, tra cứu, mượn trả và báo cáo nghiệp vụ."
    >
      {children}
    </AppShell>
  );
}
