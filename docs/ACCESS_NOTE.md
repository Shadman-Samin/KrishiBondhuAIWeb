# Access Note — for judges

- Live Demo URL (field): the public site. No login required; all features work anonymously.
- If the backend is cold (free-tier sleep), `/health` returns `ok:false` for ~30–60s
  while the YOLO model loads — wait and retry; the UI shows a "waking up" state.
- Admin endpoints (optional review): `GET /admin/stats`, `GET /admin/audit`.
  Open when `ADMIN_TOKEN` is unset; if set, request the demo token from the team.
- Mobile app compat routes (`/disease/detect`, `/assistant/chat`, `/market/prices`,
  `/weather/forecast`) accept the same demo host.
- Repro locally: `KrishiBondhuVision/.venv` + `uvicorn api.server:app --port 8000`,
  `KrishiBondhuWeb`: `bun install && bun dev` (needs LM Studio on :1234 for chat,
  or set `ADVISE_URL` + `ADVISE_API_KEY` for hosted LLM).
