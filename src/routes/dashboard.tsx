import { createFileRoute } from "@tanstack/react-router";
import { LangProvider } from "@/lib/i18n";
import { DashboardLayout } from "@/components/dashboard/layout";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayoutWrapper,
});

function DashboardLayoutWrapper() {
  return (
    <LangProvider>
      <DashboardLayout />
    </LangProvider>
  );
}
