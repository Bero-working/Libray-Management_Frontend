import { redirect } from "next/navigation";

import { getDefaultRouteForRole, getSession } from "@/lib/auth/auth.session";
import { APP_ROUTES } from "@/lib/config/routes";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect(APP_ROUTES.login);
  }

  redirect(getDefaultRouteForRole(session.sessionData.user.role));
}
