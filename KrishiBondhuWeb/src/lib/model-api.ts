const API_URL = (import.meta.env.VITE_MODEL_API_URL as string) || "";

import { getStoredApiKey } from "@/lib/api-key";

function apiHeaders(): Record<string, string> {
  const key = getStoredApiKey();
  return key ? { "X-API-Key": key } : {};
}

export type Detection = {
  class: string;
  conf: number;
  box: number[];
};

export type PredictionResult = {
  detections: Detection[];
  top: Detection | null;
};

export type Advice = { en: string; bn: string };

export type DiseaseBrief = {
  name: string;
  nameBn: string;
  severity: string;
  organicTreatment: string;
  organicTreatmentBn: string;
  chemicalTreatment: string;
  chemicalTreatmentBn: string;
  prevention: string;
  preventionBn: string;
};

export async function predictDisease(file: File): Promise<PredictionResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: apiHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(`Model API error ${res.status}`);
  return res.json();
}

export async function getAdvice(
  result: PredictionResult,
  disease: DiseaseBrief | null,
): Promise<Advice | null> {
  if (!result.detections.length) return null;
  try {
    const res = await fetch(`${API_URL}/advise`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...apiHeaders() },
      body: JSON.stringify({ detections: result.detections.slice(0, 3), top: result.top, disease }),
    });
    if (!res.ok) return null;
    return (await res.json()).advice ?? null;
  } catch {
    return null;
  }
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type MarketPrice = {
  crop: string;
  cropBn: string;
  price: number;
  min?: number;
  max?: number;
  change_pct?: number;
  date: string;
  unit: string;
  source?: string;
};

export type MarketPricesResponse = {
  updated_at: string;
  sources: string[];
  rows: MarketPrice[];
};

export type PriceHistoryResponse = {
  crop: string;
  points: { date: string; price: number }[];
};

export async function fetchMarketPrices(): Promise<MarketPricesResponse> {
  const res = await fetch(`${API_URL}/market-prices`, { headers: apiHeaders() });
  if (!res.ok) throw new Error(`Market API error ${res.status}`);
  return res.json();
}

export async function fetchPriceHistory(crop: string, days = 60): Promise<PriceHistoryResponse> {
  const res = await fetch(
    `${API_URL}/market-prices/history?crop=${encodeURIComponent(crop)}&days=${days}`,
    { headers: apiHeaders() },
  );
  if (!res.ok) throw new Error(`History API error ${res.status}`);
  return res.json();
}

import { fetchWeatherByDistrict, type DistrictWeather } from "@/lib/weather-api";

export type ChatLang = "en" | "bn";

export async function buildContext(
  district: string,
  lang: ChatLang,
): Promise<Record<string, unknown>> {
  let weather: DistrictWeather | null = null;
  try {
    weather = await fetchWeatherByDistrict(district);
  } catch {
    weather = null; // context without live weather
  }

  let prices: MarketPrice[] | null = null;
  try {
    const data = await fetchMarketPrices();
    prices = data.rows.slice(0, 5);
  } catch {
    prices = null; // context without live prices
  }

  return {
    farmer: { district, language: lang === "bn" ? "Bengali" : "English" },
    weather: weather
      ? { temp: weather.temp, humidity: weather.humidity, condition: weather.condition }
      : null,
    market: prices
      ? prices.map((p) => ({ crop: p.crop, price: p.price, unit: p.unit, date: p.date }))
      : null,
  };
}

export async function sendChat(
  messages: ChatMessage[],
  lang: ChatLang,
  context: Record<string, unknown>,
): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...apiHeaders() },
      body: JSON.stringify({ messages, lang, context }),
    });
    if (!res.ok) return null;
    return (await res.json()).reply ?? null;
  } catch {
    return null;
  }
}

export async function streamChat(
  messages: ChatMessage[],
  lang: ChatLang,
  context: Record<string, unknown>,
  onDelta: (piece: string) => void,
): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...apiHeaders() },
      body: JSON.stringify({ messages, lang, context }),
    });
    if (!res.ok || !res.body) return null;

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let full = "";
    let buffer = "";

    const flush = (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") return false;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta) {
            full += delta;
            onDelta(delta);
          }
          if (json.choices?.[0]?.finish_reason) return false;
        } catch {
          // ignore malformed SSE line
        }
      }
      return true;
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!flush(decoder.decode(value, { stream: true }))) break;
    }
    return full || null;
  } catch {
    return null;
  }
}
