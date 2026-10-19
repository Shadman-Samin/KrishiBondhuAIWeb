---
title: KrishiBondhu API - App Backend
emoji: 🌱
colorFrom: green
colorTo: indigo
sdk: gradio
app_file: app.py
pinned: false
short_description: App-compat REST backend - detect, chat, market, weather
---

# KrishiBondhu API - App Backend

FastAPI backend (same code as `KrishiBondhuVision/api`) serving REST endpoints for app
integrators and the separately maintained Flutter client. Interactive docs: `/docs`.

- `POST /disease/detect` (+ `/predict`) - crop-disease detection (KrishiDrishti-11X, auto-downloaded from `hodoly163/krishibondhu-jktk`)
- `POST /assistant/chat`, `/chat`, `/chat/stream` - bilingual AI advisor (hosted Groq)
- `GET /market/prices` (+ `/market-prices`, history) - DAM retail prices; degrades to a
  shipped dated dataset (`sources:["dataset"]`) instead of failing when the source is down
- `GET /weather/forecast`, `POST /soil/analyze`, `GET /satellite/analysis` - weather is
  live (OpenWeather); soil/satellite are preview stubs carrying a `_note`
- `GET /admin/stats`, `/admin/audit` - token-gated (`X-Admin-Token`); `403` without it
- `GET /health`, `GET /` - readiness (also loads the model) and landing page

The KrishiDrishti-11X YOLO detection runs on hosted ZeroGPU (CPU emulation
fallback when GPU quota is exhausted). Rate limits (30/min/IP) apply only to
`/predict`, `/chat`, `/chat/stream`, `/agent/run`. Full contract and behaviour
notes: `docs/API_FOR_APP.md` in the source repository.
