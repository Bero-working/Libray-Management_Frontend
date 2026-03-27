import { EmptyState } from "@/components/feedback/empty-state";
import { AppShell } from "@/components/layout/app-shell";
import { assertRole } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/auth.session";

export default async function LeaderPage() {
  const session = await requireSession();
  const user = session.sessionData.user;

  assertRole(user.role, ["LEADER"]);

  return (
    <AppShell
      role={user.role}
      user={user}
      title="Leader Dashboard"
      description="Điểm vào cho lãnh đạo. Phase 0 đảm bảo actor này có route riêng, shell riêng và RBAC đúng ngay từ đầu."
    >
      <EmptyState
        title="Phase 0 đã sẵn sàng cho Leader"
        description="Báo cáo top borrowed và unreturned readers sẽ được gắn vào đây khi phase reporting bắt đầu."
      />
    </AppShell>
  );
}
