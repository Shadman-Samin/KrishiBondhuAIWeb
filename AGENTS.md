# KrishiBondhu AI — Repository Guide

Orientation for AI agents working on this monorepo. Read this before touching code.

**Timeline context:** competition submission "Idea to Unicorn — Preliminary Submission" (International AI Builders Congress, team **PentaFarmers**) was due **Oct 31, 2026 11:59 PM GMT+6**. Judge-facing copies live in `docs/` (`SUBMISSION_NOTES.md`, `MASTER_PROMPT.md`, `PORTAL_SUBMISSION.md`).

## 1. Project overview

**KrishiBondhu AI** is a Bangladeshi farming assistant: crop disease detection, bilingual (EN/BN) AI advisor, weather, soil, market prices, crop calendar.

Monorepo layout (no root package.json — each folder is self-contained):

| Path | What | Status |
|---|---|---|
| `KrishiBondhuWeb/` | TanStack Start web client — **Vercel rootDir**, auto-deploys on push to `main` | Active — main product |
| `space-demo/` | Gradio Space app (`app.py`) — the production AI backend for the **web** | Active — public demo |
| `space-api/` | Glue for the **app-rest** Space (`hodoly163/krishibondhu-api`): uvicorn (:7860) + private Gradio for the ZeroGPU handshake | Active — public app REST |
| `KrishiBondhuVision/` | Python FastAPI backend (full local mode: model, LLM, market, RAG, agent, admin, MCP) | Active |
| `mcp-server/` | Standalone MCP market-tool server (Stdio + SSE) | Active |
| `docs/` | Deploy log, submission packet, scripts | Active |
| `start-dev.bat` | One-click local launcher (build + SSR + FastAPI + ngrok) | Active |
| `Krsishi-Bondhu-AI-App/` | Flutter app (typo'd folder name) — separately maintained, backend migration to the API Space in progress; adds on-device TTS/STT and is included in the demo video. Local tree is a stale mock-only snapshot; don't refactor unless asked |

Git: single repo `https://github.com/Shadman-Samin/KrishiBondhuAIWeb.git` (both root and subrepos point here). KrishiBondhuWeb is also Lovable-connected.
Live: web `https://krishibondhu-ai-web.vercel.app` (Vercel project `krishibondhu-ai-web`, `prj_UykhoU0eQDsJvaAoH9tmyat2gDht`, framework `tanstack-start-lovable`) · Space `https://hodoly163-krishibondhu-demo.hf.space` (hardware `zero-a10g`, Gradio, `demo.launch(mcp_server=True)`) · API Space (app backend) `https://hodoly163-krishibondhu-api.hf.space` (hardware `zero-a10g`, Gradio-SDK mount of FastAPI via uvicorn; free tier = max 2 ZeroGPU Spaces, both used).

## 2. Architecture (dual-mode)

```
PRODUCTION (hosted)
  Vercel SSR web (krishibondhu-ai-web.vercel.app)
     browser → @gradio/client → HF Space (hodoly163-krishibondhu-demo)
        ├─ GPU YOLO predict, auto CPU fallback on quota/GPU errors
        ├─ hosted LLM (Groq) — advise (EN+BN JSON) + chat
        └─ /market DAM scrape

LOCAL (start-dev.bat)
  ngrok → FastAPI :8000 (KrishiBondhuVision)
     ├─ native API: /predict /advise /chat /chat/stream /agent/run
     │              /market-prices(+history) /admin/* /health
     ├─ app-compat: /disease/detect /assistant/chat /market/prices
     │              /weather/forecast /satellite/analysis /soil/analyze + /api/*
     ├─ static from KrishiBondhuWeb/dist/client, else proxy → SSR :8001
     └─ LLM: LM Studio :1234 (local) — mode-switched by ADVISE_HOSTED/ADVISE_URL
```

- Frontend selects backend via `VITE_BACKEND` (`space` → `src/lib/space-client.ts`, `fastapi` → same-origin `src/lib/model-api.ts`). **No absolute backend URLs in frontend code** — origins come from env (`VITE_SPACE_URL`) only.
- Vite dev (`bun dev`, :8080) proxies API paths → `http://localhost:8000` (`vite.config.ts`).

## 3. Vision model — KrishiDrishti-11X (a.k.a. `jktk_x.pt`)

Weights: `hodoly163/krishibondhu-jktk` on HF (436 MB); auto-lazy-downloaded by server/Space at startup if missing. **Verified provenance** (read from the checkpoint's embedded metadata — this is our evidence trail):

- Ultralytics **YOLO11x** (`yolo11x_optimized`, run project `plant_disease_89class`).
- Trained in **Google Colab** (paths `/content/drive/MyDrive/PlantDisease_TrainingBackup_20260501_171146/...`, device 0), **100 epochs**, batch 64, imgsz 640, AdamW lr0 0.001, AMP, mosaic+mixup 0.2+copy-paste 0.2+RandAugment.
- **Resumed** from the team's May backup run; finished **2026-05-01 22:21**.
- Datasets merged: 89-class public plant-disease base (classes 0–88) + **27 classes from Roboflow Universe `terratrendtest/planttest`** (cassava/corn/tomato field diseases = classes 89–115, matching that dataset's vocabulary exactly).
- Final val: mAP50 **0.699**, mAP50-95 **0.686**, P 0.635, R 0.682.
- Embedded license field: **AGPL-3.0 (Ultralytics)** — the HF model card was corrected to AGPL-3.0 (the Apache-2.0 label was wrong). UF/Ultralytics code not ours; our code is our own.
- Known coverage gap: no *banana sigatoka* class (`eval_accuracy.py` excludes it explicitly).

Inference settings: `conf=0.25`, `imgsz=640`. Space loads it **plain** (`YOLO(_model_path)`): a previous `.to("cuda")` init under ZeroGPU's virtual CUDA stub made CPU inference return garbage (both examples → "corn rust 0.50"); after the plain-load fix, CPU output == GPU exactly (e.g. rice_blast 0.96). Never reintroduce `.to("cuda")` on this path.

## 4. KrishiBondhuVision (FastAPI backend)

Python 3.10 venv at `KrishiBondhuVision/.venv/`. Run:
```
.venv\Scripts\python.exe -m uvicorn api.server:app --host 127.0.0.1 --port 8000
```

### Key files
- `api/server.py` — whole backend. Lazy model load (`hf_hub_download` fallback). `/health` **calls the loader** (`get_model()`), so the first call after a restart waits for the weights; it returns `{ok:false…}` only if loading fails.
- `api/rag/` — semantic chunking + Contextual RAG (context-prefixed passages) + TF-IDF cosine store + light Graph RAG (crop→disease→treatment multi-hop boost); injected silently into `/advise` + `/chat` (top-2 passages).
- `api/agent/` — `POST /agent/run` loop: intent → retrieve → advise → verify, returning the node trace; bounded to one retrieve + one verify pass.
- `api/admin.py` — `GET /admin/stats` (per-endpoint counters + token estimates) and `/admin/audit` (500-event ring), RBAC via `X-Admin-Token` (`ADMIN_TOKEN`; open when unset). The API Space has it **set** → `403` without the header.
- `api/market.py` — DAM homepage-marquee scrape (bilingual `?L=E`/`?L=B`, merged by row order, regex, no session needed), daily cache; history in `market_history.json` (written **only** on live scrapes). **Never 500s:** live → last-good in-memory → shipped dataset `KrishiBondhuWeb/src/data/market-prices.json` (or `MARKET_STATIC_FILE`; 8 crops, dated) → `[]`; `/market-prices` reports which via `sources`, and static rows carry `source:"dataset"`. No second live feed (TCB/community tracker) — add here when reachable.
- `.env` (never commit): `ADVISE_URL`, `ADVISE_MODEL`, `ADVISE_API_KEY`, `ADVISE_HOSTED`, `KRISHI_API_KEY`, `OPENWEATHER_API_KEY`, `ADMIN_TOKEN`, `CORS_ORIGINS`, `HF_MODEL_REPO`, `MARKET_STATIC_FILE`.

### LLM modes
- **Hosted (production):** `ADVISE_URL=https://api.groq.com/openai/v1`, `ADVISE_MODEL=openai/gpt-oss-20b`, key in Space Secrets. `llama-3.3-70b-versatile` is NOT usable on Groq's free tier (403).
- **Local (dev):** LM Studio `:127.0.0.1:1234/v1`, model `qwen3.5-4b-uncensored-hauhaucs-aggressive`. Local path uses `continue_assistant_turn: True` + a `" response"` assistant turn to force reliable streaming; hosted path uses standard calls. Ollama runbook (Qwen2.5 3B / Llama 3.2 3B / DeepSeek-R1 7B eval-only) in `KrishiBondhuVision/MODELS.md`.

### Endpoints
| Method & path | Purpose |
|---|---|
| `POST /predict` | multipart `file` → `{detections:[{class,conf,box}], top}` |
| `POST /advise` | `{detections, top, disease}` → `{advice:{en,bn}\|null}` (RAG-grounded, temp 0.3) |
| `POST /chat` / `POST /chat/stream` | `{messages, lang, context}` → `{reply}` / SSE (`data: {…}\n\n`, ends `data: [DONE]`) |
| `GET /health` | `{ok, model, classes}` |
| `GET /market-prices` (+`/history?crop=&days=`) | live rows / rolling points |
| `POST /agent/run` | agentic loop + trace |
| `GET /admin/stats` · `/admin/audit` | token-gated RBAC |
| `POST /disease/detect` (+`/api/…`) | app REST-compat (any client, incl. the separately maintained Flutter app) |
| `POST /assistant/chat` (+`/api/…`) | app chat |
| `GET /market/prices` aliases, `/weather/forecast`, `/satellite/analysis`, `/soil/analyze` | app compat (weather live via OpenWeather; satellite/soil are stubs carrying `_note`) |
| `GET /{path}` | catch-all static/SSR proxy |

Middleware: CORS via `CORS_ORIGINS` (default `*` — that is the live Space's setting), GZip (min 500 B), per-IP rate limits (30/min) on `/predict /chat /chat/stream /agent/run` only, audit middleware.

### Chat behaviour (system prompt in `_chat_messages()`; Space twin in `space-demo/app.py`)
- Identity: **"KrishiBondhu AI"** — never reveal base model/company (both paths).
- Easter egg: only when directly asked, reveal developer **Shadman Samin**, software engineering student from Bangladesh — brief, playful, those facts only; playful refusal for further personal details.
- Rules: concise, no assumed rice-farmer context, safe-general pesticide guidance for garden plants, greeting mirroring, ≤150-word answers on Space path (max_tokens 1024).
- Prompt-coaching only, not enforced — the 4B slips occasionally; fix regressions in `_chat_messages()` (and/or an output censor).

## 5. Gradio Space API contract (`space-demo/app.py`)

- `/predict(img)` → **3 outputs** `(summary, advice_en, advice_bn)` — one LLM call requesting strict `{"en","bn"}` JSON (max_tokens 1024, knowledge-base fallback on bad JSON). `/"predict"` api-name wraps `predict_any`: try GPU (`@spaces.GPU(duration=30)`) → auto-fallback `predict_cpu` on quota/GPU errors.
- Hidden `/predict_cpu` API (`api_name="predict"` on the cpu event). `cache_examples=False` mandatory (persisted Gradio cache re-used stale quota stubs). Blocks: JPG/PNG examples live; chat (+history, context-folded into one message, max ~6 turns), market, hidden cpu api. `demo.launch(mcp_server=True)` → Space **is** an MCP server too.
- **Sync rule:** any change to the Space's `/predict` signature MUST be mirrored in `KrishiBondhuWeb/src/lib/space-client.ts` (and vice versa) — they share no schema library; keep them honest.
- **Updating the Space:** use Python API from the venv —
  ```python
  from huggingface_hub import upload_file  # hf CLI 'upload' 402s, broken; upload_file works
  upload_file(path_or_fileobj='space-demo/app.py', path_in_repo='app.py',
              repo_id='hodoly163/krishibondhu-demo', repo_type='space')
  ```
- Free-tier behaviour: ZeroGPU per-visitor daily quota (error text "You have exceeded your ZeroGPU runs limit"), ~48 h sleep + 1–2 min cold wake. UI copy: retry/wake/quota messaging via `describeFailure` in `space-client.ts`.

### App-rest Space (`hodoly163/krishibondhu-api`) — `space-api/`

- Purpose: plain REST for app integrators — a separately maintained Flutter client connects to it (`/disease/detect`, `/assistant/chat`, `/market/prices`, `/weather/forecast`, `/health`, natives `/predict` `/chat` …). Client contract + cold-start/rate-limit ledger: `docs/API_FOR_APP.md`.
- Architecture: `space-api/app.py` = `import spaces` first, then **force `GRADIO_SERVER_NAME/PORT=127.0.0.1/7861` *before* `import gradio`** (Gradio reads `http_server.INITIAL_PORT_VALUE` at import; HF exports `GRADIO_SERVER_PORT=7860`, and Gradio 6 serves its SPA as the front door via `GET /` / `GET /{page}` — so the REST API cannot be mounted inside the Gradio app). uvicorn owns the public `:7860` and serves `api/server.py`'s FastAPI; Gradio is launched privately on `:7861` in a daemon thread **only** to satisfy ZeroGPU, which reports its `@spaces.GPU` functions from inside `gr.Blocks.launch()` (otherwise: "No @spaces.GPU function detected during startup"). A `GET /` landing page is inserted at position 0 of `srv.app.router.routes` so it isn't swallowed by the server's catch-all. `get_model` is proxied: `.predict` wrapped in `@spaces.GPU(duration=30)` with plain CPU-emulation fallback on quota/GPU errors.
- Verified live (2026-10-20): `/health` → `{"ok":true,"model":"jktk_x.pt","classes":116}`; `/predict` and `/disease/detect` return detections; `/market/prices` returns rows (DAM live when reachable, otherwise the shipped dated dataset with `sources:["dataset"]`); `/weather/forecast` is live (no `_note`); `/docs` is Swagger; `/assistant/chat` (EN + BN), `/chat` and `/advise` return real Groq replies; `/admin/*` = 403 bare / 200 with the token. Import order matters: the Gradio launch (ZeroGPU report) is started **before** importing `api.server`, otherwise startup intermittently fails with "No @spaces.GPU function detected during startup".
- Deploy: stage `space-api/` glue + `KrishiBondhuVision/api/` (no `__pycache__`) + `data/market-prices.json` into a temp dir → `HfApi().upload_folder(folder_path=..., repo_id='hodoly163/krishibondhu-api', repo_type='space', delete_patterns=['__pycache__/*','**/__pycache__/*','**/*.pyc'])`. Space `requirements.txt` is torchless (ZeroGPU image ships torch 2.13.0; our pin would drag the CUDA wheel).
- Secrets (Space settings): `ADVISE_API_KEY`, `ADVISE_URL=https://api.groq.com/openai/v1`, `ADVISE_MODEL=openai/gpt-oss-20b`, `OPENWEATHER_API_KEY`, `ADMIN_TOKEN` (admin routes are 403 without it) — all now set, so `/weather/forecast` is live and `/admin/*` is gated. Free tier: ≤2 ZeroGPU Spaces — both slots are now used (demo + api); delete one to make room.

## 6. KrishiBondhuWeb (frontend)

TanStack Start + React 19 + Vite 8 (`@lovable.dev/vite-tanstack-config`) + Tailwind 4 + Radix/shadcn `components/ui`. Structure and build details: `KrishiBondhuWeb/README.md` (kept current). Highlights for agents:

- `lib/model-api.ts` — backend switch + FastAPI client. `lib/space-client.ts` — Gradio adapter (per-lang advice cache `lastSpaceAdvice {en,bn}`, `composeMessage` folds `formatContext` + last ~6 turns into one `/chat` message, `withRetry` 4 s backoff ×1, `shortCause`/`describeFailure` for quota vs wake copy).
- Routes: `__root.tsx`, `index.tsx` (landing), `dashboard.tsx` (LangProvider gate), `dashboard/*` (index, weather, soil, disease, chat, crop-calendar, marketplace, settings).
- Marketplace fetches `/market-prices` (or Space) with a dated dataset fallback → demo-safe offline; the price-history chart only fills in `fastapi` mode (the Space has no history endpoint). Chat page streams — render **only** `choices[0].delta.content`; the stream also carries the model's private `delta.reasoning` (most chunks). Disease page appends the real failure cause (≤140 chars) to error copy, bilingual.
- ESLint: pre-existing errors in `i18n.tsx`, `dashboard/index.tsx`, `dashboard/marketplace.tsx` — leave them.
- **TanStack version skew** breaks SSR (`MISSING_EXPORT`): `router`/`start`/vite-plugin must move together (aligned at router 1.170.44 / start 1.169.2 / plugin 1.168.46; commit `7486f21`).

## 7. Running & deploying

**Production** = Vercel (auto-deploy on push to `main`) + **two** HF Spaces (demo + api; update via `upload_file`/`upload_folder`). Vercel envs: `VITE_BACKEND=space`, `VITE_SPACE_URL`, `VITE_OPENWEATHER_API_KEY`. Space secrets: Groq `ADVISE_API_KEY`, `OPENWEATHER_API_KEY`, `ADMIN_TOKEN`. Deployment history/change-log: `docs/DEPLOY.md`.

**Docs map (keep in sync):** `README.md` = public overview · `AGENTS.md` = agent rules · `docs/API_FOR_APP.md` = app REST contract (verified) · `docs/DEPLOY.md` = deploy log · `docs/PORTAL_SUBMISSION.md` + `docs/SUBMISSION_NOTES.md` = competition text · `docs/ACCESS_NOTE.md` = judge access · `docs/YOUTUBE_SCRIPT.md` / `docs/PITCH_OUTLINE.md` / `docs/FIGMA_PLAN.md` = presentation · subrepo READMEs = per-folder detail.

**Local**: `start-dev.bat` — kills ports 8000/8001/8080/4040 + `ngrok.exe`, builds web (fails fast), starts `node serve.mjs` (:8001) → FastAPI (:8000) → ngrok (`http 8000 --domain=surgery-glowworm-lumpish.ngrok-free.dev`), waits for `/health`, opens URL. LM Studio must be running for AI features. Free-ngrok: ~1 Mbps + one-time interstitial — expected.

## 8. Agent conventions & gotchas

- **Git**: never force-push published history; commit only when the user asks; never rebuild Lovable-managed files casually. `KrishiBondhuWeb/src/routeTree.gen.ts` is generated — don't hand-edit; if a build dirties it, revert it unless the route change is intentional.
- **Docs truth**: any behavioural claim in `docs/` must match code or a live probe — stale claims (CORS lock, streaming uploads, `/health` free, live-only market, n8n in production) are listed in `docs/PORTAL_SUBMISSION.md` §4.
- **PowerShell**: `$pid` reserved; use `$procId`. `Start-Process -FilePath "bun"` fails (shim) — use `C:\Users\PC\AppData\Roaming\npm\node_modules\bun\bin\bun.exe`.
- **Secrets**: `KRISHI_API_KEY` is **inert** (auth removed, header ignored) but stays in `.env`, never committed; Groq key in Space Secrets; OpenWeather key on Vercel + `.env.local`. Never log or commit any `.env` value. Public README/docs must NOT advertise that auth was removed.
- **Public-repo hygiene** (`README.md` root = limited info): no base-model IDs or easter egg detail there — internal names only live here and in `KrishiBondhuWeb/README.md`.
- **Eval/verification**: `scripts/eval_accuracy.py` (top-1 w/ coverage-gap accounting, documented gaps e.g. banana sigatoka), `stage_eval.py`, `test_yolo.py` gate model swaps; scripted probes: RAG precision (rice_blast hit ≥0.45 cosine), identity-leak probes, JSON-contract checks, SSE `[DONE]` checks; `audit_submission.py` audits submission char-minima. Verification is evidence-first before any completion claim.
- **Space deploy necessity**: frontend changes need push (Vercel auto-build). Space changes need `upload_file` + wait for the Space to finish rebuilding.
