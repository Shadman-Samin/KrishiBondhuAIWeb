import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { CROPS, SEASONS, type Crop } from "@/data/crops";
import { Droplets, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/dashboard/crop-calendar")({
  component: CropCalendarPage,
});

function CropCalendarPage() {
  const { t } = useLang();
  const [season, setSeason] = useState<string | null>(null);

  const filtered = season ? CROPS.filter((c) => c.season === season) : CROPS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">{t("Crop Calendar", "ফসল তালিকা")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("Plan your planting and harvest schedule", "রোপণ ও ফসল কাটার সময়সূচি পরিকল্পনা করুন")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSeason(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            season === null
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("All", "সব")}
        </button>
        {SEASONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSeason(s.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              season === s.key
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(s.label, s.labelBn)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((crop: Crop) => (
          <div
            key={crop.name}
            className="rounded-2xl border border-white/10 bg-[#121E16]/40 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] p-5 hover:shadow-elevated transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold font-display">{t(crop.name, crop.nameBn)}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                  {t(
                    crop.season,
                    crop.season === "kharif" ? "খরিফ" : crop.season === "rabi" ? "রবি" : "জায়াদ",
                  )}
                </span>
              </div>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  crop.waterNeed === "high"
                    ? "bg-blue-50 text-blue-600"
                    : crop.waterNeed === "medium"
                      ? "bg-sky-50 text-sky-600"
                      : "bg-slate-50 text-slate-500"
                }`}
              >
                <Droplets className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {t("Plant", "রোপণ")}: {crop.plantMonth} → {t("Harvest", "ফসল")}:{" "}
                  {crop.harvestMonth}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{t(crop.soilType, crop.soilTypeBn)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{crop.duration}</div>
            </div>

            <div className="mt-3 rounded-lg bg-accent/50 p-3">
              <p className="text-xs text-muted-foreground">{t(crop.tips, crop.tipsBn)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
