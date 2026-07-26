import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { MARKET_LISTINGS } from "@/data/marketplace";
import PRICE_TREND from "@/data/market-prices.json";
import { TrendingUp, TrendingDown, MapPin, Calendar, Tag, Database } from "lucide-react";

export const Route = createFileRoute("/dashboard/marketplace")({
  component: MarketplacePage,
});

function MarketplacePage() {
  const { t } = useLang();
  const [filter, setFilter] = useState<"all" | "sell" | "buy">("all");

  const listings =
    filter === "all" ? MARKET_LISTINGS : MARKET_LISTINGS.filter((l) => l.type === filter);

  // Aggregate real WFP prices: pick latest price per crop from Dhaka markets
  const priceData = PRICE_TREND.reduce(
    (
      acc: Record<
        string,
        { crop: string; cropBn: string; price: number; market: string; date: string }
      >,
      item: any,
    ) => {
      const key = item.crop;
      if (!acc[key] || item.date > acc[key].date) {
        acc[key] = item;
      }
      return acc;
    },
    {} as Record<string, any>,
  );
  const priceItems = Object.values(priceData) as {
    crop: string;
    cropBn: string;
    price: number;
    market: string;
    date: string;
  }[];
  const latestDate = priceItems.length > 0 ? priceItems[0].date : "May 2026";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Marketplace", "বাজার")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("Buy and sell agricultural products", "কৃষি পণ্য কিনুন ও বিক্রি করুন")}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold font-display">{t("Real-Time Prices", "তাজা দাম")}</h2>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            {t("WFP Bangladesh", "ডব্লিউএফপি বাংলাদেশ")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {t(`Data: ${latestDate}`, `তথ্য: ${latestDate}`)}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {priceItems.map((item) => (
          <div key={item.crop} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="text-sm font-medium">{t(item.crop, item.cropBn)}</div>
            <div className="text-xl font-bold font-display mt-1">৳{item.price}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {t("per kg", "প্রতি কেজি")} · {item.market?.split(" ")[0] ?? "Dhaka"}
            </div>
          </div>
        ))}
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
          <div className="col-span-full rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              {t("No listings match this filter.", "এই ফিল্টারে কোনো তালিকা নেই।")}
            </p>
          </div>
        )}
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-elevated transition-shadow"
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
