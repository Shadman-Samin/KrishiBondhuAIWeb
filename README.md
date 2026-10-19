# KrishiBondhu AI

> **Bangladeshi farming assistant** — crop disease detection, bilingual AI advisor (English/Bengali), weather, soil, market prices, and crop calendar. Built by **Team PentaFarmers**.

## Live demo (24/7)

| Piece | URL |
|---|---|
| **Web app** (frontend + AI dashboard) | <https://krishibondhu-ai-web.vercel.app> |
| **AI demo Space** (vision model + advisor) | <https://hodoly163-krishibondhu-demo.hf.space> |

Seed the Space's live "predict a photo" examples or the Vercel app end-to-end (disease → advisory → chat → market). Free-tier hosting: the Space sleeps after ~48 h of inactivity and takes a minute or two to wake — first request just needs a retry.

---

## What it does

- **Disease detection** — upload a crop photo; the **KrishiDrishti-11X** vision model (Ultralytics YOLO, 116 disease/health classes across ~30 crops) returns bounding boxes + confidence, then a hosted LLM turns detections into farmer-friendly, bilingual action steps.
- **AI advisor chat** — bilingual streaming chat that silently consumes your selected district's weather and today's national market prices to ground its answers.
- **Weather** — district-level forecasts (OpenWeather).
- **Market prices** — live daily national prices from Bangladesh's Department of Agricultural Marketing (DAM), with price-history charts and a static offline fallback.
- **Soil info + crop calendar** — per-crop, per-season guidance.
- **Bilingual by default** — every screen and every AI output is available in English and Bengali.

---

## Architecture

```
                      PRODUCTION (24/7)
     ┌────────────────────────────────────────────────┐
     │  Vercel  —  TanStack Start SSR web app         │
     │  https://krishibondhu-ai-web.vercel.app        │
     └───────────────┬────────────────────────────────┘
                     │ browser calls the AI Space directly (@gradio/client)
                     ▼
     ┌────────────────────────────────────────────────┐
     │  Hugging Face Spaces  —  Gradio app            │
     │  • KrishiDrishti-11X detection (GPU, with auto │
     │    CPU fallback under free-tier quota limits)  │
     │  • hosted LLM advisor + chat (Groq free tier)  │
     │  • bilingual outputs (EN + BN)                 │
     └────────────────────────────────────────────────┘

                      LOCAL DEVELOPMENT
     ┌────────────────────────────────────────────────┐
     │  start-dev.bat  →  FastAPI  (:8000) + ngrok    │
     │  same model + local LLM (LM Studio) + market   │
     │  scrape + app-compat endpoints + MCP server    │
     └───────────────┬────────────────────────────────┘
                     ▼
     ┌────────────────────────────────────────────────┐
     │  frontend  —  bun dev (:8080) or node serve.mjs│
     └────────────────────────────────────────────────┘
```

The frontend speaks to **two interchangeable backend modes** (`VITE_BACKEND`):

- `space` — calls the Gradio Space directly (what production uses; needs no local backend).
- `fastapi` — same-origin calls to the local FastAPI backend (full-featured dev mode).

No backend URLs are hard-coded; origins come from env only.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [TanStack Start](https://tanstack.com/start) + React 19 + Vite 8 + Tailwind CSS 4, shadcn/Radix UI, Recharts, react-markdown |
| AI vision | Ultralytics YOLO11x fine-tune, **KrishiDrishti-11X**, 116 classes — [HF model](https://huggingface.co/hodoly163/krishibondhu-jktk) |
| AI advisor | Any OpenAI-compatible LLM endpoint — hosted Groq in production, LM Studio locally |
| Backend (local mode) | Python FastAPI + MCP server (market tools over Stdio/SSE) + n8n DAM scrape workflow |
| Hosting | Vercel (web) · Hugging Face Spaces (AI) · ngrok (local dev tunnel) |
| Live data | DAM market prices · OpenWeather forecast |
| Package/runtime | Bun, Node, Python 3.10 |

---

## Project structure

```
KrishiBondhuAIWeb/
├── KrishiBondhuWeb/      # TanStack Start frontend (Vercel root)
│   ├── src/routes/       # landing + dashboard pages
│   ├── src/lib/          # API clients: space-client.ts (Space) / model-api.ts (FastAPI)
│   └── src/data/         # crops, diseases KB, market fallback, weather
├── KrishiBondhuVision/   # Python FastAPI backend (local full mode)
│   ├── api/              # server, market scraper, RAG store, agent loop, admin, MCP
│   ├── models/           # jktk_x.pt (KrishiDrishti-11X weights; HF-downloaded)
│   └── scripts/          # accuracy eval + model download helpers
├── space-demo/           # the Gradio Space app (production AI backend)
├── mcp-server/           # standalone MCP market-tool server
├── docs/                 # deployment log, submission packet, pitch/script docs
└── start-dev.bat         # one-click local launcher
```

---

## Getting started

### Option A — run the frontend against the live cloud (easiest, no backend needed)

```bash
cd KrishiBondhuWeb
bun install

# .env.local:
#   VITE_BACKEND=space
#   VITE_SPACE_URL=https://hodoly163-krishibondhu-demo.hf.space
#   VITE_OPENWEATHER_API_KEY=your_openweather_key

bun run dev    # http://localhost:8080
```

### Option B — full local stack (Windows)

```bat
.\start-dev.bat
```

Builds the frontend, then starts: `node serve.mjs` (:8001, SSR) → FastAPI (:8000, model + local LLM + market) → ngrok tunnel. Requires **LM Studio** running on `127.0.0.1:1234` with an OpenAI-compatible model loaded; backend settings live in `KrishiBondhuVision/.env` (`ADVISE_URL`, `ADVISE_MODEL`, `ADVISE_API_KEY`).

### Option C — manual dev backend

```bash
cd KrishiBondhuVision
python -m venv .venv && .venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn api.server:app --port 8000
# in another terminal:
cd ../KrishiBondhuWeb && bun run build && node serve.mjs
```

The YOLO weights auto-download from Hugging Face on first run if missing.

---

## Frontend environment variables

| Variable | Purpose |
|---|---|
| `VITE_BACKEND` | `space` (production, default on Vercel) or `fastapi` (local) |
| `VITE_SPACE_URL` | Gradio Space API base URL |
| `VITE_OPENWEATHER_API_KEY` | Weather data |

Backend env (`KrishiBondhuVision/.env` or Space secrets): `ADVISE_URL`, `ADVISE_MODEL`, `ADVISE_API_KEY` (LLM endpoint + credentials); `OPENWEATHER_API_KEY`; `CORS_ORIGINS`; `ADMIN_TOKEN`. All secrets live in hosts' env/secret stores — never committed.

---

## Local API surface (FastAPI mode)

| Method & path | Purpose |
|---|---|
| `POST /predict` | Crop image → detections `{class, conf, box}` + top-1 |
| `POST /advise` | Detections → bilingual advice `{en, bn}` (RAG-grounded) |
| `POST /chat` · `POST /chat/stream` | Advisor chat (JSON / SSE) |
| `GET /market-prices` (+ `/history`) | Live DAM prices + rolling history |
| `GET /health` | Model liveness |
| `POST /agent/run` | Agentic intent→retrieve→advise→verify loop with trace |
| `GET /admin/stats` · `/admin/audit` | Token usage + audit trail (token-gated) |
| MCP | `krishibondhu-market` tools over Stdio + SSE (`mcp-server/`) |

The Gradio Space exposes the same core skills (`/predict`, chat, market) through its own API; the frontend's `space-client.ts` speaks that protocol. See `KrishiBondhuVision/docs/` and `docs/` for endpoint detail.

---

## Documentation

| Doc | Contents |
|---|---|
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Cloud deployment log + verification notes |
| [`docs/SUBMISSION_NOTES.md`](docs/SUBMISSION_NOTES.md) | Competition submission texts |
| [`docs/API_FOR_APP.md`](KrishiBondhuVision/docs/API_FOR_APP.md) | API detail for mobile-app integrators |
| [`KrishiBondhuVision/MODELS.md`](KrishiBondhuVision/MODELS.md) | Local LLM run log |
| [`mcp-server/MCP.md`](mcp-server/MCP.md) | MCP server tools |

---

## Related projects

- Mobile app — [KrishiBondhu AI app](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App) (Flutter client, separate maintainer).

## License

Proprietary — all rights reserved. The vision model is Apache/AGPL lineage via Ultralytics; see the [model card](https://huggingface.co/hodoly163/krishibondhu-jktk) for details.
