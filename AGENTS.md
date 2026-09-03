# KrishiBondhu AI — Repository Guide

Orientation for AI agents working on this monorepo. Read this before touching code.

## 1. Project overview

**KrishiBondhu AI** is a Bangladeshi farming assistant. It offers crop disease detection, an AI chat advisor (English/Bengali), plus weather, soil, market price, and crop-calendar info.

This is a monorepo of three independent sub-projects plus a Windows launcher:

| Path | What | Status |
|---|---|---|
| `Krsishi-Bondhu-AI-App/` | Flutter mobile app (note the typo in the folder name) | **NOT developed — abandoned/deprecated. Do not work on it.** |
| `KrishiBondhuWeb/` | User-facing website + dashboard | Active — main product UI |
| `KrishiBondhuVision/` | Python FastAPI backend (AI) | Active — runs the model + chat |
| `start-dev.bat` | One-click launcher (builds web, starts everything, opens tunnel) | Active |

There is no package.json / root build system at the monorepo root — each folder is self-contained.

## 2. Architecture map

```
Browser / visitor
   │  https://surgery-glowworm-lumpish.ngrok-free.dev  (ngrok, free tier)
   ▼
FastAPI  (:8000)  KrishiBondhuVision
   ├─ API routes natively:  /predict /advise /chat /chat/stream /health
   ├─ static files from  KrishiBondhuWeb/dist/client/assets  (served directly)
   └─ other HTML routes → forward to SSR app :8001
                        ▼
              KrishiBondhuWeb SSR app  (node serve.mjs, :8001)
                        ▼
              LM Studio  (:1234)  — local LLM for chat/advise (must be running)
```

- **Everything shares ONE public origin** (`:8000` via ngrok). The web client calls the API **same-origin** (relative paths) — it never hard-codes `:8000` URL. Free ngrok = one hostname, so web + API must stay on the same origin. Do not reintroduce absolute `:8000` URLs in the frontend.
- Vite **dev mode** (`bun dev`, :8080) proxies `/predict /advise /chat /health` → `:8000` via `vite.config.ts` `server.proxy`.

## 3. KrishiBondhuVision (backend, Python)

Python 3.10 venv at `KrishiBondhuVision/.venv/`. Run with:
```
.venv\Scripts\python.exe -m uvicorn api.server:app --host 127.0.0.1 --port 8000
```

### Key files
- `api/server.py` — the entire backend (single file).
- `models/jktk_x.pt` — YOLO model, **116 classes**, loaded at import (`ultralytics.YOLO`).
- `.env` — config (never commit): `ADVISE_URL` (LM Studio `/v1`), `ADVISE_MODEL`, `KRISHI_API_KEY`.
  > `KRISHI_API_KEY` is **inert** — API-key auth was removed; the header is ignored. The `.env` value must stay secret, but no request requires it.
- `scripts/` — eval scripts (`eval_accuracy.py`, `eval_fetch.py`, `stage_eval.py`, `test_yolo.py`) and `fetch_test_images.py` (downloads test images).

### Endpoints (`api/server.py`)
| Method & path | Purpose |
|---|---|
| `POST /predict` | Upload image (`file` multipart) → YOLO detections: `{detections:[{class,conf,box}], top}` |
| `POST /advise` | JSON `{detections, top, disease}` → LLM returns `{advice:{en,bn}}` |
| `POST /chat` | JSON `{messages, lang, context}` → `{reply}` |
| `POST /chat/stream` | Same as `/chat`, SSE stream (`data: {...}\n\n`, ends `data: [DONE]`) |
| `GET /health` | Liveness: `{ok, model, classes}` |
| `GET /market-prices` | Live daily national prices from DAM (market.dam.gov.bd): `{updated_at, sources, rows:[{crop,cropBn,min,max,price,change_pct,date,unit}]}`. Cached daily |
| `GET /market-prices/history` | `?crop=&days=` → `{points:[{date,price}]}`. Seeded from `market-prices.json`, then accumulates a daily snapshot |
| `GET /{path}` | Catch-all: serves static file from `KrishiBondhuWeb/dist/client` if present, else proxies to the SSR app on `:8001` (503 if unreachable) |

Market data lives in `api/market.py` (DAM homepage marquee scrape — no session/CSRF needed; bilingual `?L=E`/`?L=B`, merged by row order). History is appended to `KrishiBondhuVision/market_history.json`. `ponytail:` second live feed (community tracker/TCB/gov open data) is unplugged — add a fetcher in `market.py` when a reachable independent source appears.

Middleware: CORS (`*`/`*`/`*`) + `GZipMiddleware` (min 500 bytes). Chat calls LM Studio with `continue_assistant_turn: True` and a `" response"` assistant turn to force streaming.

### Chat behaviour (system prompt in `_chat_messages()`)
- Identity: **"KrishiBondhu AI"** — if asked which AI model, it says it is **KrishiBondhu AI**. It must **never** mention the underlying base model/company.
- **Easter egg**: only if directly asked ("who made you", "is there an easter egg") it reveal that the developer is **Shadman Samin**, a software engineering student from Bangladesh — brief, playful, mysterious, and **only those facts**. No email, phone, CGPA, university, socials, or project list. Pressure for personal/contact details → playful "classified / trade secret" refusal.
- Rules: concise answers, don't assume rice farmer, safe/general pesticide guidance for garden plants, etc.
- These rules are prompt-coaching, **not enforced** — the 4B model slips occasionally. If leaks regress, the fix belongs in `_chat_messages()` (and/or a backend output censor).
> Internal/dependencies context (dev-only, never surface to users): the local LLM is served by LM Studio at `127.0.0.1:1234`, model `ADVISE_MODEL` = `qwen3.5-4b-uncensored-hauhaucs-aggressive` (set in `.env`).

## 4. KrishiBondhuWeb (frontend)

TanStack Start + React 19 + Vite 8 + Tailwind 4 + Radix/shadcn-style `components/ui`.

### Served two ways
- **Production (what the public sees):** `node serve.mjs` — a ~20-line node server hosting the built SSR app on `:8001`. Must build first: `bun run build` → outputs `dist/server/` (SSR bundle) + `dist/client/` (static assets). The build is not a plain static site (no `index.html` — HTML is generated by the SSR handler at runtime).
- **Dev:** `bun dev` (Vite dev server, :8080) — proxies API paths to :8000. Requires `allowedHosts: true` in `vite.config.ts` to serve through ngrok hostnames.

### Structure (`src/`)
- `routes/` — file-based routing: `__root.tsx` (providers/shell), `index.tsx` (public marketing home), `dashboard.tsx` (layout gate/LangProvider), `dashboard/*.tsx` (index, weather, soil, disease, chat, crop-calendar, marketplace, settings).
- `lib/` — `model-api.ts` (same-origin API client: `predictDisease`, `getAdvice`, `sendChat`, `streamChat`, `buildContext`, `fetchMarketPrices`, `fetchPriceHistory`; `API_URL` defaults to `""` = same origin), `weather-api.ts` (OpenWeather), `auth.tsx`, `theme.tsx`, `i18n.tsx` (en/bn), `search.ts`, `district.ts`, `utils.ts`, `api-key.ts` (dead code — kept, inert).
- `data/` — static content: `crops.ts`, `diseases.ts` (disease knowledge cards), `marketplace.ts`, `market-prices.json`, `weather.ts`.
- `components/dashboard/` — `layout.tsx`, `sidebar.tsx`, `topbar.tsx`. `components/ui/` — shadcn-style primitives.
- `vite.config.ts` — Lovable wrapper config; proxies dev API calls; do NOT add duplicate plugins (see file header).
- `.env.local` — `VITE_OPENWEATHER_API_KEY` (public client key, do not commit elsewhere).
- The marketplace page (`routes/dashboard/marketplace.tsx`) fetches live prices from `/market-prices` with a **static fallback** to `market-prices.json` when the backend/tunnel is down (keeps the site demo-safe offline).

### Build output locations
- `dist/client/` (public assets: `/assets/*`, `favicon.*`, `og-image.png`)
- `dist/server/` (SSR handler, loaded by `serve.mjs`)

## 5. Krsishi-Bondhu-AI-App (Flutter)

Flutter project (`lib/app|core|constants|features|ui|l10n`, l10n, launcher icons). **Abandoned — the user did not develop it and chose not to integrate it.** Do not spend time here unless explicitly asked.

## 6. Running & deploying

`start-dev.bat` (from `F:\KrishiBondhu`):
1. Kills ports **8000 / 8001 / 8080 / 4040** and `ngrok.exe`.
2. Builds the web app (`bun run build` in `KrishiBondhuWeb`). Fails fast on build error.
3. Starts three tabs: SSR app (`node serve.mjs`, :8001) → FastAPI (:8000) → ngrok (`http 8000 --domain=surgery-glowworm-lumpish.ngrok-free.dev`).
4. Waits for `:8000/health`, then opens the public URL.

**Requirements:**
- **LM Studio running** with the model on `:1234`, or chat/advise fail (site still loads).
- PC stays on + internet for the tunnel.
- Free-ngrok limits: ~1 Mbps transfer throttle and a one-time per-browser interstitial page (7-day cookie) — both expected, not bugs.

Rebuild is required to push frontend changes live (the public site runs the built `dist/`, not the dev server).

## 7. Agent conventions & gotchas

- **Git**: `KrishiBondhuWeb` is connected to Lovable (`KrishiBondhuWeb/AGENTS.md`). Never force-push/rebuild published history. Commit only when the user asks.
- **PowerShell**: `$pid` is a reserved read-only variable — never assign it; use `$procId` when killing by port. `Start-Process -FilePath "bun"` fails (`bun.ps1` shim); use `C:\Users\PC\AppData\Roaming\npm\node_modules\bun\bin\bun.exe`.
- **Lint**: pre-existing eslint errors in `i18n.tsx`, `dashboard/index.tsx`, `dashboard/marketplace.tsx` — leave them; don't "fix" casually.
- **Secret**: `KRISHI_API_KEY` in `KrishiBondhuVision\.env` — never log or commit.
- **Architecture rule**: single public origin via :8000; web calls API same-origin; keep `vite.config.ts` proxy + `serve.mjs` honest with each other (API paths: `/predict /advise /chat /chat/stream /health /market-prices`).