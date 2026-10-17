// Space adapter — talks to the Gradio demo Space instead of the FastAPI backend.
// Active only when VITE_BACKEND=space. Signatures mirror model-api.ts so pages
// stay unchanged. Space: https://huggingface.co/spaces/hodoly163/krishibondhu-demo
import { Client } from "@gradio/client";
import type {
  Advice,
  ChatLang,
  ChatMessage,
  DiseaseBrief,
  MarketPricesResponse,
  PredictionResult,
  PriceHistoryResponse,
} from "@/lib/model-api";

const SPACE_URL =
  (import.meta.env.VITE_SPACE_URL as string) ||
  "https://hodoly163-krishibondhu-demo.hf.space";

let client: Client | null = null;
async function getClient(): Promise<Client> {
  if (!client) client = await withRetry(() => Client.connect(SPACE_URL));
  return client;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function shortCause(e: unknown): string {
  const s = String(e instanceof Error ? e.message : e);
  return s.length > 120 ? s.slice(0, 120) + "…" : s;
}

function describeFailure(e: unknown): Error {
  const raw = shortCause(e);
  if (/quota|exceeded/i.test(raw))
    return new Error(`Free demo GPU is busy right now. Please try again in a little while. (${raw})`);
  return new Error(`Demo Space may be waking up (cold start). Try once more. (${raw})`);
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    // Free-tier Spaces restart/sleep — one bounded retry covers boot blips.
    await sleep(4000);
    try {
      return await fn();
    } catch (e) {
      throw describeFailure(e);
    }
  }
}

// Stash Space advice per language (Space returns one predict => {en, bn} advice).
let lastSpaceAdvice: { en?: string; bn?: string } = {};

function parseDetections(summary: string): PredictionResult["detections"] {
  const out: PredictionResult["detections"] = [];
  for (const line of summary.split("\n")) {
    const m = line.match(/^\s*(.+?)\s*:\s*([\d.]+)\s*$/);
    if (!m) continue;
    const conf = Number(m[2]);
    if (!m[1] || Number.isNaN(conf)) continue;
    out.push({ class: m[1].trim(), conf, box: [] });
  }
  out.sort((a, b) => b.conf - a.conf);
  return out;
}

export async function predictDisease(file: File): Promise<PredictionResult> {
  const c = await getClient();
  const res = (await withRetry(() =>
    c.predict("/predict", { image: file }),
  )) as { data: [string, string, string] };
  const [summary, adviceEn, adviceBn] = res.data;
  lastSpaceAdvice = { en: adviceEn || undefined, bn: adviceBn || undefined };
  const detections = parseDetections(summary ?? "");
  if (!detections.length) return { detections: [], top: null };
  return { detections, top: detections[0] };
}

export async function getAdvice(
  _result: PredictionResult,
  _disease: DiseaseBrief | null,
  _lang?: ChatLang,
): Promise<Advice | null> {
  if (!_result.detections.length) return null;
  return { en: lastSpaceAdvice.en ?? "", bn: lastSpaceAdvice.bn ?? "" };
}

function formatContext(context: Record<string, unknown> | undefined, lang: ChatLang): string {
  if (!context || typeof context !== "object") return "";
  const parts: string[] = [];
  const farmer = context.farmer as { district?: string } | undefined;
  const weather = context.weather as
    | { temp?: number; humidity?: number; condition?: string }
    | null
    | undefined;
  if (farmer?.district) parts.push(`district: ${farmer.district}`);
  if (weather && typeof weather.temp === "number")
    parts.push(
      `live weather: ${weather.temp}\u00B0C, humidity ${weather.humidity}%, ${weather.condition}`,
    );
  const market = context.market as { crop: string; price: number; unit: string }[] | null;
  if (Array.isArray(market) && market.length)
    parts.push(
      `live market: ${market
        .slice(0, 5)
        .map((p) => `${p.crop} \u09F3${p.price}/${p.unit}`)
        .join("; ")}`,
    );
  if (!parts.length) return "";
  return lang === "bn"
    ? `[\u09B2\u09BE\u0987\u09AD \u09A4\u09A5\u09CD\u09AF: ${parts.join(" | ")}]`
    : `[Live facts: ${parts.join(" | ")}]`;
}

function composeMessage(
  messages: ChatMessage[],
  current: string,
  context: Record<string, unknown> | undefined,
  lang: ChatLang,
): string {
  // Space /chat takes a single message — fold recent history + live facts into it.
  // (The chat UI keeps showing the raw user text; this only shapes the API payload.)
  const lines: string[] = [];
  for (const m of messages.slice(0, -1).slice(-6))
    lines.push(`${m.role === "user" ? "Farmer" : "Assistant"}: ${m.content.slice(0, 400)}`);
  const ctx = formatContext(context, lang);
  if (ctx) lines.push(ctx);
  lines.push(`Question: ${current}`);
  return lines.join("\n");
}

export async function sendChat(
  messages: ChatMessage[],
  lang: ChatLang,
  context?: Record<string, unknown>,
): Promise<string | null> {
  try {
    const c = await getClient();
    const last = [...messages].reverse().find((m) => m.role === "user");
    if (!last) return null;
    const res = (await withRetry(() =>
      c.predict("/chat", {
        message: composeMessage(messages, last.content, context, lang),
        lang,
      }),
    )) as { data: [string] };
    return res.data?.[0] ?? null;
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
  // Gradio SSE streaming differs from the FastAPI parser — degrade to one reply.
  const full = await sendChat(messages, lang, context);
  if (full) onDelta(full);
  return full;
}

function parseMarketTable(md: string): MarketPricesResponse["rows"] {
  const rows: MarketPricesResponse["rows"] = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/);
    if (!m || /^crop/i.test(m[1].trim())) continue;
    if (/^[\s:-]+$/.test(m[1]) || /^[\s:-]+$/.test(m[2])) continue; // separator row
    const price = Number(String(m[2]).replace(/[^\d.]/g, ""));
    rows.push({
      crop: m[1].trim(),
      cropBn: m[1].trim(),
      price: Number.isNaN(price) ? 0 : price,
      date: new Date().toISOString().slice(0, 10),
      unit: "kg",
      source: "dam-space",
    });
  }
  return rows;
}

export async function fetchMarketPrices(): Promise<MarketPricesResponse> {
  const c = await getClient();
  const res = (await withRetry(() => c.predict("/market", { top_n: 10 }))) as {
    data: [string];
  };
  const rows = parseMarketTable(res.data?.[0] ?? "");
  if (!rows.length) throw new Error("Space market returned no rows");
  return { updated_at: new Date().toISOString().slice(0, 10), sources: ["dam-space"], rows };
}

export async function fetchPriceHistory(
  crop: string,
  _days = 60,
): Promise<PriceHistoryResponse> {
  // Space has no history endpoint — marketplace falls back to static data.
  return { crop, points: [] };
}
