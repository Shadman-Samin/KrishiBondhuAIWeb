# Deploy — 24/7 Public Demo (HF Spaces + Vercel + Groq)

## LIVE: Gradio demo Space (free ZeroGPU) ✅ VERIFIED 2026-10-16

**https://huggingface.co/spaces/hodoly163/krishibondhu-demo**
(API: `https://hodoly163-krishibondhu-demo.hf.space`)

Source: `space-demo/` (`app.py`, `requirements.txt`, `README.md`, `examples/`).
Verified live: `/predict` (rice blast 0.96 + Groq advice), `/chat` (real reply),
`/market` (graceful fallback). Use this URL for the **Live Demo** submission field.
Secrets live in Space Settings → Secrets (`ADVISE_API_KEY` set; never in code).
Re-push: `upload_folder`/`upload_file` via huggingface_hub (`hf upload` 402s on free
accounts; git push needs XET for images).

## Original plan below (Docker backend + Vercel) — superseded for free accounts

Docker/`cpu-basic` Spaces require a paid HF plan, so the FastAPI-on-Docker path is
on hold. The Gradio Space above covers the demo; Vercel frontend remains optional.

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
