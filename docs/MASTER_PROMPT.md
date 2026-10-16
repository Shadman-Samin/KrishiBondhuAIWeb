# MASTER PROMPT — KrishiBondhu AI (Idea to Unicorn, Zero to Launch)
Single comprehensive prompt. Execute once; afterwards only: "Click to approve",
"Click to continue", "Click to proceed", "Yes" / "Continue", "Deploy".

---

**1. Core Product & AI.** Build KrishiBondhu AI, a bilingual (English/Bengali) Bangladeshi farming assistant
for smallholders and extension officers. Demo persona: Rahim, rice farmer, Naogaon,
low-bandwidth Android, speaks Bangla. Core journeys: (1) upload crop photo → YOLO
disease boxes + confidence → bilingual action steps; (2) chat advisor streaming with
district weather + market prices as silent context; (3) marketplace with live DAM
prices + history charts; (4) weather/soil/crop-calendar pages. Stack: FastAPI +
Ultralytics YOLO (`jktk_x.pt`, 116 classes) backend, TanStack Start + React 19 +
Tailwind frontend, same-origin API, LM Studio locally / Groq hosted for LLM.

**2. Data Architecture.** Schemas: Detection{class,conf,box}, Advice{en,bn},
MarketPrice{crop,cropBn,price,min,max,date,unit}, ChatMessage{role,content}.
Pipelines: DAM bilingual marquee scrape → validate → daily cache →
`market_history.json` snapshots → `/market-prices` API → RAG/chat context.
Vector store: in-memory TF-IDF cosine over semantically chunked, context-prefixed KB
passages (`api/rag/`), plus crop→disease→treatment graph for multi-hop boost.

**3. Admin Module.** In-memory audit ring (500 events), per-endpoint counters,
token-usage estimates, per-IP rate limits on heavy endpoints (`api/admin.py`);
`GET /admin/stats` + `/admin/audit` RBAC-gated by `X-Admin-Token` (open when unset
for dev). Analytics dashboard + settings in the web app; user management via demo
tokens documented in ACCESS_NOTE.md.

**4. Security Module.** No accounts/PII stored; images processed in-memory, never
saved; chat client-side only; secrets in env/Space Secrets; CORS locked to Vercel
origin in prod; rate-limit 429s; output guardrails (no invented garden-plant doses,
no base-model disclosure, gated easter egg, scoped answers).

**5. Documentation Module.** README (features, architecture, env, run, deploy),
`docs/API_FOR_APP.md` (Flutter compat), `mcp-server/MCP.md`, `MODELS.md` (local LLM
log), `n8n-dam-scrape.json`, Figma (wireframes + architecture), YouTube demo,
OpenAPI at `/docs` (FastAPI auto).

**6. Audit Reporting.** Audit middleware logs every request; token tracking in
`/advise` + `/chat`; agent traces on `/agent/run`; eval scripts (`eval_accuracy.py`,
`stage_eval.py`) gate model changes; `audit_submission.py` checks char floors +
artifact presence before submit.

**7. Presentation & Pitch Deck.** `PITCH_OUTLINE.md` (10 slides: problem → ask),
`YOUTUBE_SCRIPT.md` (2–3 min), `FIGMA_PLAN.md`, tagline + value prop in README.

**8. Deployment.** `KrishiBondhuVision/Dockerfile` (uvicorn :7860, HF auto-download,
lazy YOLO), `vercel.json` frontend, `.env.example` secrets map, UptimeRobot `/health`
cron, `start-dev.bat` retained for local dev only. Env-driven CORS/APP_SERVER_URL/
WEB_DIST/YOLO knobs; hosted-vs-local LLM switch via `ADVISE_HOSTED`.

After generating all modules, stop and wait. Only proceed on: "Click to approve",
"Click to continue", "Click to proceed", "Yes" / "Continue", or "Deploy".
