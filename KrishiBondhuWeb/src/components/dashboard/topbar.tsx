import {
  Menu,
  Search,
  Bell,
  LogOut,
  Languages,
  Sprout,
  AlertTriangle,
  CloudSun,
  Store,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { search, type SearchResult } from "@/lib/search";

type Notification = {
  id: number;
  icon: React.ElementType;
  title: string;
  titleBn: string;
  desc: string;
  descBn: string;
  time: string;
  timeBn: string;
  unread: boolean;
  color: string;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    icon: CloudSun,
    title: "Heavy rain expected tomorrow",
    titleBn: "আগামীকাল ভারী বৃষ্টি প্রত্যাশিত",
    desc: "Dhaka division — secure harvested crops.",
    descBn: "ঢাকা বিভাগ — ফসল কাটা ফসল সুরক্ষিত করুন।",
    time: "2h ago",
    timeBn: "২ ঘণ্টা আগে",
    unread: true,
    color: "text-blue-500",
  },
  {
    id: 2,
    icon: AlertTriangle,
    title: "Blast disease risk: High",
    titleBn: "ব্লাস্ট রোগের ঝুঁকি: উচ্চ",
    desc: "Rice crops in your area — monitor closely.",
    descBn: "আপনার এলাকার ধান — ঘনিষ্ঠভাবে পর্যবেক্ষণ করুন।",
    time: "5h ago",
    timeBn: "৫ ঘণ্টা আগে",
    unread: true,
    color: "text-red-500",
  },
  {
    id: 3,
    icon: Store,
    title: "Rice price up 2.1%",
    titleBn: "ধানের দাম ২.১% বেড়েছে",
    desc: "Current: ৳38/kg in Comilla market.",
    descBn: "বর্তমান: ৳৩৮/কেজি কুমিল্লা বাজারে।",
    time: "1d ago",
    timeBn: "১ দিন আগে",
    unread: false,
    color: "text-green-500",
  },
  {
    id: 4,
    icon: Sprout,
    title: "Crop calendar reminder",
    titleBn: "ফসল তালিকা রিমাইন্ডার",
    desc: "Time to prepare seedbed for Rabi season crops.",
    descBn: "রবি মৌসুমের ফসলের জন্য বীজ তৈরি করার সময়।",
    time: "2d ago",
    timeBn: "২ দিন আগে",
    unread: false,
    color: "text-primary",
  },
];

const CATEGORY_LABEL: Record<string, { en: string; bn: string }> = {
  crop: { en: "Crops", bn: "ফসল" },
  disease: { en: "Diseases", bn: "রোগ" },
  market: { en: "Marketplace", bn: "বাজার" },
};

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { lang, setLang, t } = useLang();
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    setResults(search(query));
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function selectResult(r: SearchResult) {
    setQuery("");
    setSearchOpen(false);
    navigate({ to: r.href });
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-3 bg-white/80 dark:bg-[#0B150F]/80 backdrop-blur-xl border-b border-black/10 dark:border-white/10 px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div ref={searchRef} className="flex-1 flex items-center gap-2 max-w-md relative">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder={t("Search crops, weather...", "ফসল, আবহাওয়া খুঁজুন...")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-0"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {searchOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#121E16]/90 backdrop-blur-xl shadow-lg py-2 max-h-80 overflow-y-auto z-50">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t(CATEGORY_LABEL[cat].en, CATEGORY_LABEL[cat].bn)}
                </div>
                {items.map((r, i) => (
                  <button
                    key={`${r.href}-${i}`}
                    onClick={() => selectResult(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        <button
          onClick={() => setLang(lang === "en" ? "bn" : "en")}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition"
          aria-label="Toggle language"
        >
          <Languages className="h-3.5 w-3.5" />
          {lang === "en" ? "বাং" : "EN"}
        </button>

        <button
          onClick={toggle}
          className="p-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-primary/40 hover:text-primary transition"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) markAllRead();
            }}
            className="relative p-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-primary/40 hover:text-primary transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40 md:hidden" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#121E16]/90 backdrop-blur-xl shadow-lg overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
                  <span className="font-semibold text-sm">{t("Notifications", "নোটিফিকেশন")}</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-primary font-medium">{unreadCount} new</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${n.unread ? "bg-primary/5" : ""}`}
                      >
                        <div className={`mt-0.5 ${n.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {t(n.title, n.titleBn)}
                            </span>
                            {n.unread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t(n.desc, n.descBn)}
                          </p>
                          <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                            {t(n.time, n.timeBn)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:border-primary/30 transition"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                {user
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-xs font-medium pr-1">
              {user?.name.split(" ")[0]}
            </span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#121E16]/90 backdrop-blur-xl shadow-lg py-1">
                {user && (
                  <div className="px-3 py-2 border-b border-black/10 dark:border-white/10">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                )}
                <Link
                  to="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t("Settings", "সেটিংস")}
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  {t("Sign out", "সাইন আউট")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
