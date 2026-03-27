import type { ReactNode } from "react";

import { requireSession } from "@/lib/auth/auth.session";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  await requireSession();

  return children;
}
