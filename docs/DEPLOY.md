# Deploy — 24/7 Public Demo (HF Spaces + Vercel + Groq)

## LIVE: App-compat REST backend Space (free ZeroGPU) ✅ 2026-10-19

**https://huggingface.co/spaces/hodoly163/krishibondhu-api**
(API: `https://hodoly163-krishibondhu-api.hf.space`)

Serves the Flutter app's expected REST shapes (`/disease/detect`,
`/assistant/chat`, `/market/prices`, `/weather/forecast`, `/health`, ...).
Glue: `space-api/` in this repo. `app.py` forces `GRADIO_SERVER_NAME/PORT=127.0.0.1/7861`
*before* `import gradio` (Gradio reads the port at import; HF exports
`GRADIO_SERVER_PORT=7860`, and Gradio 6 serves its SPA as the front door, so the
API cannot be mounted inside the Gradio app), then runs uvicorn on the public
`:7860` serving `api/server.py`. Gradio is launched privately on `:7861` in a
daemon thread purely to satisfy ZeroGPU (it reports its `@spaces.GPU` functions
from inside `gr.Blocks.launch()`; without it the Space dies with "No @spaces.GPU
function detected during startup"). `get_model` proxy → `@spaces.GPU` with
CPU-emulation fallback; requirements torchless (ZeroGPU image provides torch 2.13.0).

Verified live 2026-10-19: `/health` → `{"ok":true,"model":"jktk_x.pt","classes":116}`,
`/predict` + `/disease/detect` → detections, `/market/prices` (live DAM scrape),
`/weather/forecast`, `/` landing page and `/docs` Swagger. `/assistant/chat` is
`502 Connection refused` until the Groq secrets below are pasted into the Space.

Deploy: assemble `space-api/` glue files + `KrishiBondhuVision/api/` (minus
`__pycache__`) into a staging dir → `HfApi().upload_folder(..., repo_type='space')`.
Secrets on the Space: `ADVISE_API_KEY`, `ADVISE_URL=https://api.groq.com/openai/v1`,
`ADVISE_MODEL=openai/gpt-oss-20b` (hosted LLM); optional `OPENWEATHER_API_KEY`
(makes `/weather/forecast` real). Ledger of behaviour: `docs/API_FOR_APP.md` §2.

## Previous: Gradio demo Space (free ZeroGPU) ✅ VERIFIED 2026-10-16

**https://huggingface.co/spaces/hodoly163/krishibondhu-demo**
(API: `https://hodoly163-krishibondhu-demo.hf.space`)

Source: `space-demo/` (`app.py`, `requirements.txt`, `README.md`, `examples/`).
Verified live: `/predict` (rice blast 0.96 + Groq advice), `/chat` (real reply),
`/market` (graceful fallback). Use this URL for the **Live Demo** submission field.
Secrets live in Space Settings → Secrets (`ADVISE_API_KEY` set; never in code).
Re-push: `upload_folder`/`upload_file` via huggingface_hub (`hf upload` 402s on free
accounts; git push needs XET for images).

## Original plan below (Docker backend + Vercel) — solved differently for free accounts

Docker/`cpu-basic` Spaces require a paid HF plan (verified: `request_space_hardware`
→ `402 ... Without a PRO subscription, you can't downgrade this Space to cpu-basic`),
but the REST backend runs on the **free ZeroGPU tier** with a private Gradio
handshake + uvicorn (section above). The original Docker notes are kept only as
reference.

## Frontend → Vercel, powered by the Space (✅ LIVE 2026-10-16)

- **Site:** https://krishibondhu-ai-web.vercel.app (`krishibondhu-ai-web`, root `KrishiBondhuWeb/`)
- Fixes applied via Vercel MCP: `rootDirectory=KrishiBondhuWeb` (was building monorepo root → vite 127),
  `@tanstack/react-start` XSS CVE bump (1.169.2), TanStack alignment (router 1.170.44 / plugin 1.168.46).
- Env: `VITE_BACKEND=space` + `VITE_SPACE_URL=https://hodoly163-krishibondhu-demo.hf.space` (production + preview).
- `KrishiBondhuWeb/src/lib/space-client.ts` (@gradio/client) mirrors `model-api.ts`:
  disease+advice, chat (non-streaming degrade), market table parsing.
- `VITE_BACKEND=space` + `VITE_SPACE_URL` switches the whole site to the Space; default `fastapi` keeps local/ngrok intact.
- Parsers unit-verified; `bun run build` green locally AND clean-room; Vercel deploy READY.
- 2026-10-17 chat-context fix: `space-client.ts` folds live weather/market + recent
  history into the Space message (Space `/chat` takes a single message); Space `app.py`
  chat `max_tokens` 512→1024 + ≤150-word instruction (Bengali answers were cut mid-sentence);
  `VITE_OPENWEATHER_API_KEY` added to Vercel env (was local-only). Verified live with the
  Dhaka guava question in en + bn: uses real 31°C/78% facts, complete 2-day-away plan.
- 2026-10-18 bilingual guidance fix: Space `/predict` now returns 3 outputs
  (summary, advice_en, advice_bn) from ONE LLM call (JSON en/bn, KB fallback); client
  caches both → UI language toggle re-renders instantly, no refetch, no DOM-lang guess.
  Verified live: rice_blast → English + Bengali advice, distinct strings.
- 2026-10-18 ZeroGPU quota fix: visitors get a small daily GPU run quota; when it runs
  out the Space now auto-falls back to CPU (`predict_any` catches the allocation error;
  hidden `predict_cpu` api for probes). Model loads plain (`YOLO(path)`, no init
  `.to("cuda")`) — the caffeinated-virtual-CUDA stub gave garbage CPU detections
  (both examples → "corn rust 0.50"); after the fix CPU matches GPU exactly
  (rice blast 0.96, tomato blight 0.63). `cache_examples=False` stops example-gallery
  views from burning visitor quota. Works forafa: ~4-6 s CPU roundtrip incl LLM.
- No Vercel MCP connected yet — deploy is click-ops until `vercel` appears in MCP resources after `opencode mcp auth vercel`.

## 1. Backend → Hugging Face Spaces (Docker, CPU Basic, free)

1. huggingface.co → New Space → SDK **Docker**, visibility Public, port **7860**.
2. Push the contents of `KrishiBondhuVision/` (`Dockerfile`, `api/`, `requirements.txt`).
   The 436MB YOLO model is NOT pushed — it auto-downloads from `HF_MODEL_REPO` on
   first request (lazy load; `/health` returns `ok:false` = waking, retry).
3. Space Settings → Secrets, add:
   | Secret | Value |
   |---|---|
   | `ADVISE_URL` | `https://api.groq.com/openai/v1` |
   | `ADVISE_MODEL` | `openai/gpt-oss-20b` (verified working on Groq) |
   | `ADVISE_API_KEY` | your `gsk_...` key (paste here, nowhere else) |
   | `OPENWEATHER_API_KEY` | your OpenWeather key |
   | `CORS_ORIGINS` | `https://<your-app>.vercel.app` (after step 2) |
4. Verify from public internet: `GET /health` → `ok:true`, then `POST /predict`,
   `POST /chat`, `POST /agent/run`, `GET /market-prices`.

## 2. Frontend → Vercel (free hobby)

1. Import the repo, root directory `KrishiBondhuWeb/` (`vercel.json` handles the rest).
2. Env var: `VITE_MODEL_API_URL=https://<your-space>.hf.space` → rebuild/redeploy.
3. Verify: disease upload → advice, chat streams, marketplace loads.

## 3. Keep it warm + submit

- UptimeRobot: HTTP monitor on `<space>/health` every 10 min (free-tier sleep = 30–60s
  first-load; UI shows "waking up" retry).
- Record the video on the LIVE url (`docs/YOUTUBE_SCRIPT.md`), publish Figma
  (`docs/FIGMA_PLAN.md`), submit on cloudcampbd.com by Oct 31, 11:59 PM GMT+6.

## Rollback

Anything red → local path still works: `start-dev.bat` (LM Studio `:1234` + ngrok).
Setting `ADVISE_HOSTED=false` forces the legacy LM Studio streaming path.
