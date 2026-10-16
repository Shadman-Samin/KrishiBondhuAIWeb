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
  if (!client) client = await Client.connect(SPACE_URL);
  return client;
}

// Stash Space advice (Space returns advice together with detections,
// FastAPI splits /predict + /advise).
let lastSpaceAdvice: Advice | null = null;
let lastSpaceLang: ChatLang = "en";

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
  const lang =
    (document.documentElement.lang === "bn" ? "bn" : "en") as ChatLang;
  const res = (await c.predict("/predict", { image: file, lang })) as {
    data: [string, string];
  };
  const [summary, adviceText] = res.data;
  const detections = parseDetections(summary ?? "");
  lastSpaceAdvice = adviceText
    ? { en: adviceText, bn: adviceText }
    : null;
  lastSpaceLang = lang;
  if (!detections.length) return { detections: [], top: null };
  return { detections, top: detections[0] };
}

export async function getAdvice(
  result: PredictionResult,
  _disease: DiseaseBrief | null,
  lang?: ChatLang,
): Promise<Advice | null> {
  if (!result.detections.length) return null;
  if (lastSpaceAdvice && (!lang || lang === lastSpaceLang)) return lastSpaceAdvice;
  return lastSpaceAdvice;
}

export async function sendChat(
  messages: ChatMessage[],
  lang: ChatLang,
): Promise<string | null> {
  try {
    const c = await getClient();
    const last = [...messages].reverse().find((m) => m.role === "user");
    if (!last) return null;
    const res = (await c.predict("/chat", {
      message: last.content,
      lang,
    })) as { data: [string] };
    return res.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function streamChat(
  messages: ChatMessage[],
  lang: ChatLang,
  _context: Record<string, unknown>,
  onDelta: (piece: string) => void,
): Promise<string | null> {
  // Gradio SSE streaming differs from the FastAPI parser — degrade to one reply.
  const full = await sendChat(messages, lang);
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
  const res = (await c.predict("/market", { top_n: 10 })) as { data: [string] };
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
