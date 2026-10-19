# Access Note — for judges

- Live Demo URL (field): the public site. No login required; all features work anonymously.
- Free-tier cold start: both Hugging Face Spaces sleep after ~48 h idle and take ~1–2 min
  to wake. The UI shows a "waking up / retry" state — wait and retry once. The first
  disease scan after a restart also loads the 436 MB model (~10 s when cached, up to a
  few minutes if it must re-download).
- API readiness probe: `https://hodoly163-krishibondhu-api.hf.space/health` →
  `{"ok":true,"model":"jktk_x.pt","classes":116}`. Note this call loads the model too, so
  the first one after a restart waits instead of answering instantly.
- Interactive API docs (Swagger): `https://hodoly163-krishibondhu-api.hf.space/docs`.
- App compat routes (`/disease/detect`, `/assistant/chat`, `/market/prices`,
  `/weather/forecast`) accept the same demo host; contract: `docs/API_FOR_APP.md`.
- Admin endpoints (optional review): `GET /admin/stats`, `GET /admin/audit` on the API
  Space. They are token-gated (`ADMIN_TOKEN` is set) — request the demo token from the
  team. The local dev instance leaves them open when `ADMIN_TOKEN` is unset.
- Market prices degrade honestly: when the government feed is unreachable the API returns
  the shipped dated dataset and reports `sources:["dataset"]`.
- Repro locally: `KrishiBondhuVision/.venv` + `uvicorn api.server:app --port 8000`,
  `KrishiBondhuWeb`: `bun install && bun dev` (needs LM Studio on :1234 for chat,
  or set `ADVISE_URL` + `ADVISE_API_KEY` for hosted LLM).
