import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { WEATHER_DATA, type WeatherDay } from "@/data/weather";
import { CITIES, fetchWeather } from "@/lib/weather-api";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSun,
  Droplets,
  Wind,
  MapPin,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/dashboard/weather")({
  component: WeatherPage,
});

const CONDITION_ICON: Record<WeatherDay["condition"], React.ElementType> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  partly_cloudy: CloudSun,
};

const CONDITION_COLOR: Record<WeatherDay["condition"], string> = {
  sunny: "text-amber-500",
  cloudy: "text-slate-400",
  rainy: "text-blue-500",
  stormy: "text-purple-500",
  partly_cloudy: "text-sky-400",
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center animate-pulse">
      <div className="h-3 bg-muted rounded w-8 mx-auto" />
      <div className="h-8 w-8 bg-muted rounded-full mx-auto my-2" />
      <div className="h-4 bg-muted rounded w-10 mx-auto" />
      <div className="h-3 bg-muted rounded w-8 mx-auto mt-1" />
    </div>
  );
}

function SkeletonAdvisory() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card animate-pulse space-y-3">
      <div className="h-5 bg-muted rounded w-48" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 py-3">
          <div className="h-5 w-5 bg-muted rounded shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function WeatherPage() {
  const { t } = useLang();
  const [selected, setSelected] = useState(0);
  const city = CITIES[selected];

  const { data, isLoading, error } = useQuery({
    queryKey: ["weather", city.name],
    queryFn: () => fetchWeather(city),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  // Fallback to mock data when API fails
  const location = data ?? WEATHER_DATA[selected];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-display">
          {t("Weather Forecast", "আবহাওয়ার পূর্বাভাস")}
        </h1>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setSelected(i)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(c.name, c.nameBn)}
            </button>
          ))}
        </div>
      </div>

      {error && !data && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {t("Could not load live weather data", "লাইভ আবহাওয়ার তথ্য লোড করা যায়নি")}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {t("Showing cached data instead", "পরিবর্তে ক্যাশেড তথ্য দেখাচ্ছে")}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-4" />
            <div className="flex items-center gap-6">
              <div className="h-12 bg-muted rounded w-24" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-32" />
                <div className="h-3 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonAdvisory />
        </>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{t(location.name, location.nameBn)}</span>
              {data && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {t("Live", "লাইভ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-4xl sm:text-5xl font-bold font-display">
                {location.current.temp}°C
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>
                  {t("Feels like", "অনুভূত হচ্ছে")}: {location.current.feelsLike}°C
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="h-3.5 w-3.5" /> {location.current.humidity}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {location.forecast.map((day, i) => {
              const Icon = CONDITION_ICON[day.condition];
              return (
                <button
                  key={day.day + day.date}
                  className={`rounded-xl border p-4 text-center transition-all ${
                    i === 0
                      ? "border-primary bg-primary/5 shadow-glow"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">{day.day}</div>
                  <Icon className={`h-8 w-8 mx-auto my-2 ${CONDITION_COLOR[day.condition]}`} />
                  <div className="font-semibold">{day.high}°</div>
                  <div className="text-xs text-muted-foreground">{day.low}°</div>
                  <div className="flex items-center justify-center gap-0.5 mt-2 text-xs text-blue-500">
                    <Droplets className="h-3 w-3" /> {day.rainChance}%
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold font-display mb-3">
              {t("Farming Advisory", "কৃষি পরামর্শ")}
            </h2>
            {location.forecast.map((day) => {
              const Icon = CONDITION_ICON[day.condition];
              return (
                <div
                  key={day.day + day.date}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                >
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${CONDITION_COLOR[day.condition]}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {day.day}, {day.date} — {day.high}°C
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t(day.advice, day.adviceBn)}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    <Wind className="h-3.5 w-3.5" /> {day.wind} km/h
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
