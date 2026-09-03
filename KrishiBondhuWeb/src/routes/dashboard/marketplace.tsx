import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { fetchMarketPrices, fetchPriceHistory, type MarketPrice } from "@/lib/model-api";
import { MARKET_LISTINGS } from "@/data/marketplace";
import PRICE_TREND from "@/data/market-prices.json";
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Tag,
  Search,
  LineChart as LineChartIcon,
  Database,
  Loader2,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/dashboard/marketplace")({
  component: MarketplacePage,
});

type StaticPrice = {
  crop: string;
  cropBn: string;
  price: number;
  market: string;
  marketBn: string;
  date: string;
  unit: string;
};

function fallbackRows(): { rows: MarketPrice[]; updatedAt: string } {
  const acc: Record<string, StaticPrice> = {};
  for (const item of PRICE_TREND as StaticPrice[]) {
    if (!acc[item.crop] || item.date > acc[item.crop].date) acc[item.crop] = item;
  }
  const list = Object.values(acc)
    .map((s) => ({ crop: s.crop, cropBn: s.cropBn, price: s.price, date: s.date, unit: s.unit }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return { rows: list, updatedAt: list[0]?.date ?? "" };
}

function MarketplacePage() {
  const { t } = useLang();
  const [filter, setFilter] = useState<"all" | "sell" | "buy">("all");
  const [rows, setRows] = useState<MarketPrice[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [points, setPoints] = useState<{ date: string; price: number }[] | null>(null);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchMarketPrices();
        if (!alive) return;
        setRows(data.rows);
        setUpdatedAt(data.updated_at);
        setLive(true);
      } catch {
        if (!alive) return;
        const fb = fallbackRows();
        setRows(fb.rows);
        setUpdatedAt(fb.updatedAt);
        setLive(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!selected) {
      setPoints(null);
      return;
    }
    let alive = true;
    setHistLoading(true);
    (async () => {
      try {
        const data = await fetchPriceHistory(selected);
        if (alive) setPoints(data.points);
      } catch {
        if (alive) setPoints(null);
      } finally {
        if (alive) setHistLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected]);

  const listings =
    filter === "all" ? MARKET_LISTINGS : MARKET_LISTINGS.filter((l) => l.type === filter);

  const q = search.trim().toLowerCase();
  const visibleRows = q
    ? rows.filter((r) => r.crop.toLowerCase().includes(q) || r.cropBn.includes(q))
    : rows;

  const fmtDate = (d: string) => `${d.slice(8, 10)}-${d.slice(5, 7)}`;

  const chartConfig = {
    price: {
      label: t("Price", "দাম"),
      color: "var(--primary)",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Marketplace", "বাজার")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("Buy and sell agricultural products", "কৃষি পণ্য কিনুন ও বিক্রি করুন")}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold font-display">{t("Market Prices", "বাজারদর")}</h2>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                live ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
              }`}
            >
              {live ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t("LIVE", "লাইভ")}
                </>
              ) : (
                t("Offline snapshot", "অফলাইন স্ন্যাপশট")
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Database className="h-3 w-3" />
              {live
                ? t("DAM · Government of Bangladesh", "কৃষি বিপণন অধিদপ্তর · বাংলাদেশ সরকার")
                : t("Static data", "স্থির তথ্য")}
            </span>
            {updatedAt && <span>{t(`Updated: ${updatedAt}`, `আপডেট: ${updatedAt}`)}</span>}
          </div>
        </div>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search crops…", "ফসল খুঁজুন…")}
            className="w-full rounded-lg border border-white/10 bg-background/40 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Fetching live prices…", "লাইভ দাম আনা হচ্ছে…")}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {t("No price data available right now.", "এই মুহূর্তে দামের তথ্য নেই।")}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleRows.map((r) => {
              const down = (r.change_pct ?? 0) < 0;
              const selectedCrop = selected === r.crop;
              return (
                <button
                  key={r.crop}
                  onClick={() => setSelected(selectedCrop ? null : r.crop)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    selectedCrop
                      ? "border-primary/60 bg-primary/10"
                      : "border-white/10 bg-background/30 hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-sm font-medium truncate">{t(r.crop, r.cropBn)}</div>
                    {typeof r.change_pct === "number" && r.change_pct !== 0 && (
                      <span
                        className={
                          down
                            ? "text-red-400 flex items-center gap-0.5 text-xs"
                            : "text-emerald-400 flex items-center gap-0.5 text-xs"
                        }
                      >
                        {down ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {Math.abs(r.change_pct)}%
                      </span>
                    )}
                  </div>
                  <div className="text-xl font-bold font-display mt-1">৳{r.price}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t("per kg", "প্রতি কেজি")}
                    {r.source === "dam" ? " · " + t("national", "জাতীয়") : ""}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="mt-4 rounded-xl border border-white/10 bg-background/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LineChartIcon className="h-4 w-4 text-primary" />
              <span>
                {t("Price history", "দামের ইতিহাস")}
                <span className="text-muted-foreground">
                  {" "}
                  · {t(selected, rows.find((r) => r.crop === selected)?.cropBn ?? selected)}
                </span>
              </span>
            </div>
            {histLoading ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("Loading history…", "ইতিহাস লোড হচ্ছে…")}
              </p>
            ) : points && points.length > 1 ? (
              <ChartContainer config={chartConfig} className="mt-2 h-[220px] w-full">
                <LineChart data={points} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.08)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={fmtDate}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    width={56}
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => v.toLocaleString("en-IN")}
                  />
                  <ChartTooltip labelFormatter={fmtDate} content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">
                {t(
                  "Not enough history yet — data builds daily.",
                  "পর্যাপ্ত ইতিহাস নেই — তথ্য প্রতিদিন জমছে।",
                )}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <h2 className="font-semibold font-display">{t("Listings", "তালিকা")}</h2>
        <div className="flex gap-1 bg-accent rounded-lg p-1">
          {(["all", "sell", "buy"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all"
                ? t("All", "সব")
                : f === "sell"
                  ? t("Selling", "বিক্রি")
                  : t("Buying", "ক্রয়")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listings.length === 0 && (
          <div className="col-span-full rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-8 text-center">
            <p className="text-muted-foreground">
              {t("No listings match this filter.", "এই ফিল্টারে কোনো তালিকা নেই।")}
            </p>
          </div>
        )}
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-5 hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{t(listing.title, listing.titleBn)}</h3>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    listing.type === "sell"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {listing.type === "sell"
                    ? t("For Sale", "বিক্রি")
                    : t("Want to Buy", "কিনতে চাই")}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-display">৳{listing.price}</div>
                <div className="text-xs text-muted-foreground">/{listing.unit}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> {listing.quantity}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {t(listing.location, listing.locationBn)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {listing.date}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm">{t(listing.seller, listing.sellerBn)}</span>
              <button
                onClick={() =>
                  alert(
                    t(
                      "Coming soon! Contact feature will be available in the next update.",
                      "শীঘ্রই আসছে! যোগাযোগ বৈশিষ্ট্য পরবর্তী আপডেটে উপলব্ধ হবে।",
                    ),
                  )
                }
                className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t("Contact", "যোগাযোগ")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
