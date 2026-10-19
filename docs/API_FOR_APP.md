# KrishiBondhu API — Backend Integration Guide

Backend contract for any client (the Flutter app). One cloud-hosted REST backend, 24/7 on a free public URL — no tunnel, no local server, no auth.

## 1. Base URL

```
https://hodoly163-krishibondhu-api.hf.space
```

FastAPI on a free-tier Hugging Face Space (`hodoly163/krishibondhu-api`). Interactive Swagger UI for every endpoint: **`/docs`**. Landing page: **`/`**.

Point your HTTP client's `baseUrl` at this single value (e.g. Dio `BaseOptions(baseUrl: ...)`), ideally from a compile-time define so it isn't hardcoded in feature code.

## 2. Availability — read this first

The backend is **online by default**; the main failure mode is a cold start, not "offline".

- **Ready probe:** `GET /health` → `{"ok":true,"model":"jktk_x.pt","classes":116}`.
  - ⚠️ On this deployment `/health` *warms the model*: the first call after a container restart can take as long as the model warm-up below. Don't poll it every few seconds as a liveness check — call it once with a generous timeout, or just let the first detect absorb the wait.
- **Sleep/wake:** after ~48 h with no traffic the Space sleeps. The first request then takes **~1–2 minutes**. The default Dio `connectTimeout` (15 s) will fire — retry once or raise timeouts.
- **Model warm-up:** the YOLO model (`jktk_x.pt`, ~436 MB) is fetched on the **first `/disease/detect` or `/predict`** after a container restart. Measured: **~10 s** when the weights are cached, up to **~2–5 min** when they must download. Later scans are fast.
- **Platform-level errors:** an HTML error page (not JSON), or 502/503 in the first seconds — the Space is booting or rebuilding. Wait ~2–5 min and retry. This only happens after backend updates.
- **Rate limits:** only the web-native heavy routes are limited — **30 req/min per IP** on `/predict`, `/chat`, `/chat/stream`, `/agent/run`. On `429` (`{"detail":"Rate limit exceeded, retry in Ns."}`) back off. The app endpoints (`/disease/detect`, `/assistant/chat`, `/market/prices`, `/weather/forecast`) are **not** rate limited.
- **Chat LLM:** hosted upstream. If it's temporarily down, `/assistant/chat` returns `502 {"detail":"…"}` and `/chat` returns `200 {"reply":null}` — treat both as "retry later", not as a fatal error.

## 3. Auth / headers

- **No auth.** No API key, no Bearer. Send plain JSON / multipart.
- **CORS:** `*` — fine for Flutter, web and curl.
- **GZip:** responses ≥ ~500 bytes are compressed.
- All responses are `application/json` unless stated.

## 4. Endpoints

### 4.1 `GET /health`

```bash
curl https://hodoly163-krishibondhu-api.hf.space/health
# {"ok":true,"model":"jktk_x.pt","classes":116}
```

`{"ok":false,…}` while booting → retry.

### 4.2 `POST /disease/detect` (recommended) and `POST /predict` (identical model)

Multipart upload. The field may be named **`image`**, `file`, `photo` or `picture`; optional `locale=en|bn` as a form field or query param. Also mirrored at `/api/disease/detect`.

```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/disease/detect \
  -F "image=@leaf.jpg" -F "locale=en"
```

Response — one shape merges the detection plus farmer-facing fields:

```json
{
  "disease": "rice leaf",
  "scientificName": "",
  "confidence": 0.9017,
  "severity": "High",
  "organicTreatment": "Remove affected leaves and spray neem oil (5 ml/L) every 5-7 days.",
  "chemicalTreatment": "Consult local extension for targeted fungicide for this crop.",
  "prevention": "Use clean seed, balanced fertilizer, and good field hygiene.",
  "detections": [{"class": "rice leaf", "conf": 0.9017, "box": [4.4, 17.6, 569.8, 495.9]}],
  "top": {"class": "rice leaf", "conf": 0.9017, "box": [4.4, 17.6, 569.8, 495.9]}
}
```

Field notes (all verified against the live API):

- `disease` is the **raw model label**, as-is — lowercase, and it can be a crop/plant part (e.g. `"rice leaf"`, `"banana leaf"`) as well as an actual disease name. Display it verbatim; don't assume it parses as a disease.
- `scientificName` may be `""` for labels without a mapped scientific name (many crop/leaf classes). Treat empty as "not available".
- `severity` is derived from confidence: `High` > 0.85, `Moderate` > 0.6, else `Low`; with `locale=bn` the Bangla string is returned in the same field.
- `locale=bn` returns all human-readable fields in Bangla.
- `detections` sorted by `conf` desc; `top` is the best box or `null`.
- **No detection:** `detections:[]`, `top:null`, `disease:"No disease detected"`, `confidence:0.0`, `severity:"None"` — fields stay non-null so simple decoders never crash.
- Boxes are `[x1, y1, x2, y2]` in pixels of the uploaded image.
- **Errors:** a missing file field → `400 {"detail":"Missing image/file field. Send multipart with \`image\` or \`file\`."}`; an unreadable/undecodable image → `500` (validate the file on the client first).
- Remember §2: the first detect after a restart can take minutes — use a long timeout once (for example 300 s) and/or retry once.

### 4.3 `POST /advise` (optional follow-up text)

Optional: only needed if you want a generated bilingual advisory separate from the treatment fields above.

```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/advise \
  -H "Content-Type: application/json" \
  -d '{"top":{"class":"rice leaf","conf":0.9,"box":[0,0,100,100]},"detections":[],"disease":null}'
# {"advice":{"en":"…","bn":"…"}}   |   {"advice":null} when the LLM is down
```

### 4.4 Chat

**App chat — `POST /assistant/chat`** (mirror: `/api/assistant/chat`):

```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How to control aphids on mustard?","locale":"en","history":[{"id":"1","role":"user","text":"hi"}]}'
# {"id":"msg-24b5cd9f","role":"assistant","text":"Hello. Rice blast is caused by the fungus *Magnaporthe oryzae*."}
```

- `history` items are `{id, role, text}`; server keeps at most the last **12** messages.
- `text` is Markdown (the model bolds/short-lists). An empty or missing `message` still returns a friendly reply, so validate client-side if you need to block empty sends.

**Web-style chat — `POST /chat`:**

```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}],"lang":"en","context":{"farmer":{"district":"Rajshahi"}}}'
# {"reply":"…"}   |   {"reply":null} when the LLM is down
```

**Streaming — `POST /chat/stream`** (SSE, same body as `/chat`):

```bash
curl -N -X POST https://hodoly163-krishibondhu-api.hf.space/chat/stream \
  -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}],"lang":"en","context":{}}'
# data: {"id":"chatcmpl-…","object":"chat.completion.chunk","choices":[{"index":0,"delta":{"role":"assistant","content":""},…}],…}
# data: {"id":"chatcmpl-…","choices":[{"index":0,"delta":{"reasoning":"User","channel":"analysis"},…}],…}   <-- ignore
# data: {"id":"chatcmpl-…","choices":[{"index":0,"delta":{"content":"Hi."},…}],…}
# data: [DONE]
```

Parse line-by-line: ignore empty lines; every payload after `data: ` is JSON; `data: [DONE]` ends the stream.

⚠️ **Only read `choices[0].delta.content` and skip chunks that don't have it.** The upstream model streams its private thinking as `delta.reasoning` (observed: ~110 of 114 chunks in a short reply) — rendering those would leak the model's internal analysis into your UI. Append `content` only; ignore `reasoning` and empty `content`.

### 4.5 Market prices

**App shape — `GET /market/prices`** (mirror: `/api/market/prices`) returns a **bare JSON list**:

```bash
curl https://hodoly163-krishibondhu-api.hf.space/market/prices
# [{"name":"Chili","nameBn":"মরিচ","emoji":"🌶️","category":"Vegetables",
#   "pricePerKg":85.96,"changePercent":0.0,"min":40.0,"max":156.0,
#   "date":"2026-05-15","unit":"kg"}, …]
```

- Extra fields (`min`, `max`, `date`, `unit`) are additive; a decoder that only reads `name/nameBn/pricePerKg/changePercent/category/emoji` is safe.
- **8 rows**, one per commodity on the government board (Chili, Garlic, Lentils, Onion, Potato, Rice, Sugar, Wheat) — count and composition come from the source feed, so decode a list of arbitrary length rather than assuming 8.

**Web shape — `GET /market-prices`** returns the richer envelope:

```json
{"updated_at":"2026-10-19","sources":["dam"],"rows":[{"crop":"Onion","cropBn":"পেঁয়াজ","price":73.5,"min":72,"max":75,"change_pct":0.0,"date":"2026-10-19","unit":"kg","source":"dam"}]}
```

- `sources` is `["dam"]` for today's live scrape; when the government feed is unreachable the backend **degrades instead of failing** and returns the shipped official dataset: `sources:["dataset"]` and an older `date` (dataset captures are dated). **Handle both** — show `date` next to the price.
- **History — `GET /market-prices/history?crop=Chili&days=30`** → `{"crop":"Chili","points":[{"date":"2026-05-15","price":85.96}]}`.
  - On the cloud backend history accrues only from successful *live* scrapes and the container disk is ephemeral, so it can be empty or reset after a restart. Don't treat an empty `points` as an error; fall back to the current price row.
  - Crop keys are the English names from the feed (`"Chili"`, `"Onion"`, `"Rice"`, …).

### 4.6 Weather / Satellite / Soil

```bash
curl "https://hodoly163-krishibondhu-api.hf.space/weather/forecast?district=Rajshahi&locale=en"
curl "https://hodoly163-krishibondhu-api.hf.space/satellite/analysis?district=Rajshahi&locale=en"
curl -X POST https://hodoly163-krishibondhu-api.hf.space/soil/analyze \
  -H "Content-Type: application/json" -d '{"location":"Rajshahi","locale":"en"}'
```

- **Weather is live** (OpenWeather) — `{district, todayHigh, todayLow, condition, humidity, rainChance, advisoryEn, advisoryBn, alerts[], daily[]}`, real values per district.
- **Satellite and soil are preview stubs**: correct field shapes (`ndvi`, `cropHealth`, `waterStress`, `floodRisk`, `yieldEstimate` / `location, ph, nitrogen, phosphorus, potassium, recommendedCrop, fertilizerAdvice, expectedYield`) with `"_note":"stub — wire to … when ready"`. The extra `_note` key is additive and safe to ignore; don't present stub values as live measurements.

## 5. Flutter wiring

Client shape that works (Dio + `Result`-style error handling):

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://hodoly163-krishibondhu-api.hf.space',
  connectTimeout: const Duration(seconds: 15),
  receiveTimeout: const Duration(seconds: 30), // bump to ~300 s for the FIRST detect after a restart
  contentType: 'application/json',            // Dio switches to multipart automatically for FormData
));
```

Detection upload:

```dart
final form = FormData.fromMap({
  'image': await MultipartFile.fromFile(path, filename: 'leaf.jpg'),
  'locale': locale, // 'en' | 'bn'
});
final res = await dio.post('/disease/detect', data: form);
// res.data['disease'] / ['severity'] / ['confidence'] / ['organicTreatment'] / ['detections']
```

Cold-start tolerant retry:

```dart
Future<T> attemptTwice<T>(Future<T> Function() call) async {
  try {
    return await call();
  } catch (_) {
    return await call(); // covers the cold-wake timeout on the first request after idle
  }
}
```

Streaming chat: `dio.post('/chat/stream', data: body, options: Options(responseType: ResponseType.stream))`, then split the byte stream on `\n`, ignore blanks, stop at `data: [DONE]`, `jsonDecode` each `data: {…}` payload, and append **only** `choices[0].delta.content` (skip `delta.reasoning` — see §4.4).

Never surface a raw network error to the user for the cases in §2 — "waking up, retrying" is the correct message for the first ~2 minutes after idle.

## 6. Verification checklist (curl)

```bash
BASE=https://hodoly163-krishibondhu-api.hf.space
curl $BASE/health
curl $BASE/market/prices
curl "$BASE/weather/forecast?district=Rajshahi&locale=en"
curl -X POST $BASE/disease/detect -F "image=@leaf.jpg" -F "locale=en"
curl -X POST $BASE/assistant/chat -H "Content-Type: application/json" \
     -d '{"message":"How to control aphids on mustard?","locale":"en","history":[]}'
```

Help panel for judges/devs: `$BASE/docs` (Swagger, every route and schema).
