import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { LangProvider } from "@/lib/i18n";
import { DashboardLayout } from "@/components/dashboard/layout";
import { getSession } from "@/lib/auth-functions";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) throw redirect({ to: "/login" });
    return { session };
  },
  component: DashboardLayoutWrapper,
});

function DashboardLayoutWrapper() {
  return (
    <LangProvider>
      <DashboardLayout />
    </LangProvider>
  );
}
