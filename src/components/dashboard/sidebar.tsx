import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CloudSun,
  CalendarDays,
  ScanLine,
  FlaskConical,
  Store,
  Settings,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/dashboard/weather", label: "Weather", labelBn: "আবহাওয়া", icon: CloudSun },
  {
    to: "/dashboard/crop-calendar",
    label: "Crop Calendar",
    labelBn: "ফসল তালিকা",
    icon: CalendarDays,
  },
  { to: "/dashboard/disease", label: "Disease Detection", labelBn: "রোগ নির্ণয়", icon: ScanLine },
  { to: "/dashboard/soil", label: "Soil Analysis", labelBn: "মাটি বিশ্লেষণ", icon: FlaskConical },
  { to: "/dashboard/marketplace", label: "Marketplace", labelBn: "বাজার", icon: Store },
] as const;

const BOTTOM_ITEMS = [
  { to: "/dashboard/settings", label: "Settings", labelBn: "সেটিংস", icon: Settings },
] as const;

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { t } = useLang();
  const { user } = useAuth();
  const matchRoute = useMatchRoute();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen border-r border-border bg-card/80 backdrop-blur-sm transition-all duration-300 sticky top-0",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border px-4 h-16",
          collapsed && "justify-center px-0",
        )}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold">
                {t("KrishiBondhu", "কৃষিবন্ধু")}
              </div>
              <div className="text-[10px] text-muted-foreground -mt-0.5">
                {t("AI Dashboard", "এআই ড্যাশবোর্ড")}
              </div>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, labelBn, icon: Icon }) => {
          const active = matchRoute({ to, fuzzy: to !== "/dashboard" });
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? t(label, labelBn) : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(label, labelBn)}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-2 space-y-1">
        {BOTTOM_ITEMS.map(({ to, label, labelBn, icon: Icon }) => {
          const active = matchRoute({ to });
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? t(label, labelBn) : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(label, labelBn)}</span>}
            </Link>
          );
        })}

        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
              {user
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "?"}
            </div>
            <div className="leading-tight truncate">
              <div className="font-medium text-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.district}</div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}

export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useLang();
  const matchRoute = useMatchRoute();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border transform transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          to="/"
          onClick={() => onOpenChange(false)}
          className="flex items-center gap-2 border-b border-border px-4 h-16"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold">
              {t("KrishiBondhu", "কৃষিবন্ধু")}
            </div>
            <div className="text-[10px] text-muted-foreground -mt-0.5">
              {t("AI Dashboard", "এআই ড্যাশবোর্ড")}
            </div>
          </div>
        </Link>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {[...NAV_ITEMS, ...BOTTOM_ITEMS].map(({ to, label, labelBn, icon: Icon }) => {
            const active = matchRoute({ to, fuzzy: to !== "/dashboard" });
            return (
              <Link
                key={to}
                to={to}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(label, labelBn)}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
