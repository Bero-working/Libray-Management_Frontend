import { EmptyState } from "@/components/feedback/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { assertRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/auth.session";

export default async function AdminPage() {
  const session = await requireSession();
  const user = session.sessionData.user;

  assertRole(user.role, ["ADMIN"]);

  return (
    <AppShell
      role={user.role}
      user={user}
      title="Admin Dashboard"
      description="Điểm vào cho quản trị viên. Phase 0 xác nhận điều hướng theo role, session cookie, và shell dùng chung đã sẵn sàng."
    >
      <EmptyState
        title="Phase 0 đã sẵn sàng cho Admin"
        description="Các module staff, accounts, readers, và majors sẽ được gắn vào shell này ở phase tiếp theo."
      />
    </AppShell>
  );
}
