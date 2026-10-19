# KrishiBondhu API — Flutter App Integration Guide

Share this file with the Flutter app developer. The app talks to one **cloud-hosted REST backend** (free-tier Hugging Face Space), 24/7 on a free public URL. One base URL, no tunnels, no local server.

## 1. Base URL

| Env | Base URL | Notes |
|-----|----------|-------|
| **Production (cloud)** | `https://hodoly163-krishibondhu-api.hf.space` | FastAPI on a Hugging Face Space (`hodoly163/krishibondhu-api`). Free tier: sleeps after ~48 h idle, wakes in ~1–2 min (see §2). |

**Flutter config:** `lib/core/config/app_env.dart:14` reads compile-time `API_BASE_URL`:

```json
// env/prod.json — the public cloud backend (give this to the app dev)
{ "API_BASE_URL": "https://hodoly163-krishibondhu-api.hf.space", "ENV": "prod", "NETWORK_LOGS": "false" }
```

`env/` is git-ignored and does not exist yet — create it first:

```bash
mkdir env
# then create env/prod.json with the JSON above
```

Run with:
```bash
flutter run --dart-define-from-file=env/prod.json
flutter build apk --dart-define-from-file=env/prod.json
```

`ApiClient` is already wired: `lib/core/network/api_client.dart:109` creates `Dio(baseUrl: AppEnv.apiBaseUrl)`. No other URL hard-coding needed.

## 2. Availability — read this first

The cloud backend is a free Hugging Face Space. It is online by default and the main failure mode is **cold start**, not "offline".

- **Normal state:** `curl https://hodoly163-krishibondhu-api.hf.space/health` → `{"ok":true,"model":"jktk_x.pt","classes":116}` — you are good to go.
- **Sleep/wake:** after ~48 h with no traffic the Space sleeps. First request to a sleeping Space takes **~1–2 minutes** (the platform wakes it, then the app boots). Make the client patient: the Dio default `connectTimeout` (15s) will time out — retry or raise timeouts. Once awake, it stays awake while traffic continues.
- **Model warm-up:** the YOLO model (`jktk_x.pt`, ≈436 MB) lazy-downloads on the **first `/disease/detect` or `/predict`** call after a container restart. Measured live: ~8 s when the weights are already cached, up to ~2–5 min when they must be downloaded. `/health` stays fast during this. If the first scan would exceed your `receiveTimeout` (30s), retry it once — the model will be cached by then.
- **`/health` returns `{"ok":false,...}`:** the backend is booting (or the model is downloading if a model endpoint was hit recently). Treat as *temporary* — poll every ~5 s up to ~3 min before surfacing an error.
- **Connection refused / 5xx at the platform level (HTML error page, not JSON):** Space is mid-build or restarting. Wait ~2–5 min and retry. Builds only happen after backend updates.
- **Rate limit:** `/predict`, `/chat`, `/chat/stream`, `/agent/run` are limited to **30 requests/min per IP** (`api/server.py` middleware). On `429`, back off and retry — don't hammer.
- **Chat/advise LLM:** hosted in the cloud. If the LLM layer returns null (`POST /advise` → `200 {"advice":null}`, `POST /chat` → `200 {"reply":null}`) treat as "LLM temporarily unavailable — retry later"; only `POST /assistant/chat` (+`/api/assistant/chat`) surfaces `502 {"detail":...}` on LLM down. All three are graceful.

## 3. Auth / Headers

- **No auth required.** No API key is needed by the current public backend — send no `X-API-Key`. `AuthInterceptor` (`lib/core/network/interceptors/auth_interceptor.dart:12`) exists but is dormant until an auth system ships (`AccountController` is `null`) — no `Bearer` is sent.
- **CORS:** `allow_origins=["*"]` (`api/server.py:54`). Works from Flutter/Dio, web, curl.
- **GZip:** responses ≥500 bytes are gzipped (`api/server.py:49`).

## 4. Endpoints

### 4.1 Health — `GET /health`

```bash
curl https://hodoly163-krishibondhu-api.hf.space/health
# {"ok":true,"model":"jktk_x.pt","classes":116}
```

Human-facing extras: `GET /` returns a short landing page, `GET /docs` is the interactive Swagger UI for every endpoint.

### 4.2 Disease detection — `POST /disease/detect` (app-native) & `POST /predict` (web-native)

Both run the same YOLO model (`models/jktk_x.pt`, 116 classes, `conf=0.25, imgsz=640` `api/server.py:25`). The shim accepts **any** of `image`/`file`/`photo`/`picture` multipart field + optional `locale=en|bn` (form or `?locale=` query).

**Flutter path (recommended — matches `DiseaseRepository`):**
```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/disease/detect \
  -F "image=@leaf.jpg" -F "locale=en"
```

**Web path (also live, aliased as `/api/disease/detect`):**
```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/predict -F "file=@leaf.jpg"
```

**Response** (`/disease/detect` merges both shapes so either decoder works):
```json
{
  "disease": "Rice Blast",
  "scientificName": "Magnaporthe oryzae",
  "confidence": 0.9472,
  "severity": "Moderate",
  "organicTreatment": "Spray neem oil ...",
  "chemicalTreatment": "Apply Tricyclazole 75 WP ...",
  "prevention": "Use resistant varieties ...",
  "detections": [{"class":"rice blast","conf":0.9472,"box":[12.3,45.1,210.0,300.5]}],
  "top": {"class":"rice blast","conf":0.9472,"box":[12.3,45.1,210.0,300.5]}
}
```
 - `detections` sorted by `conf` desc (`api/server.py:101`). `top` is best or `null`. Extra `detections`/`top` are merged into the `DiseaseResult` JSON but `DiseaseResult.fromJson` (`disease_result.dart:25`) ignores them — safe.
 - If no detection: `detections:[]`, `top:null`, `disease:"No disease detected"` (bn: `"কোনো রোগ সনাক্ত হয়নি"`), `confidence:0.0`, `severity:"None"` — kept non-null so `DiseaseResult.fromJson` (`disease: String`) never crashes (`api/server.py:250`).
 - `locale=bn` returns Bangla `disease/severity/organicTreatment/...` (`api/server.py:162`).
 - Remember §2: the FIRST detect after a cold restart triggers the model download (~2–5 min). Retry-once pattern recommended.

**Dart — `lib/features/disease/data/disease_repository.dart:17`:**
```dart
// No change needed — already uses FormData image+locale against /disease/detect
final result = await ref.read(diseaseRepositoryProvider).analyze(path, locale: locale);
// decode via DiseaseResult.fromJson handles the merged response above
```
If you were on mocks, one-line swap in `providers.dart`:
```dart
// Before
await ref.read(diseaseRepositoryProvider).analyzeMock(path, locale: locale);
// After
await ref.read(diseaseRepositoryProvider).analyze(path, locale: locale);
```

### 4.3 Advise — `POST /advise` (optional, LLM follow-up to detection)

Web calls this after `/predict` to get bilingual farmer advice. Flutter can ignore if it already uses `DiseaseResult` organic/chemical fields.

```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/advise \
  -H "Content-Type: application/json" \
  -d '{"top":{"class":"rice blast","conf":0.94,"box":[0,0,100,100]},"detections":[{"class":"rice blast","conf":0.94,"box":[0,0,100,100]}],"disease":null}'
# {"advice":{"en":"...","bn":"..."}} or {"advice":null} on LLM error
```

### 4.4 Chat — `POST /assistant/chat` (app) & `POST /chat` / `POST /chat/stream` (web)

**Native web:**
```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How to control aphids on mustard?"}],"lang":"en","context":{"farmer":{"district":"Rajshahi","language":"English"}}}'
# {"reply":"..."}  (null on LLM down)
```
SSE stream:
```bash
curl -N -X POST https://hodoly163-krishibondhu-api.hf.space/chat/stream -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}],"lang":"en","context":{}}'
# data: {"choices":[{"delta":{"content":"Hello"}}]}
# ...
# data: [DONE]
```

**Flutter shim — `POST /assistant/chat` (also `/api/assistant/chat`):**
```bash
curl -X POST https://hodoly163-krishibondhu-api.hf.space/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How to control aphids on mustard?","locale":"en","history":[{"id":"1","role":"user","text":"hi"}]}'
# {"id":"msg-a1b2c3d4","role":"assistant","text":"..."}
```

> **Chat needs the LLM secrets on the Space** (`ADVISE_URL=https://api.groq.com/openai/v1`, `ADVISE_MODEL=openai/gpt-oss-20b`, `ADVISE_API_KEY=<Groq key>`). Until they are pasted into the Space settings, chat/advise fall back to a local LLM that isn't running and you get `502 {"detail":"assistant error: <urlopen error [Errno 111] Connection refused>"}` (or `200 {"reply":null}` on `/chat`). Detection, market and weather work regardless.
The shim maps `{message, history:[{id,role,text}], locale}` ↔ native `{messages:[{role,content}], lang, context}` (`api/server.py:486` shim, system prompt `api/server.py:332`). `locale`/`lang` = `en|bn`. History capped at 12 (`CHAT_MAX_MESSAGES=12` `api/server.py:332`).

**Dart — `lib/features/assistant/data/assistant_repository.dart:18`:**
```dart
// Already correct — just swap Mock → real in providers.dart
await ref.read(assistantRepositoryProvider).send(message: msg, history: history, locale: locale);
// ChatController.send() inside lib/features/assistant/providers.dart — change sendMock → send
```

Streaming from Flutter (if you want SSE):
```dart
// Use Dio with ResponseType.stream against /chat/stream, same payload as web's streamChat
// See KrishiBondhuWeb/src/lib/model-api.ts:157 for SSE parse (data: JSON then [DONE])
```

### 4.5 Market prices — `GET /market/prices` (app) & `GET /market-prices` (web)

**Web (live scrape from DAM `market.dam.gov.bd`, cached daily `api/market.py:145`):**
```bash
curl https://hodoly163-krishibondhu-api.hf.space/market-prices
# {"updated_at":"2026-09-05","sources":["dam"],"rows":[{"crop":"Aman Rice","cropBn":"আমন চাল","price":52.5,"min":50,"max":55,"change_pct":1.2,"date":"2026-09-05","unit":"kg"}]}
# Shim GET /market/prices returns same rows mapped to {name,nameBn,emoji,category,pricePerKg,changePercent,min,max,date,unit} — extra min/max/date/unit are ignored by MarketPrice.fromJson (harmless)

curl "https://hodoly163-krishibondhu-api.hf.space/market-prices/history?crop=Aman%20Rice&days=30"
# {"crop":"Aman Rice","points":[{"date":"2026-09-01","price":51.0}, ...]}
# history accrues live from daily scrapes and resets to empty on a cold restart (container disk is ephemeral on the free cloud); it may be ""-points empty right after a wake.
```

**Flutter shim — `GET /market/prices` (also `/api/market/prices`):**
```bash
curl https://hodoly163-krishibondhu-api.hf.space/market/prices
# [{"name":"Aman Rice","nameBn":"আমন চাল","emoji":"🌾","category":"Grains","pricePerKg":52.5,"changePercent":1.2,"min":50,"max":55,"date":"2026-09-05","unit":"kg"}, ...]
```
Returns a **bare list** (not an object) of `MarketPrice` (`market_repository.dart:15`, `market_price.dart:30`) with `nameFor(locale)` selecting `nameBn` when `locale==bn`. `POST /advise` and `POST /chat/stream` have no Flutter repo — Flutter uses only `POST /assistant/chat`; `/chat`/`/advise` are web paths (still live, aliased).

**Dart:**
```dart
await ref.read(marketRepositoryProvider).fetchPrices(); // swap from fetchMockPrices()
```

### 4.6 Weather / Satellite / Soil

On the **cloud backend**, `GET /weather/forecast` backs on **real OpenWeather data** when `OPENWEATHER_API_KEY` is set as a Space secret (team has that key; if it's not yet pasted, the endpoint returns the identical stub shape). `/satellite/analysis` and `POST /soil/analyze` are **preview stubs** — valid fromJson shapes, no live upstream yet.

```bash
curl "https://hodoly163-krishibondhu-api.hf.space/weather/forecast?district=Rajshahi&locale=en"
curl "https://hodoly163-krishibondhu-api.hf.space/satellite/analysis?district=Rajshahi&locale=en"
curl -X POST https://hodoly163-krishibondhu-api.hf.space/soil/analyze -H "Content-Type: application/json" -d '{"location":"Rajshahi","locale":"en"}'
```

Each returns the exact fields `WeatherForecast.fromJson` (`weather_forecast.dart:31`), `SatelliteAnalysis.fromJson` (`satellite_analysis.dart:23`), `SoilAnalysis.fromJson` (`soil_analysis.dart:25`) expect, plus `_note:"stub — wire to ... when ready"` (ignored by `fromJson`).

**Dart one-line swaps:**
```dart
// satellite: lib/features/satellite/providers.dart
ref.read(satelliteRepositoryProvider).fetch(district, locale: locale) // was fetchMock
// soil: lib/features/soil/providers.dart
ref.read(soilRepositoryProvider).analyze(location, locale: locale) // was analyzeMock
// weather: lib/features/weather/providers.dart
ref.read(weatherRepositoryProvider).fetch(district, locale: locale) // was fetchMock
```

## 5. Dio setup (already in app)

```dart
// lib/core/network/api_client.dart:109 already does:
final dio = Dio(BaseOptions(
  baseUrl: AppEnv.apiBaseUrl, // from --dart-define
  connectTimeout: Duration(seconds: 15),
  receiveTimeout: Duration(seconds: 30),
  contentType: 'application/json', // Dio auto-switches to multipart/form-data when data is FormData (disease)
));
dio.interceptors.add(AuthInterceptor(...)); // exists but dormant — AccountController is null, so no Bearer is sent
if (AppEnv.enableNetworkLogs) dio.interceptors.add(LoggingInterceptor());
```

`ApiClient` returns `Result<T>` — never throw to UI. See `lib/core/errors/result.dart`, `lib/core/errors/app_exception.dart`.

**Cold-start timeouts (cloud):** keep the defaults for interactive UI, but wrap your first request after idle with a retry (or bump `receiveTimeout` for `/disease/detect` to ~300 s on the very first call after a restart, per §2). A good pattern:
```dart
// Attempt twice (covers a cold-wake timeout on the very first request after idle)
Future<Result<T>> attemptTwice<T>(Future<Result<T>> Function() call) async {
  var r = await call();
  if (r is Failure) r = await call();
  return r;
}
```

Test locally:
```bash
flutter pub get
flutter run --dart-define-from-file=env/prod.json
# In app: scan a leaf photo → should return Rice Blast / Late Blight with confidence
```

## 6. For the Flutter dev — give this whole file to your AI

Paste the block below into your AI along with this file. The AI will wire the app in one go.

````
You are wiring the Flutter app at Krsishi-Bondhu-AI-App/ (Riverpod + Dio) to the cloud KrishiBondhu backend.
Use ONLY docs/API_FOR_APP.md as source of truth. Do not guess endpoints or hardcode URLs outside AppEnv.

Base URL: https://hodoly163-krishibondhu-api.hf.space — use this one URL everywhere.
Availability: online by default. Free-tier cold starts: ~1-2 min wake after ~48h idle (HTTP timeout -> retry); first /disease/detect after a restart triggers model download (~2-5 min, then fast). GET /health == {"ok":true,...} = ready; {"ok":false} = booting -> poll. Platform HTML error = Space rebuilding (wait ~2-5 min).
Rate limit: /predict /chat /chat/stream /agent/run = 30/min per IP; on 429 back off.

No auth. No API key required. CORS * (api/server.py:54).

Task — do all of these:

1. Create env/prod.json (env/ is git-ignored — run `mkdir env` first):
   {"API_BASE_URL":"https://hodoly163-krishibondhu-api.hf.space","ENV":"prod","NETWORK_LOGS":"false"}
   Config is read at lib/core/config/app_env.dart:14 (String.fromEnvironment API_BASE_URL). Use flutter run --dart-define-from-file=env/prod.json. Do not hardcode URLs elsewhere — lib/core/network/api_client.dart:109 already uses AppEnv.apiBaseUrl.

2. Swap mocks -> live (one line each, providers are the only place to change per Krsishi-Bondhu-AI-App/GUIDE.md:57):
   - lib/features/disease/providers.dart:   analyzeMock(path, locale) -> analyze(path, locale)   (repo lib/features/disease/data/disease_repository.dart:17 expects POST /disease/detect multipart image+locale)
   - lib/features/assistant/providers.dart: sendMock(...) -> send(...)                   (repo lib/features/assistant/data/assistant_repository.dart:18 expects POST /assistant/chat {message,history,locale} -> {id,role,text} per lib/features/assistant/data/chat_message.dart:13)
   - lib/features/market/providers.dart:    fetchMockPrices() -> fetchPrices()            (repo lib/features/market/data/market_repository.dart:15 expects GET /market/prices -> List<MarketPrice> per lib/features/market/data/market_price.dart:30)
   - lib/features/weather/providers.dart:   fetchMock(district, locale) -> fetch(...)    (repo lib/features/weather/data/weather_repository.dart:18 expects GET /weather/forecast?district=&locale=)
   - lib/features/satellite/providers.dart: fetchMock(district, locale) -> fetch(...)   (repo lib/features/satellite/data/satellite_repository.dart:17 expects GET /satellite/analysis?district=&locale=)
   - lib/features/soil/providers.dart:      analyzeMock(location, locale) -> analyze(...) (repo lib/features/soil/data/soil_repository.dart:17 expects POST /soil/analyze {location,locale})

3. Use these endpoints (app-native preferred, aliases also live):
   POST /disease/detect (also /predict and /api/disease/detect) — multipart field `image` or `file` + locale=en|bn — returns DiseaseResult fields + {detections:[{class,conf,box}],top} (api/server.py:199 shim)
   POST /assistant/chat {message,history:[{id,role,text}],locale} -> {id,role,text} (also /chat {messages:[{role,content}],lang,context} -> {reply} and /chat/stream SSE data: {choices:[{delta:{content}}]} + data: [DONE] per api/server.py: chat/assistant_chat_compat, capped at 12 msgs)
   GET  /market/prices (also /market-prices) -> bare list for MarketPrice.fromJson; history: GET /market-prices/history?crop=&days= (cloud: accrues at runtime, resets on cold restart)
   GET  /weather/forecast?district=&locale= (real OpenWeather when the Space has OPENWEATHER_API_KEY; identical stub shape otherwise), GET /satellite/analysis?district=&locale= and POST /soil/analyze {location,locale} — preview stubs returning valid fromJson shapes (weather_forecast.dart:31, satellite_analysis.dart:23, soil_analysis.dart:25)

4. Keep ApiClient (lib/core/network/api_client.dart:18) as-is — it returns Result<T>, maps 401->UnauthorizedException. LLM layer is hosted in the cloud: POST /advise -> 200 {"advice":null} (server.py:303), POST /chat -> 200 {"reply":null} (server.py:371), only POST /assistant/chat -> 502 (server.py:486) — all treat as "LLM temporarily unavailable, retry later". Retry pattern: first detect after a cold restart may exceed receiveTimeout — retry once.

5. Verify: flutter pub get, then curl https://hodoly163-krishibondhu-api.hf.space/health and the curl examples in 4.2-4.6, then flutter run --dart-define-from-file=env/prod.json and scan a leaf photo -> expect disease/severity/confidence.

Deliver: patched providers.dart files + env/prod.json. Do not change ApiClient baseUrl source, do not commit KrishiBondhuVision/.env.
````

He just attaches this file and pastes the block — no extra explanation needed.
