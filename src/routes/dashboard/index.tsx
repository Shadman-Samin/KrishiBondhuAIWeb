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

function StatCard({
  icon: Icon,
  label,
  labelBn,
  value,
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  labelBn: string;
  value: string;
  change?: string;
  color: string;
}) {
  const { t } = useLang();
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <span
            className={`text-xs font-medium ${change.startsWith("+") || change === "New" ? "text-emerald-600" : "text-red-500"}`}
          >
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold font-display">{value}</div>
        <div className="text-sm text-muted-foreground mt-0.5">{t(label, labelBn)}</div>
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

  const temp = weather?.current.temp ?? 32;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">
          {t(
            `Good morning, ${user?.name?.split(" ")[0] ?? "Farmer"}`,
            `সুপ্রভাত, ${user?.name?.split(" ")[0] ?? "কৃষক"}`,
          )}
        </h1>
        <p className="text-muted-foreground mt-1">
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
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Sprout}
          label="Active Crops"
          labelBn="সক্রিয় ফসল"
          value="3"
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Disease Alerts"
          labelBn="রোগ সতর্কতা"
          value="1"
          change="New"
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Store}
          label="Market Listings"
          labelBn="বাজার তালিকা"
          value="8"
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold font-display mb-4">{t("Quick Actions", "দ্রুত কাজ")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                to: "/dashboard/weather",
                icon: CloudSun,
                label: "Check Weather",
                labelBn: "আবহাওয়া দেখুন",
                color: "bg-blue-50 hover:bg-blue-100 text-blue-700",
              },
              {
                to: "/dashboard/disease",
                icon: ScanLine,
                label: "Scan Crop",
                labelBn: "ফসল পরীক্ষা",
                color: "bg-amber-50 hover:bg-amber-100 text-amber-700",
              },
              {
                to: "/dashboard/crop-calendar",
                icon: CalendarDays,
                label: "Crop Calendar",
                labelBn: "ফসল তালিকা",
                color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700",
              },
              {
                to: "/dashboard/marketplace",
                icon: Store,
                label: "Market Prices",
                labelBn: "বাজার দাম",
                color: "bg-purple-50 hover:bg-purple-100 text-purple-700",
              },
            ].map(({ to, icon: Icon, label, labelBn, color }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${color}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{t(label, labelBn)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-semibold font-display mb-4">
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
                .map((item: any) => (
                  <div key={item.crop} className="flex items-center justify-between">
                    <span className="text-sm">{t(item.crop, item.cropBn)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">৳{item.price}/kg</span>
                      <span className="text-xs text-muted-foreground">
                        {item.market?.split(" ")[0] ?? ""}
                      </span>
                    </div>
                  </div>
                ));
            })()}
          </div>
          <Link
            to="/dashboard/marketplace"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t("View all", "সব দেখুন")} →
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-semibold font-display mb-4">{t("Seasonal Tips", "মৌসুমি টিপস")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Monsoon Planting",
              titleBn: "বর্ষায় রোপণ",
              tip: "Best time for Aman rice transplanting. Prepare seedbeds now.",
              tipBn: "আমন ধান রোপণের সেরা সময়। এখনই চারাবাটি প্রস্তুত করুন।",
            },
            {
              title: "Pest Alert",
              titleBn: "পোকা সতর্কতা",
              tip: "Brown planthopper risk high. Monitor fields weekly.",
              tipBn: "বাদামী পাতামোড়ার ঝুঁকি বেশি। সাপ্তাহিক ক্ষেত পরিদর্শন করুন।",
            },
            {
              title: "Soil Health",
              titleBn: "মাটির স্বাস্থ্য",
              tip: "Apply lime if pH below 5.5. Test before next planting.",
              tipBn: "pH ৫.৫-এর কম হলে চুন প্রয়োগ করুন। পরবর্তী রোপণের আগে পরীক্ষা করুন।",
            },
          ].map(({ title, titleBn, tip, tipBn }) => (
            <div key={title} className="rounded-lg bg-accent/50 p-4">
              <div className="font-medium text-sm">{t(title, titleBn)}</div>
              <p className="text-sm text-muted-foreground mt-1">{t(tip, tipBn)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
