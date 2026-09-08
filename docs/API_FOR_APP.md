# KrishiBondhu API — Flutter App Integration Guide

Share this file with the Flutter app developer. Everything works same-origin through one public host (free-ngrok single-origin constraint).

## 1. Base URL

| Env | Base URL | Notes |
|-----|----------|-------|
| **Production (ngrok)** | `https://surgery-glowworm-lumpish.ngrok-free.dev` | All web + API traffic via FastAPI `:8000` → ngrok. PC must stay on with `start-dev.bat` running. First visit per browser shows a 7-day interstitial — expected (`AGENTS.md`). |
| **Local** | `http://127.0.0.1:8000` | Run `KrishiBondhuVision/.venv/Scripts/python.exe -m uvicorn api.server:app --host 127.0.0.1 --port 8000`. Also need SSR on `:8001` for web HTML routes, but API works standalone. |

**Flutter config:** `lib/core/config/app_env.dart:14` reads compile-time `API_BASE_URL`:

```json
// env/dev.json — local
{ "API_BASE_URL": "http://127.0.0.1:8000", "ENV": "dev", "NETWORK_LOGS": "true" }

// env/prod.json — public (give this to the app dev)
{ "API_BASE_URL": "https://surgery-glowworm-lumpish.ngrok-free.dev", "ENV": "prod", "NETWORK_LOGS": "false" }
```

`env/` is git-ignored and does not exist yet — create it first:

```bash
mkdir env
# then create env/dev.json and env/prod.json with the JSON above
```

Run with:
```bash
flutter run --dart-define-from-file=env/prod.json
flutter build apk --dart-define-from-file=env/prod.json
```

`ApiClient` is already wired: `lib/core/network/api_client.dart:109` creates `Dio(baseUrl: AppEnv.apiBaseUrl)`. No other URL hard-coding needed.

## 2. Availability — read this first

This is an **on-demand dev tunnel, not 24/7**. The public host is your PC via ngrok.

- **Default: offline.** The tunnel is off. Build entirely against `*Mock` (`Krsishi-Bondhu-AI-App/GUIDE.md:57`, `lib/features/*/providers.dart`) — no server needed.
- **When you need live data:** message Shadman "start server". He runs `start-dev.bat` from `F:\KrishiBondhu` — builds web, starts SSR `:8001` + FastAPI `:8000`, opens tunnel. Ready in ~30s. Verify: `curl https://surgery-glowworm-lumpish.ngrok-free.dev/health` → `{"ok":true,"model":"jktk_x.pt","classes":116}`.
- **If you get `503`, connection refused, or timeout:** tunnel is off — ping again.
- **Interstitial:** free-ngrok shows a one-time per-browser interstitial page (7-day cookie) — expected, not a bug (`AGENTS.md`). If `Dio` hits it, set `browserHeader: ngrok-skip-browser-warning` or just open the URL once in a browser to clear it.
- **Chat/Advise** require LM Studio on the host at `127.0.0.1:1234` (`KrishiBondhuVision/.env: ADVISE_URL`): `POST /advise` → `200 {"advice":null}` (`api/server.py:303`), `POST /chat` → `200 {"reply":null}` (`api/server.py:371`), only `POST /assistant/chat` (+`/api/assistant/chat` `api/server.py:486`) → `502 {"detail":...}` on LLM down. All are graceful — treat as "retry after ping".
- **When live is not needed:** keep `ENV=prod` but you can stay on mocks — zero penalty.

## 3. Auth / Headers

- **No auth required.** `KRISHI_API_KEY` in `KrishiBondhuVision/.env` is inert — auth was removed. Do not send `X-API-Key`. `AuthInterceptor` (`lib/core/network/interceptors/auth_interceptor.dart:12`) exists but is dormant until an auth backend ships (`AccountController` is `null`) — no `Bearer` is sent today.
- **CORS:** `allow_origins=["*"]` (`api/server.py:54`). Works from Flutter/Dio, web, curl.
- **GZip:** responses ≥500 bytes are gzipped (`api/server.py:49`).

## 4. Endpoints

### 4.1 Health — `GET /health`

```bash
curl https://surgery-glowworm-lumpish.ngrok-free.dev/health
# {"ok":true,"model":"jktk_x.pt","classes":116}
```

### 4.2 Disease detection — `POST /disease/detect` (app-native) & `POST /predict` (web-native)

Both run the same YOLO model (`models/jktk_x.pt`, 116 classes, `conf=0.25, imgsz=640` `api/server.py:25`). The shim accepts **any** of `image`/`file`/`photo`/`picture` multipart field + optional `locale=en|bn` (form or `?locale=` query).

**Flutter path (recommended — matches `DiseaseRepository`):**
```bash
curl -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/disease/detect \
  -F "image=@leaf.jpg" -F "locale=en"
```

**Web path (also live, aliased as `/api/disease/detect`):**
```bash
curl -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/predict -F "file=@leaf.jpg"
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

For pure `/predict` style (if you prefer web shape):
```dart
final form = FormData.fromMap({'file': await MultipartFile.fromFile(path)});
final res = await dio.post('/predict', data: form);
```

### 4.3 Advise — `POST /advise` (optional, LLM follow-up to detection)

Web calls this after `/predict` to get bilingual farmer advice. Flutter can ignore if it already uses `DiseaseResult` organic/chemical fields.

```bash
curl -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/advise \
  -H "Content-Type: application/json" \
  -d '{"top":{"class":"rice blast","conf":0.94,"box":[0,0,100,100]},"detections":[{"class":"rice blast","conf":0.94,"box":[0,0,100,100]}],"disease":null}'
# {"advice":{"en":"...","bn":"..."}} or {"advice":null} on LLM error
```
Requires LM Studio running at `127.0.0.1:1234` (`ADVISE_URL` in `.env`), otherwise returns `200 {"advice":null}` (`api/server.py:303`). Only the app shim `POST /assistant/chat` (`api/server.py:486`) surfaces `502` on LLM down.

### 4.4 Chat — `POST /assistant/chat` (app) & `POST /chat` / `POST /chat/stream` (web)

**Native web:**
```bash
curl -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"How to control aphids on mustard?"}],"lang":"en","context":{"farmer":{"district":"Rajshahi","language":"English"}}}'
# {"reply":"..."}  (null on LLM down)
```
SSE stream:
```bash
curl -N -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/chat/stream -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}],"lang":"en","context":{}}'
# data: {"choices":[{"delta":{"content":"Hello"}}]}
# ...
# data: [DONE]
```

**Flutter shim — `POST /assistant/chat` (also `/api/assistant/chat`):**
```bash
curl -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How to control aphids on mustard?","locale":"en","history":[{"id":"1","role":"user","text":"hi"}]}'
# {"id":"msg-a1b2c3d4","role":"assistant","text":"..."}
```
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
curl https://surgery-glowworm-lumpish.ngrok-free.dev/market-prices
# {"updated_at":"2026-09-05","sources":["dam"],"rows":[{"crop":"Aman Rice","cropBn":"আমন চাল","price":52.5,"min":50,"max":55,"change_pct":1.2,"date":"2026-09-05","unit":"kg"}]}
# Shim GET /market/prices returns same rows mapped to {name,nameBn,emoji,category,pricePerKg,changePercent,min,max,date,unit} — extra min/max/date/unit are ignored by MarketPrice.fromJson (harmless)

curl "https://surgery-glowworm-lumpish.ngrok-free.dev/market-prices/history?crop=Aman%20Rice&days=30"
# {"crop":"Aman Rice","points":[{"date":"2026-09-01","price":51.0}, ...]}  (history: no Flutter repo yet — optional)
```

**Flutter shim — `GET /market/prices` (also `/api/market/prices`):**
```bash
curl https://surgery-glowworm-lumpish.ngrok-free.dev/market/prices
# [{"name":"Aman Rice","nameBn":"আমন চাল","emoji":"🌾","category":"Grains","pricePerKg":52.5,"changePercent":1.2,"min":50,"max":55,"date":"2026-09-05","unit":"kg"}, ...]
```
Returns a **bare list** (not an object) of `MarketPrice` (`market_repository.dart:15`, `market_price.dart:30`) with `nameFor(locale)` selecting `nameBn` when `locale==bn`. `POST /advise` and `POST /chat/stream` have no Flutter repo — Flutter uses only `POST /assistant/chat`; `/chat`/`/advise` are web paths (still live, aliased).

**Dart:**
```dart
await ref.read(marketRepositoryProvider).fetchPrices(); // swap from fetchMockPrices()
```

### 4.6 Weather / Satellite / Soil — stubs (no live backend yet)

These have no real upstream yet; stubs return a valid `fromJson` shape so the app can ship without mocks.

```bash
curl "https://surgery-glowworm-lumpish.ngrok-free.dev/weather/forecast?district=Rajshahi&locale=en"
curl "https://surgery-glowworm-lumpish.ngrok-free.dev/satellite/analysis?district=Rajshahi&locale=en"
curl -X POST https://surgery-glowworm-lumpish.ngrok-free.dev/soil/analyze -H "Content-Type: application/json" -d '{"location":"Rajshahi","locale":"en"}'
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

To make weather real, wire `api/server.py: weather_forecast_compat` to OpenWeather (key in `KrishiBondhuWeb/.env.local:VITE_OPENWEATHER_API_KEY` as reference) or BMD.

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

Test locally:
```bash
flutter pub get
flutter run --dart-define-from-file=env/prod.json
# In app: scan a leaf photo → should return Rice Blast / Late Blight with confidence
```

## 6. For the Flutter dev — give this whole file to your AI

Paste the block below into your AI along with this file. The AI will wire the app in one go.

````
You are wiring the Flutter app at Krsishi-Bondhu-AI-App/ (Riverpod + Dio) to the live KrishiBondhu backend.
Use ONLY docs/API_FOR_APP.md as source of truth. Do not guess endpoints or hardcode URLs outside AppEnv.

Base URL: https://surgery-glowworm-lumpish.ngrok-free.dev (local alt http://127.0.0.1:8000)
Availability: on-demand — tunnel is off by default. If GET /health != {"ok":true}, tell the user to ping Shadman "start server". It starts via start-dev.bat in ~30s. 503/timeout = tunnel off. Free-ngrok has a one-time per-browser interstitial (7-day cookie) — expected.

No auth. KRISHI_API_KEY is inert (KrishiBondhuVision/.env.example:3). CORS * (api/server.py:54).

Task — do all of these:

1. Create env/prod.json (env/ is git-ignored — run `mkdir env` first):
   {"API_BASE_URL":"https://surgery-glowworm-lumpish.ngrok-free.dev","ENV":"prod","NETWORK_LOGS":"false"}
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
   GET  /market/prices (also /market-prices) -> bare list for MarketPrice.fromJson; history: GET /market-prices/history?crop=&days=
   GET  /weather/forecast?district=&locale=, GET /satellite/analysis?district=&locale=, POST /soil/analyze {location,locale} — stubs that return valid fromJson shapes (weather_forecast.dart:31, satellite_analysis.dart:23, soil_analysis.dart:25) with _note stub

4. Keep ApiClient (lib/core/network/api_client.dart:18) as-is — it returns Result<T>, maps 401->UnauthorizedException. Without LM Studio :1234: POST /advise -> 200 {"advice":null} (server.py:303), POST /chat -> 200 {"reply":null} (server.py:371), only POST /assistant/chat -> 502 (server.py:486) — treat all as retry-after-ping.

5. Verify: flutter pub get, then curl https://surgery-glowworm-lumpish.ngrok-free.dev/health and the curl examples in 4.2-4.6, then flutter run --dart-define-from-file=env/prod.json and scan a leaf photo -> expect disease/severity/confidence. Keep Vite proxy synced if you touch web (KrishiBondhuWeb/vite.config.ts:20-32, 12 entries).

Deliver: patched providers.dart files + env/prod.json. Do not change ApiClient baseUrl source, do not commit KrishiBondhuVision/.env.
````

He just attaches this file and pastes the block — no extra explanation needed.


## 7. Notes for maintainer

- Single public origin invariant: web `src/lib/model-api.ts:1` uses `API_URL=""` (relative) and `KrishiBondhuWeb/vite.config.ts:20-32` proxies (12 entries). Keep shim paths in `vite.config.ts: proxy` synced (`/predict /advise /chat /health /market-prices` + `/disease /assistant /market /weather /satellite /soil /api`).
- YOLO lazy-downloads from `HuggingFace hodoly163/krishibondhu-jktk/jktk_x.pt` (`api/server.py:34-43`).
- Market cache is daily (`api/market.py:145`), history in `KrishiBondhuVision/market_history.json`.
- Chat system prompt caps history at 12 (`api/server.py:332` `CHAT_MAX_MESSAGES=12`) and enforces KrishiBondhu AI identity + easter egg (`api/server.py:344`).
- Never commit `KrishiBondhuVision/.env` (contains `KRISHI_API_KEY` inert but secret).
