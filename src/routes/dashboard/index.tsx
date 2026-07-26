import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { CloudSun, CalendarDays, ScanLine, Store, Sprout, AlertTriangle } from "lucide-react";
import PRICE_TREND from "@/data/market-prices.json";
import { CITIES, fetchWeather } from "@/lib/weather-api";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

const GLASS_CARD =
  "rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_10px_20px_-5px_rgba(0,0,0,0.4)]";

function StatCard({
  icon: Icon,
  label,
  labelBn,
  value,
  subtext,
  subtextBn,
  change,
  color,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  labelBn: string;
  value: string;
  subtext?: string;
  subtextBn?: string;
  change?: string;
  color: string;
  iconBg: string;
}) {
  const { t } = useLang();
  const isAlert = change === "New";
  return (
    <div className={`${GLASS_CARD} p-5 hover:border-white/15 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {isAlert ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("New", "নতুন")}
          </span>
        ) : change ? (
          <span
            className={`text-xs font-medium ${change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
          >
            {change}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold font-display">{value}</div>
        <div className="text-sm text-[#8B9B90] mt-0.5">{t(label, labelBn)}</div>
        {subtext && (
          <div className="text-xs text-[#8B9B90]/70 mt-1">{t(subtext, subtextBn ?? subtext)}</div>
        )}
      </div>
    </div>
  );
}

function DashboardHome() {
  const { t } = useLang();
  const { user } = useAuth();

  const { data: weather } = useQuery({
    queryKey: ["weather", CITIES[0].name],
    queryFn: () => fetchWeather(CITIES[0]),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const temp = weather?.current.temp ?? 27;
  const condition = weather?.current.condition ?? "Partly Cloudy";
  const humidity = weather?.current.humidity ?? 78;

  const quickActions = [
    {
      to: "/dashboard/weather",
      icon: CloudSun,
      label: "Check Weather",
      labelBn: "আবহাওয়া দেখুন",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/15",
      hoverBorder: "hover:border-blue-500/40",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(59,130,246,0.12)]",
    },
    {
      to: "/dashboard/disease",
      icon: ScanLine,
      label: "Scan Crop",
      labelBn: "ফসল পরীক্ষা",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/15",
      hoverBorder: "hover:border-amber-500/40",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.12)]",
    },
    {
      to: "/dashboard/crop-calendar",
      icon: CalendarDays,
      label: "Crop Calendar",
      labelBn: "ফসল তালিকা",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15",
      hoverBorder: "hover:border-emerald-500/40",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(34,197,94,0.12)]",
    },
    {
      to: "/dashboard/marketplace",
      icon: Store,
      label: "Market Prices",
      labelBn: "বাজার দাম",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15",
      hoverBorder: "hover:border-purple-500/40",
      hoverShadow: "hover:shadow-[0_0_15px_rgba(168,85,247,0.12)]",
    },
  ];

  const seasonalTips = [
    {
      title: "Monsoon Planting",
      titleBn: "বর্ষায় রোপণ",
      tip: "Best time for Aman rice transplanting. Prepare seedbeds now.",
      tipBn: "আমন ধান রোপণের সেরা সময়। এখনই চারাবাটি প্রস্তুত করুন।",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.04]",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      icon: Sprout,
    },
    {
      title: "Pest Alert",
      titleBn: "পোকা সতর্কতা",
      tip: "Brown planthopper risk high. Monitor fields weekly.",
      tipBn: "বাদামী পাতামোড়ার ঝুঁকি বেশি। সাপ্তাহিক ক্ষেত পরিদর্শন করুন।",
      border: "border-amber-500/30",
      bg: "bg-amber-500/[0.06]",
      iconBg: "bg-amber-500/15",
      iconColor: "text-amber-400",
      icon: AlertTriangle,
    },
    {
      title: "Soil Health",
      titleBn: "মাটির স্বাস্থ্য",
      tip: "Apply lime if pH below 5.5. Test before next planting.",
      tipBn: "pH ৫.৫-এর কম হলে চুন প্রয়োগ করুন। পরবর্তী রোপণের আগে পরীক্ষা করুন।",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/[0.04]",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-400",
      icon: Sprout,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">
          {t(
            `Good morning, ${user?.name?.split(" ")[0] ?? "Farmer"}`,
            `সুপ্রভাত, ${user?.name?.split(" ")[0] ?? "কৃষক"}`,
          )}
        </h1>
        <p className="text-[#8B9B90] mt-1">
          {t(
            "Here's what's happening on your farm today.",
            "আজ আপনার খামারে কী হচ্ছে তার সারসংক্ষেপ।",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CloudSun}
          label="Weather"
          labelBn="আবহাওয়া"
          value={`${temp}°C`}
          subtext={`${condition} • ${t("Humidity", "আর্দ্রতা")} ${humidity}%`}
          color="text-blue-400"
          iconBg="bg-blue-500/15"
        />
        <StatCard
          icon={Sprout}
          label="Active Crops"
          labelBn="সক্রিয় ফসল"
          value="3"
          subtext="Aman Rice, Potato, Wheat"
          color="text-emerald-400"
          iconBg="bg-emerald-500/15"
        />
        <StatCard
          icon={AlertTriangle}
          label="Disease Alerts"
          labelBn="রোগ সতর্কতা"
          value="1"
          change="New"
          color="text-amber-400"
          iconBg="bg-amber-500/15"
        />
        <StatCard
          icon={Store}
          label="Market Listings"
          labelBn="বাজার তালিকা"
          value="8"
          subtext="+2 added today"
          subtextBn="+২ আজ যোগ হয়েছে"
          color="text-purple-400"
          iconBg="bg-purple-500/15"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${GLASS_CARD} p-5`}>
          <h2 className="font-semibold font-display mb-4 text-white">
            {t("Quick Actions", "দ্রুত কাজ")}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(
              ({ to, icon: Icon, label, labelBn, iconColor, iconBg, hoverBorder, hoverShadow }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl border border-white/10 bg-[#132219]/60 p-3.5 text-white transition-all duration-200 ${hoverBorder} ${hoverShadow} hover:bg-[#132219]/80`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg} shrink-0`}
                  >
                    <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
                  </div>
                  <span className="text-sm font-medium">{t(label, labelBn)}</span>
                </Link>
              ),
            )}
          </div>
        </div>

        <div className={`${GLASS_CARD} p-5`}>
          <h2 className="font-semibold font-display mb-4 text-white">
            {t("Market Overview", "বাজার পরিসংখ্যান")}
          </h2>
          <div className="space-y-3">
            {(() => {
              const priceItems = (PRICE_TREND as any[]).reduce(
                (acc: Record<string, any>, item: any) => {
                  const key = item.crop;
                  if (!acc[key] || item.date > acc[key].date) acc[key] = item;
                  return acc;
                },
                {},
              );
              return Object.values(priceItems)
                .slice(0, 5)
                .map((item: any) => {
                  const isUp = item.change > 0;
                  return (
                    <div
                      key={item.crop}
                      className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <span className="text-sm text-white/90">{t(item.crop, item.cropBn)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">৳{item.price}/kg</span>
                        <span
                          className={`text-xs font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {isUp ? "+" : ""}
                          {item.change}%
                        </span>
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
          <Link
            to="/dashboard/marketplace"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {t("View all", "সব দেখুন")} →
          </Link>
        </div>
      </div>

      <div className={`${GLASS_CARD} p-5`}>
        <h2 className="font-semibold font-display mb-4 text-white">
          {t("Seasonal Tips", "মৌসুমি টিপস")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {seasonalTips.map(
            ({ title, titleBn, tip, tipBn, border, bg, iconBg, iconColor, icon: TipIcon }) => (
              <div
                key={title}
                className={`rounded-xl border ${border} ${bg} p-4 transition-all duration-200 hover:border-opacity-50`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
                    <TipIcon className={`h-3.5 w-3.5 ${iconColor}`} />
                  </div>
                  <div className="font-medium text-sm text-white">{t(title, titleBn)}</div>
                </div>
                <p className="text-sm text-[#8B9B90] leading-relaxed">{t(tip, tipBn)}</p>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
