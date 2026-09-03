import type { WeatherDay, WeatherLocation } from "@/data/weather";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string;
const BASE = "https://api.openweathermap.org/data/2.5";

export const CITIES = [
  { name: "Dhaka", nameBn: "ঢাকা", lat: 23.8103, lon: 90.4125 },
  { name: "Chittagong", nameBn: "চট্টগ্রাম", lat: 22.3569, lon: 91.7832 },
  { name: "Rajshahi", nameBn: "রাজশাহী", lat: 24.3745, lon: 88.6042 },
] as const;

const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Comilla: { lat: 23.4607, lon: 91.1809 },
  Dhaka: { lat: 23.8103, lon: 90.4125 },
  Chittagong: { lat: 22.3569, lon: 91.7832 },
  Rajshahi: { lat: 24.3745, lon: 88.6042 },
  Khulna: { lat: 22.8456, lon: 89.5403 },
  Bogura: { lat: 24.8465, lon: 89.3772 },
  Sylhet: { lat: 24.8949, lon: 91.8687 },
  Mymensingh: { lat: 24.7539, lon: 90.4073 },
  Barishal: { lat: 22.701, lon: 90.3535 },
  Rangpur: { lat: 25.7439, lon: 89.2752 },
};

const DISTRICT_NAMES_BN: Record<string, string> = {
  Comilla: "কুমিল্লা",
  Dhaka: "ঢাকা",
  Chittagong: "চট্টগ্রাম",
  Rajshahi: "রাজশাহী",
  Khulna: "খুলনা",
  Bogura: "বগুড়া",
  Sylhet: "সিলেট",
  Mymensingh: "ময়মনসিংহ",
  Barishal: "বরিশাল",
  Rangpur: "রংপুর",
};

export const DISTRICTS = Object.keys(DISTRICT_COORDS).map((name) => ({
  name,
  nameBn: DISTRICT_NAMES_BN[name],
}));

type OWMForecastItem = {
  dt: number;
  main: { temp: number; feels_like: number; temp_min: number; temp_max: number; humidity: number };
  weather: { main: string; description: string; icon: string }[];
  wind: { speed: number; deg: number };
  pop: number;
  dt_txt: string;
};

type OWMResponse = {
  list: OWMForecastItem[];
  city: { name: string; country: string };
};

const CONDITION_MAP: Record<string, WeatherDay["condition"]> = {
  Clear: "sunny",
  Clouds: "cloudy",
  Rain: "rainy",
  Drizzle: "rainy",
  Thunderstorm: "stormy",
  Snow: "cloudy",
  Mist: "cloudy",
  Fog: "cloudy",
  Haze: "partly_cloudy",
  Smoke: "cloudy",
  Dust: "cloudy",
  Sand: "cloudy",
  Ash: "stormy",
  Squall: "stormy",
  Tornado: "stormy",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function mapCondition(owmMain: string): WeatherDay["condition"] {
  return CONDITION_MAP[owmMain] ?? "partly_cloudy";
}

function generateAdvice(
  temp: number,
  humidity: number,
  rainChance: number,
  condition: WeatherDay["condition"],
): { en: string; bn: string } {
  if (condition === "stormy") {
    return {
      en: "Thunderstorm warning. Protect seedlings, secure greenhouse structures, and ensure proper drainage.",
      bn: "বজ্রঝড় সতর্কতা। চারা রক্ষা করুন, গ্রিনহাউস সংযুক্ত করুন, এবং নিষ্কাশন নিশ্চিত করুন।",
    };
  }
  if (condition === "rainy" && rainChance > 60) {
    return {
      en: "Heavy rain expected. Clear drainage channels and delay pesticide application.",
      bn: "প্রচুর বৃষ্টি প্রত্যাশিত। নিষ্কাশন খাল পরিষ্কার করুন এবং কীটনাশক প্রয়োগ বিলম্ব করুন।",
    };
  }
  if (temp > 35) {
    return {
      en: "Extreme heat. Irrigate crops in early morning or evening. Apply mulch to retain moisture.",
      bn: "প্রচণ্ড গরম। ভোরবেলা বা সন্ধ্যায় ফসলে সেচ দিন। আর্দ্রতা ধরে রাখতে মলচিং করুন।",
    };
  }
  if (temp > 30 && humidity > 80) {
    return {
      en: "Hot and humid. Monitor for fungal diseases. Ensure good air circulation between plants.",
      bn: "গরম ও আর্দ্র। ছত্রাক রোগ পর্যবেক্ষণ করুন। গাছের মধ্যে ভালো বাতাস চলাচল নিশ্চিত করুন।",
    };
  }
  if (temp < 20 && humidity < 50) {
    return {
      en: "Cool and dry. Good conditions for land preparation and sowing winter crops.",
      bn: "শীতল ও শুষ্ক। জমি প্রস্তুতি ও শীতকালীন ফসল বুননের জন্য ভালো অবস্থা।",
    };
  }
  if (rainChance > 40) {
    return {
      en: "Moderate rain chance. Prepare for planting if soil moisture is adequate.",
      bn: "মাঝারি বৃষ্টির সম্ভাবনা। মাটির আর্দ্থা পর্যাপ্ত হলে রোপণের প্রস্তুতি নিন।",
    };
  }
  if (condition === "sunny" && temp > 25) {
    return {
      en: "Clear skies. Good day for spraying, transplanting, or field work.",
      bn: "পরিষ্কার আকাশ। স্প্রে, রোপণ বা মাঠের কাজের জন্য ভালো দিন।",
    };
  }
  return {
    en: "Moderate weather conditions. Good for general farm maintenance and monitoring.",
    bn: "মাঝারি আবহাওয়া। সাধারণ খামার রক্ষণাবেক্ষণ ও পর্যবেক্ষণের জন্য ভালো।",
  };
}

function aggregateToDaily(list: OWMForecastItem[]): WeatherDay[] {
  const byDate = new Map<string, OWMForecastItem[]>();

  for (const item of list) {
    const dateStr = item.dt_txt.split(" ")[0];
    if (!byDate.has(dateStr)) byDate.set(dateStr, []);
    byDate.get(dateStr)!.push(item);
  }

  const days: WeatherDay[] = [];
  let dayIndex = 0;

  for (const [dateStr, items] of byDate) {
    if (days.length >= 7) break;

    const temps = items.map((i) => i.main.temp);
    const highs = items.map((i) => i.main.temp_max);
    const lows = items.map((i) => i.main.temp_min);
    const humidities = items.map((i) => i.main.humidity);
    const winds = items.map((i) => i.wind.speed * 3.6);
    const pops = items.map((i) => i.pop);

    const high = Math.round(Math.max(...highs));
    const low = Math.round(Math.min(...lows));
    const avgHumidity = Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length);
    const maxWind = Math.round(Math.max(...winds));
    const maxPop = Math.round(Math.max(...pops) * 100);

    // Pick dominant condition from midday entries or most common
    const midday = items.filter((i) => {
      const hour = parseInt(i.dt_txt.split(" ")[1].split(":")[0]);
      return hour >= 9 && hour <= 18;
    });
    const conditionItems = midday.length > 0 ? midday : items;
    const conditionCounts = new Map<string, number>();
    for (const i of conditionItems) {
      const c = i.weather[0]?.main ?? "Clear";
      conditionCounts.set(c, (conditionCounts.get(c) ?? 0) + 1);
    }
    const dominant = [...conditionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Clear";
    const condition = mapCondition(dominant);

    const date = new Date(dateStr + "T00:00:00");
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const advice = generateAdvice(avgTemp, avgHumidity, maxPop, condition);

    days.push({
      day: DAY_NAMES[date.getDay()],
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      high,
      low,
      condition,
      humidity: avgHumidity,
      rainChance: maxPop,
      wind: maxWind,
      advice: advice.en,
      adviceBn: advice.bn,
    });

    dayIndex++;
  }

  return days;
}

export async function fetchWeather(city: (typeof CITIES)[number]): Promise<WeatherLocation> {
  if (!API_KEY) throw new Error("Missing VITE_OPENWEATHER_API_KEY");

  const url = `${BASE}/forecast?lat=${city.lat}&lon=${city.lon}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data: OWMResponse = await res.json();
  const first = data.list[0];

  return {
    name: city.name,
    nameBn: city.nameBn,
    current: {
      temp: Math.round(first.main.temp),
      feelsLike: Math.round(first.main.feels_like),
      humidity: first.main.humidity,
      condition: mapCondition(first.weather[0]?.main ?? "Clear"),
    },
    forecast: aggregateToDaily(data.list),
  };
}

export type DistrictWeather = {
  temp: number;
  humidity: number;
  condition: WeatherDay["condition"];
  advice: string;
  adviceBn: string;
};

const districtCache = new Map<string, { ts: number; data: DistrictWeather }>();
const DISTRICT_CACHE_TTL = 1000 * 60 * 10;

export async function fetchWeatherByDistrict(district: string): Promise<DistrictWeather> {
  const cached = districtCache.get(district);
  if (cached && Date.now() - cached.ts < DISTRICT_CACHE_TTL) return cached.data;

  const coords = DISTRICT_COORDS[district];
  if (!coords) throw new Error(`No coordinates for district: ${district}`);
  if (!API_KEY) throw new Error("Missing VITE_OPENWEATHER_API_KEY");

  const url = `${BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data: OWMResponse = await res.json();
  const first = data.list[0];
  const today = aggregateToDaily(data.list)[0];

  const out: DistrictWeather = {
    temp: Math.round(first.main.temp),
    humidity: first.main.humidity,
    condition: mapCondition(first.weather[0]?.main ?? "Clear"),
    advice: today.advice,
    adviceBn: today.adviceBn,
  };
  districtCache.set(district, { ts: Date.now(), data: out });
  return out;
}
