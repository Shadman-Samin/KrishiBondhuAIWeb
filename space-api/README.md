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

FastAPI backend serving the app-compat REST endpoints for the KrishiBondhu
Flutter app (and the web app's native API). Interactive docs: `/docs`.

- `POST /disease/detect` (+ `/predict`) - crop-disease detection (KrishiDrishti-11X, auto-downloaded from `hodoly163/krishibondhu-jktk`)
- `POST /assistant/chat`, `/chat`, `/chat/stream` - bilingual AI advisor
- `GET /market/prices` (+ `/market-prices`, history) - live retail prices
- `GET /weather/forecast`, `POST /soil/analyze`, `GET /satellite/analysis` - weather/soil/satellite compatibility layer
- `GET /health`, `GET /` - readiness and landing page

The KrishiDrishti-11X YOLO detection runs on hosted ZeroGPU (CPU emulation
fallback when GPU quota is exhausted). Full contract and behaviour notes:
`docs/API_FOR_APP.md` in the source repository.
