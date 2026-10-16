# Submission Notes — KrishiBondhu AI (PentaFarmers)
Copy each section into the matching portal text field. Every section clears its
minimum (verified by `KrishiBondhuVision/scripts/audit_submission.py`).

---

## 1. Prompt Strategy Text (5 pts)

System-first prompting with role grounding: every LLM call opens with a system message
that fixes identity ("KrishiBondhu AI", never the base model), audience (Bangladeshi
farmers), language (English/Bengali label), and output contract (advise = strict
`{"en","bn"}` JSON, no fences). Retrieval grounds generation: `_chat_messages()` and
`/advise` inject RAG passages (Contextual RAG + graph neighbours) as silent background
context the model must use but never quote back. Chain-of-thought is structured, not
freeform: the agent loop runs intent → retrieve → advise → verify nodes with a trace,
and temperature is routed by task (0.3 advise for consistency, 0.5 agent, 0.7 chat for
warmth). Few-shot behaviour is encoded as rules, not examples: greeting mirroring
(salam→salam, hi→hi), garden-vs-field scoping (never assume rice farmer), safe-dose
refusal for garden plants, and the Shadman Samin easter egg gated behind direct asks
only. History is capped at 12 turns and the local path uses `continue_assistant_turn`
with a forced assistant turn so small models stream reliably; the hosted path drops
the hack and uses standard OpenAI-compatible calls.

## 2. Token Optimization Notes (≥50 chars)

History capped at 12 messages; detections truncated to top-3; RAG injects max 2
passages; silent context is summarized (district weather + top-5 prices only);
GZip middleware (500B floor); advice temps low to shorten outputs; `/health` stays
lightweight (no inference); market/weather responses cached (daily / 10-min TTL).

## 3. AI-DLC Process Notes (≥100 chars)

We follow a Spec-Kit + Cursor Rules style AI development lifecycle: feature specs in
`docs/` (MASTER_PROMPT, SUBMISSION_NOTES, ACCESS_NOTE) precede code; repo conventions
in `AGENTS.md` act as persistent Cursor-style rules (single-origin API, lazy model
load, inert API key, lint exceptions); `scripts/` holds eval harnesses
(`eval_accuracy.py`, `stage_eval.py`) run before merging model changes; `MASTER_PROMPT.md`
is the one-prompt system definition with approve-gated execution; verification is
evidence-first (TestClient checks on `/health`, `/admin/*`, RAG retrieval, MCP stdio)
before any completion claim; Cline-style memory lives in `AGENTS.md` + README so any
agent resumes with full context.

## 4. Agent / Orchestration Notes (≥80 chars)

`api/agent/loop.py` runs a bounded decision loop: intent node classifies the turn
(market/disease/weather/general), retrieve node calls the RAG store (top-2 + graph
boost), advise node reuses the shared `_chat()` backend (hosted/local), verify node
rejects empty/echo replies. The trace (node outputs) returns with every
`POST /agent/run` response for debugging. Market tools are shared between the MCP
server and the in-process loop (one implementation, two callers). Max one retrieve +
one verify pass keeps small-LLM latency predictable.

## 5. Fine-Tuning / Adaptation Notes (≥80 chars)

Our vision backbone is a domain-adapted YOLO model (`jktk_x.pt`, 116 crop-disease
classes, conf=0.25, imgsz=640) trained/curated for Bangladeshi crops — the detection
vocabulary is the product's core adaptation, evaluated by `scripts/eval_accuracy.py`
(including documented coverage gaps, e.g. banana sigatoka). LLM behaviour is adapted
via system-instruction tuning (identity, bilingual contracts, greeting and scoping
rules in `_chat_messages()`) rather than weight updates, plus a curated bilingual
knowledge base (`_DISEASE_KB`, RAG seed docs) that grounds outputs without retraining.
Queued: LoRA on advisory phrasing once judge feedback arrives.

## 6. Evaluation & Quality Methods (≥80 chars)

`scripts/eval_accuracy.py` measures YOLO top-1 accuracy with explicit coverage-gap
accounting; `stage_eval.py` + `test_yolo.py` gate model swaps. LLM quality is checked
by scripted probes: RAG retrieval precision (rice-blast query must hit `rice_blast`
chunks — verified 0.45+ cosine), identity-leak probes (model must say KrishiBondhu AI),
easter-egg gating probes (no unprompted reveal), JSON-contract validation on `/advise`
replies, and SSE stream completion (`[DONE]`) checks. `/admin/stats` token counters
track cost per endpoint; FastAPI TestClient smoke-tests `/health`, `/admin/*`, and
route registration before every milestone claim.

## 7. Guardrails / Safety / Privacy (≥80 chars)

Input: multipart image size handled by streaming reads; chat history filtered to
user/assistant roles with content required; per-IP rate limits (30/min) on
`/predict`, `/chat`, `/chat/stream`, `/agent/run` (429 + retry-after). Output: system
prompt forbids inventing pesticide doses for garden plants (safe general guidance
only), forbids base-model disclosure, gates personal details behind playful refusal,
and confines answers to the asked question (no assumed rice-farmer preamble).
PII: no user accounts stored, no chat persisted server-side (localStorage only),
admin endpoints RBAC-gated via `X-Admin-Token`, secrets in env/Space Secrets only.

## 8. Tunneling Usage Notes (≥80 chars)

Dev/public-preview path: `ngrok http 8000 --domain=surgery-glowworm-lumpish.ngrok-free.dev`
via `start-dev.bat` (single origin through FastAPI :8000; free-tier ~1 Mbps + interstitial
expected). Cloudflare Tunnel is the documented fallback (`cloudflared tunnel --url
http://localhost:8000`). Production (competition demo) retires tunnels: frontend on
Vercel + backend Docker on HF Spaces/Render, with an UptimeRobot cron on `/health`
warming cold starts. Tunnel notes stay truthful: ngrok = dev, cloud hosts = judging.

## 9. Data Quality Measures (≥80 chars)

DAM market scrape (`api/market.py`) merges bilingual `?L=E`/`?L=B` marquees by row
order with regex parsing, daily cache + rolling `market_history.json` snapshots, and
static `market-prices.json` fallback when the source is unreachable. Validation:
rows require crop + numeric price + unit; malformed rows drop (never 500); history
endpoint validates crop/days params. YOLO eval scripts exclude out-of-vocabulary
classes explicitly instead of silently scoring them. RAG seed docs mirror the curated
`_DISEASE_KB` so retrieval and API advice can never contradict.

## 10. Privacy & Compliance Notes (≥80 chars)

No accounts, no server-side chat storage, no tracking cookies; district/weather context
is per-request and never logged with identity (audit log stores path + status + IP
only, 500-event ring). Uploaded crop images are processed in-memory and never saved.
Secrets (`ADVISE_API_KEY`, `OPENWEATHER_API_KEY`, `ADMIN_TOKEN`) live in `.env` (local,
gitignored) or host Secret stores, never in code or logs. CORS locked to the Vercel
origin in production. Bengali farmer advisories include safe-use wording; chemical
recommendations defer to local extension officers where dosage is uncertain.

## 11. Lineage & Observability Notes (≥80 chars)

Every request passes audit middleware (method + path + status into a 500-event ring,
`GET /admin/audit`); counters per endpoint and token-usage estimates (chars/4) served
by `GET /admin/stats`. Agent runs return node traces (`POST /agent/run` → intent,
retrieve docs, advise length, verify verdict). Data lineage: DAM scrape → daily cache
→ history snapshots → API rows → RAG/chat context, each stage timestamped
(`updated_at`, snapshot dates). GZip + request logs aid latency triage; LangSmith/
Phoenix tracing hooks are stubbed at the `_chat()` boundary for post-competition
wiring. UptimeRobot pings `/health` for availability history.
