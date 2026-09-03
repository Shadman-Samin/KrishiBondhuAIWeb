# KrishiBondhu AI

> **Bangladeshi farming assistant** — crop disease detection, bilingual AI chat advisor, weather, soil, market prices, and crop calendar.

Live demo (via ngrok tunnel): `https://surgery-glowworm-lumpish.ngrok-free.dev`

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Frontend Routes](#frontend-routes)
- [Build & Deployment](#build--deployment)
- [Conventions & Gotchas](#conventions--gotchas)

---

## Features

- **Disease Detection** — Upload a crop photo → YOLOv8 (`jktk_x.pt`, 116 classes) returns bounding boxes + confidence. LLM generates farmer-friendly advice in English & Bengali.
- **AI Chat Advisor** — Bilingual (English/Bengali), context-aware chat with streaming (SSE). Injects district weather + live market prices as silent context.
- **Weather** — District-wise forecast via OpenWeather API.
- **Soil Info** — Static + advisory content per district/crop.
- **Market Prices** — Live daily national prices scraped from DAM (`market.dam.gov.bd`) with daily cache + rolling history. Falls back to static `market-prices.json` when offline.
- **Crop Calendar** — Season/region-aware planting guidance.
- **Dashboard** — Protected layout with language & theme providers.

---

## Architecture

```
Browser / Visitor
        │
        │  https://surgery-glowworm-lumpish.ngrok-free.dev  (ngrok, free tier)
        ▼
┌─────────────────────────────────┐
│  FastAPI  :8000                 │  KrishiBondhuVision/api/server.py
│  ├─ API: /predict /advise       │
│  │      /chat /chat/stream      │
│  │      /health /market-prices  │
│  ├─ Static: KrishiBondhuWeb/    │
│  │        dist/client/assets/*   │
│  └─ Catch-all ─┐                │
└────────────────┼────────────────┘
                 │ proxy (if no static match)
                 ▼
        ┌──────────────────┐
        │  SSR App  :8001  │  KrishiBondhuWeb — node serve.mjs
        │  (TanStack Start │   serving dist/server/server.js)
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │  LM Studio :1234 │  Local LLM (OpenAI-compatible /v1/chat/completions)
        │  qwen3.5-4b      │  — required for /advise, /chat
        └──────────────────┘
```

**Key principle — single public origin:** Free ngrok gives one hostname, so **everything is served through `:8000`**. The web client calls the API **same-origin** (relative URLs, `API_URL = ""`). Vite dev mode proxies `/predict /advise /chat /health /market-prices` → `:8000`. Do not hard-code absolute `:8000` URLs in the frontend.

- **Production:** `node serve.mjs` (`:8001`) renders SSR HTML → FastAPI (`:8000`) serves API + static + proxies HTML → `ngrok http 8000`.
- **Dev:** `bun dev` (`:8080`, Vite) → proxies API to `:8000`.

---

## Tech Stack

### Backend — `KrishiBondhuVision/` (Python)

| Layer | Technology | Version / Details |
|-------|------------|-------------------|
| **Language** | Python | 3.10 (venv at `.venv/`) |
| **Web Framework** | [FastAPI](https://fastapi.tiangolo.com/) | `0.141.1` |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | with `httptools`, `h11`, `watchfiles` |
| **AI / Vision** | [Ultralytics YOLO](https://docs.ultralytics.com/) | `8.4.118` — model `models/jktk_x.pt` (YOLO, 116 classes, `conf=0.25`, `imgsz=640`) |
| **ML Runtime** | PyTorch + Torchvision | `torch==2.13.0`, `torchvision==0.28.0`, `opencv-python==5.0.0.93` |
| **Image Processing** | Pillow, NumPy, OpenCV | `pillow==12.3.0`, `numpy==2.2.6` |
| **Validation** | Pydantic | `2.13.4` |
| **Config** | python-dotenv | `1.2.2` — loads `KrishiBondhuVision/.env` |
| **HTTP (LLM + Market)** | stdlib `urllib.request` | No extra deps — calls LM Studio + DAM scrape |
| **Market Scrape** | Regex + `urllib` | `api/market.py` — DAM marquee parse, bilingual `?L=E`/`?L=B`, merged by row order |
| **Middleware** | `CORSMiddleware` (`*`), `GZipMiddleware` (min 500 bytes) |  |
| **Other** | `python-multipart`, `PyYAML`, `matplotlib`, `polars` | For file uploads & eval scripts |

**LLM Integration:** Calls LM Studio at `ADVISE_URL` (default `http://127.0.0.1:1234/v1`) with `continue_assistant_turn: True` + forced streaming. Model configured via `ADVISE_MODEL` (default `qwen3.5-4b-uncensored-hauhaucs-aggressive`).

### Frontend — `KrishiBondhuWeb/` (TypeScript / React)

| Layer | Technology | Version / Details |
|-------|------------|-------------------|
| **Framework** | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) | `^1.168.26` / `^1.170.16` (file-based routing, SSR) |
| **UI Library** | React + React DOM | `^19.2.0` |
| **Build Tool** | [Vite](https://vitejs.dev/) | `^8.0.16` via `@lovable.dev/vite-tanstack-config` (`^2.7.6`) |
| **SSR Server** | [Nitro](https://nitro.unjs.io/) | `3.0.260603-beta` (Cloudflare target, entry `src/server.ts`) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + `@tailwindcss/vite` | `^4.2.1` |
| **Components** | [Radix UI](https://www.radix-ui.com/) + shadcn-style `components/ui` | Accordion, Dialog, Select, Tabs, etc. |
| **State / Data** | [TanStack React Query](https://tanstack.com/query) | `^5.101.1` |
| **Forms & Validation** | React Hook Form + Zod + `@hookform/resolvers` | `^7.71.2` / `^3.24.2` |
| **Icons** | lucide-react | `^0.575.0` |
| **Charts** | Recharts | `^2.15.4` — price history graphs |
| **Markdown** | react-markdown | `^10.1.0` — chat rendering |
| **Utilities** | `clsx`, `tailwind-merge`, `class-variance-authority`, `date-fns`, `embla-carousel`, `sonner`, `vaul`, `cmdk` |  |
| **Language** | TypeScript | `^5.8.3` — strict, bundler resolution, `@/*` alias |
| **Runtime / Package Manager** | [Bun](https://bun.sh/) | `bun dev`, `bun run build` |
| **Dev Proxy** | Vite `server.proxy` | `/predict /advise /chat /health /market-prices` → `http://localhost:8000` |
| **Production Server** | `serve.mjs` (Node `http` + `dist/server/server.js`) | Port `8001`, 127.0.0.1 |

### Infrastructure & Tooling

| Tool | Purpose |
|------|---------|
| **ngrok** | Public tunnel `http 8000 --domain=surgery-glowworm-lumpish.ngrok-free.dev` (free tier: ~1 Mbps, interstitial page) |
| **LM Studio** | Local OpenAI-compatible server on `:1234` serving the LLM |
| **start-dev.bat** | One-click Windows launcher — kills ports, builds web, starts SSR + FastAPI + ngrok, waits for `/health` |
| **ESLint + Prettier** | Lint/format (`eslint`, `prettier`, `typescript-eslint`) |
| **OpenWeather API** | Weather data (`VITE_OPENWEATHER_API_KEY` in `KrishiBondhuWeb/.env.local`) |
| **DAM (market.dam.gov.bd)** | Authoritative daily market prices — no session/CSRF, scraped via regex |

---

## Project Structure

```
F:\KrishiBondhu\
├── AGENTS.md                 # Repo guide for AI agents
├── README.md                 # This file
├── start-dev.bat             # One-click launcher (build + serve + tunnel)
│
├── KrishiBondhuVision\       # Python FastAPI backend (AI)
│   ├── api\
│   │   ├── server.py         # Entire backend — all endpoints + static/SSR proxy
│   │   └── market.py         # DAM scrape, daily cache, history (market_history.json)
│   ├── models\
│   │   └── jktk_x.pt         # YOLO model (116 classes)
│   ├── scripts\              # eval_accuracy.py, eval_fetch.py, stage_eval.py, test_yolo.py
│   ├── test_images\          # mine/, eval/, annotated/
│   ├── market_history.json   # Rolling daily price snapshots (auto-generated)
│   ├── .venv\                # Python 3.10 venv
│   └── .env                  # ADVISE_URL, ADVISE_MODEL, KRISHI_API_KEY (never commit)
│
├── KrishiBondhuWeb\          # TanStack Start + React frontend
│   ├── serve.mjs             # Production SSR server (port 8001)
│   ├── vite.config.ts        # Lovable wrapper — proxy + allowedHosts
│   ├── package.json
│   ├── src\
│   │   ├── routes\
│   │   │   ├── __root.tsx        # Providers / shell
│   │   │   ├── index.tsx         # Public marketing home
│   │   │   ├── dashboard.tsx     # Layout gate + LangProvider
│   │   │   └── dashboard\        # index, weather, soil, disease, chat, crop-calendar, marketplace, settings
│   │   ├── lib\
│   │   │   ├── model-api.ts      # Same-origin API client (predictDisease, getAdvice, sendChat, streamChat, buildContext, fetchMarketPrices)
│   │   │   ├── weather-api.ts    # OpenWeather client
│   │   │   ├── auth.tsx / theme.tsx / i18n.tsx / search.ts / district.ts / utils.ts
│   │   │   └── api-key.ts        # Dead code, inert (kept)
│   │   ├── data\                 # crops.ts, diseases.ts, marketplace.ts, market-prices.json (fallback), weather.ts
│   │   ├── components\
│   │   │   ├── dashboard\        # layout.tsx, sidebar.tsx, topbar.tsx
│   │   │   └── ui\               # shadcn/Radix primitives
│   │   └── server.ts             # SSR error wrapper (Nitro entry)
│   ├── dist\                     # Build output (generated)
│   │   ├── client\               # Static assets (/assets/*, favicon.*, og-image.png)
│   │   └── server\               # SSR bundle (server.js)
│   └── .env.local                # VITE_OPENWEATHER_API_KEY
│
└── Krsishi-Bondhu-AI-App\    # Flutter app — ABANDONED, do not use
```

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Node.js** + **Bun** | Frontend build & dev. `bun` shim via npm (`C:\Users\PC\AppData\Roaming\npm\node_modules\bun\bin\bun.exe`) |
| **Python 3.10** | Backend venv at `KrishiBondhuVision/.venv` |
| **LM Studio** | Running on `127.0.0.1:1234` with model loaded — required for `/advise`, `/chat`, `/chat/stream` (site still loads without it, but AI features fail) |
| **ngrok** | CLI installed + authtoken configured |
| **OpenWeather API key** | For weather pages |

---

## Environment Variables

### `KrishiBondhuVision/.env` (never commit)

```env
ADVISE_URL=http://127.0.0.1:1234/v1
ADVISE_MODEL=qwen3.5-4b-uncensored-hauhaucs-aggressive
KRISHI_API_KEY=...  # inert — auth was removed, header is ignored, but keep secret
```

### `KrishiBondhuWeb/.env.local`

```env
VITE_OPENWEATHER_API_KEY=your_openweather_key
# Optional — defaults to "" (same-origin). Only set if API is on a different origin:
# VITE_MODEL_API_URL=http://localhost:8000
```

---

## Getting Started

### Option A — One-click (Windows, production + tunnel)

```bat
# From F:\KrishiBondhu
.\start-dev.bat
```

This will:

1. Kill ports `8000 / 8001 / 8080 / 4040` and `ngrok.exe`
2. Run `bun run build` in `KrishiBondhuWeb` (fails fast on build error)
3. Start 3 processes:
   - `node serve.mjs` → `:8001` (SSR app)
   - `uvicorn api.server:app --host 127.0.0.1 --port 8000` (FastAPI)
   - `ngrok http 8000 --domain=surgery-glowworm-lumpish.ngrok-free.dev`
4. Wait for `http://localhost:8000/health` then open the public URL

> PC must stay on + internet connected. Free ngrok = ~1 Mbps throttle + one-time interstitial per browser (7-day cookie) — expected.

### Option B — Manual (dev)

**Terminal 1 — Backend:**
```bat
cd KrishiBondhuVision
.venv\Scripts\python.exe -m uvicorn api.server:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend (Vite dev, port 8080):**
```bat
cd KrishiBondhuWeb
bun install
bun dev
# Visit http://localhost:8080 — API calls proxy to :8000
```

**Terminal 3 — (Optional) Production preview:**
```bat
cd KrishiBondhuWeb
bun run build
node serve.mjs  # :8001 — then FastAPI on :8000 will proxy HTML to it
```

**LM Studio** must be running separately on `:1234` in all cases.

---

## API Reference

Base URL: same-origin (relative paths). In dev: `http://localhost:8000`. In production: via ngrok.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness — `{ ok, model, classes }` |
| `POST` | `/predict` | Multipart `file` (image) → `{ detections: [{class, conf, box}], top }` |
| `POST` | `/advise` | JSON `{ detections, top, disease }` → `{ advice: { en, bn } \| null }` (LLM) |
| `POST` | `/chat` | JSON `{ messages, lang, context }` → `{ reply }` |
| `POST` | `/chat/stream` | Same as `/chat` — SSE stream (`data: {...}\n\n`, ends `data: [DONE]`) |
| `GET` | `/market-prices` | Live daily prices — `{ updated_at, sources, rows: [{crop, cropBn, min, max, price, change_pct, date, unit}] }` (cached 1h) |
| `GET` | `/market-prices/history?crop=&days=` | Price history — `{ crop, points: [{date, price}] }` (seeded from static JSON, then daily snapshots) |
| `GET` | `/{path}` | Catch-all — serves `dist/client/{path}` if file exists, else proxies to SSR app `:8001` (503 if down) |

**Frontend client:** `src/lib/model-api.ts` (`predictDisease`, `getAdvice`, `sendChat`, `streamChat`, `buildContext`, `fetchMarketPrices`, `fetchPriceHistory`) — all use `API_URL = import.meta.env.VITE_MODEL_API_URL || ""`.

---

## Frontend Routes

File-based routing via TanStack Router (`src/routes/`):

| Route | File | Description |
|-------|------|-------------|
| `/` | `index.tsx` | Public marketing landing page |
| `/dashboard` | `dashboard.tsx` | Layout gate (LangProvider + DashboardLayout) |
| `/dashboard` | `dashboard/index.tsx` | Dashboard home |
| `/dashboard/weather` | `dashboard/weather.tsx` | Weather by district |
| `/dashboard/soil` | `dashboard/soil.tsx` | Soil info |
| `/dashboard/disease` | `dashboard/disease.tsx` | Disease detection (upload → predict → advice) |
| `/dashboard/chat` | `dashboard/chat.tsx` | AI advisor chat (streaming) |
| `/dashboard/crop-calendar` | `dashboard/crop-calendar.tsx` | Crop calendar |
| `/dashboard/marketplace` | `dashboard/marketplace.tsx` | Market prices (live + static fallback + Recharts history) |
| `/dashboard/settings` | `dashboard/settings.tsx` | Settings |

---

## Build & Deployment

```bat
cd KrishiBondhuWeb
bun run build      # → dist/client/ + dist/server/
node serve.mjs     # serves SSR on :8001 (PORT env overrideable)
```

- Build is **not** a plain static site — no `index.html`; HTML is generated by the SSR handler at runtime.
- Production public site runs the **built `dist/`**, not the Vite dev server. Rebuild is required to push frontend changes live.
- `start-dev.bat` rebuilds automatically before launching.

**Single-origin rule:** Web calls API same-origin. Keep `vite.config.ts` proxy and `serve.mjs`/FastAPI catch-all in sync for API paths: `/predict /advise /chat /chat/stream /health /market-prices`.

---

## Conventions & Gotchas

- **Git:** `KrishiBondhuWeb` is connected to Lovable — never force-push. Commit only when asked.
- **PowerShell:** `$pid` is reserved read-only — use `$procId` when killing by port. `Start-Process -FilePath "bun"` fails (bun.ps1 shim); use the full bun exe path.
- **Lint:** Pre-existing ESLint errors in `i18n.tsx`, `dashboard/index.tsx`, `dashboard/marketplace.tsx` — leave them.
- **Secrets:** Never log or commit `KRISHI_API_KEY` or `.env` files.
- **Chat identity:** System prompt in `api/server.py:_chat_messages()` enforces identity as **KrishiBondhu AI** (never reveal base model) + easter egg for **Shadman Samin** (only when directly asked). Fix leaks in `_chat_messages()`.
- **Market data:** `api/market.py` — DAM-only. Community tracker/TCB feed is unplugged; add a fetcher there when a reachable independent source appears. History accumulates in `market_history.json`.

---

## License

Proprietary — all rights reserved. Contact the author for usage permissions.
