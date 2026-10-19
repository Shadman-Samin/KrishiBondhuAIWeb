# Portal Submission Packet — KrishiBondhu AI (PentaFarmers)

Copy-paste sheet for the *International AI Builders Congress* → "Idea to Unicorn —
Preliminary Submission". Every claim maps to real code/checkpoints (evidence in
`docs/SUBMISSION_NOTES.md`, `docs/DEPLOY.md`, and the model card).

> **Workflow gate:** the portal only lets you add **links after the first "Save Draft"** —
> fill the Story fields → Save Draft → then add Demo/YouTube links.

---

## 1. Required Story fields

### Project Name
```
KrishiBondhu AI
```

### Elevator Pitch
```
KrishiBondhu AI turns a phone camera into a plant pathologist for Bangladesh's
smallholders. Snap a crop photo and get bilingual (Bangla + English) disease
detection with treatment advice in seconds — backed by KrishiDrishti-11X, a
116-class YOLO11x model we trained on merged public crop-disease datasets —
plus a RAG-grounded AI chat advisor wired to live district weather and daily
national market prices from the Department of Agricultural Marketing. The whole
product runs 24/7 on free cloud tiers: Vercel + Hugging Face, with automatic
CPU fallback when free GPU quotas run out.
```

### Public Summary
```
KrishiBondhu AI is a bilingual farming assistant for Bangladesh: crop disease
detection, an AI advisor, weather, soil guidance, a crop calendar, and live
market prices. Detection is powered by KrishiDrishti-11X (Ultralytics YOLO11x,
116 disease/health classes across 30+ crops, recorded validation mAP50 ≈ 0.70),
and every result comes with farmer-friendly advice generated twice — English
and Bengali — grounded by retrieval (RAG) over a curated agronomy knowledge
base, the farmer's district weather, and current DAM market prices. The advisor
chat streams in both languages, and the marketplace renders live DAM prices
with history charts and an offline fallback. The team of five (PentaFarmers)
built AI-native: a single spec prompt bootstrapped the product, agents executed
the worktree with AGENTS.md as persistent memory, and every claim above is
machine-verifiable — eval scripts, scripted accuracy/identity/RAG-precision
probes, and a checkpoint that embeds its own training record.
```

### Problem Statement
```
Bangladeshi smallholders lose yield to crop diseases they cannot identify in
time. Diagnosis normally requires an agronomist, and rural farmers rarely reach
one before the disease spreads. The AI tools that do exist are English-first
and trained mostly on laboratory-condition leaf images, so answers don't match
Bangladesh's field realities or its language. At the same time, the information
that decision actually needs — weather, current market prices, season/treatment
knowledge — is scattered across places a farmer can't easily reach in one
place, in a language they can't always read. There is no single, bilingual,
free place where a farmer can go from "my crop looks sick" to "here is what to
do, and here is whether selling now makes sense."
```

### Solution Description
```
KrishiBondhu AI is one bilingual assistant covering that whole journey.

1. Disease detection (browser → Hugging Face Space): the farmer uploads a crop
   photo; KrishiDrishti-11X, a YOLO11x detector we resumed-trained in Google
   Colab on an 89-class public plant-disease dataset merged with the 27-class
   Roboflow "planttest" field dataset (cassava/corn/tomato), returns bounding
   boxes and confidence across 116 disease/health classes. It runs on a free
   ZeroGPU with an automatic CPU fallback so limited quota/GPU errors never
   break the demo.
2. Bilingual advice (one LLM call): detections plus top-1 flow to a
   Groq-hosted open LLM that must answer in strict {"en","bn"} JSON — so a
   Bangali/English toggle renders instantly, with a knowledge-base fallback
   when JSON format drifts.
3. Advisor chat (streaming): asks anything in Bangla or English; each message
   is folded with silent context — the user's district weather (OpenWeather),
   today's national prices, and top RAG passages from a curated bilingual
   agronomy KB (semantic chunking + contextual prefixes + a crop→disease→
   treatment graph boost).
4. Marketplace: DAM prices scraped daily bilingually (EN/BN marquee merge),
   history charts fed by the local backend's daily snapshots, and an honest
   fallback to the shipped dated dataset when the source is unreachable.
5. Local/research mode: the same skills run locally via FastAPI + LM Studio,
   with an agentic /agent/run loop (intent → retrieve → advise → verify, with
   node trace), an admin stats/audit console, and an MCP server exposing
   market tools — the research layer of the product.
```

### Data & AI Provenance
```
Everything about the model and data is disclosed on public, checkable pages.

VISION MODEL — KrishiDrishti-11X (checkpoint jktk_x.pt, HF repo
hodoly163/krishibondhu-jktk): we trained (continued) this detector ourselves;
the Ultralytics checkpoint embeds the full training record verifiably:
trained in Google Colab on GPU, project "plant_disease_89class", resumed from
our own May-2026 Drive backup run, 100 epochs, batch 64, imgsz 640, AdamW
lr 0.001, AMP, mosaic + mixup 0.2 + copy-paste 0.2 + RandAugment; finished
2026-05-01 22:21 UTC with recorded validation mAP50 0.699 / mAP50-95 0.686 /
P 0.635 / R 0.682. Training data = an 89-class public plant-disease dataset
plus the 27 classes of Roboflow Universe dataset "terratrendtest/planttest"
(cassava/corn/tomato field diseases), merged into 116 classes. Known coverage
gaps are documented in our eval scripts (e.g. no banana sigatoka class).
License: trained with Ultralytics tooling — AGPL-3.0 applies, and we label the
model card accordingly.

DATA STACK: weather from OpenWeather API (key server-side/client env only);
market prices scraped daily from the Bangladesh Department of Agricultural
Marketing public site (bilingual EN/BN marquee pages merged by row order,
regex-parsed, validated, cached daily, with rolling JSON snapshots in
market_history.json; static fallback provided when the source is unreachable);
chat/advice is grounded by a curated bilingual agronomy knowledge base
(RAG passages + embedded disease KB). No personal data is stored: uploads are
processed in memory and never saved, chat stays client-side, no accounts, no
tracking. Secrets live only in host secret stores (Vercel env vars, Hugging
Face Space secrets); the public repo documents none of them.
Build-time LLMs (ChatGPT, Claude, Gemini, GLM, Qwen 3.5, Muse Spark 1.3)
assisted coding/specs; runtime LLMs are a Groq-hosted open model (production)
and a Qwen 3.5 4B served locally in LM Studio (dev) — the chat persona is
"KrishiBondhu AI", never the base model's brand.
```

### Tooling & IDE
```
VS Code (primary editor) + Cursor (AI-assisted edits) + opencode (terminal AI
agent driving the repo with AGENTS.md as persistent rules/memory) + Claude
Code + OpenAI Codex for agentic coding sessions + Lovable for the TanStack web
UI scaffold (Vercel-connected rebuilds). AI provenance detail: images reviewed
in the repo, specs in docs/, every change committed with evidence-first gates
(build + scripted accuracy/identity/RAG probes + submission audits before any
claim of completion).
```

### Demo / Live Links (after first Save Draft)
```
Web app: https://krishibondhu-ai-web.vercel.app
AI Space (direct): https://hodoly163-krishibondhu-demo.hf.space
App REST API (direct): https://hodoly163-krishibondhu-api.hf.space (docs: /docs · health: /health)
GitHub repo: https://github.com/Shadman-Samin/KrishiBondhuAIWeb
HF model (KrishiDrishti-11X): https://huggingface.co/hodoly163/krishibondhu-jktk
```

### YouTube Video
- Script: `docs/YOUTUBE_SCRIPT.md` (3–5 min, one take, shot-listed).
- Paste URL when uploaded (title suggestion: "KrishiBondhu AI — bilingual Bangla/English farming assistant — Idea to Unicorn").

---

## 2. AI Detail Usage (AI Depth Score map)

| Portal section | What we claim (selections + paste text) | Why it's true |
|---|---|---|
| **Prompt Usage +10** | System-first role grounding (identity/audience/contract), retrieval as silent context, structured chain path in the agent loop, temperature routed by task (0.3 advise / 0.7 chat), few-shot behaviour encoded as rules (greeting mirroring, safe-dose scoping, gated easter egg); prompts iterate in MASTER_PROMPT.md → AGENTS.md as versioned prompts. | SUBMISSION_NOTES §1; system prompts in `api/server.py` + `space-demo/app.py`. |
| **Token Optimization +10** | Text: history capped at 12 messages; detections truncated to top-3; RAG injects max 2 passages; live facts summarized client-side (district + weather + top-5 prices); market/weather cached (daily TTL / 10 min); Space `composeMessage` folds context+history into one call (fewer round trips); `/health` returns counts only (no inference), though it does trigger the one-time model load. Tools to tick: **Structured outputs / JSON mode**, **Sliding-window / context trimming**, **Rolling summary memory**, **Cheap-model routing**. | `api/server.py`, `space-client.ts`. |
| **LLMs / Models +15** | Tick: **ChatGPT**, **Claude**, **Gemini**, **Qwen**, and **Add** others: **Muse Spark 1.3** (+ "Codex ChatGPT" note in the free-text). Paste: ChatGPT/Codex + Claude + Gemini + GLM + Muse Spark drove spec→code; Qwen 3.5 4B runs locally (LM Studio) as the dev runtime; production runs a Groq-hosted open model via OpenAI-compatible API. | User-confirmed history; AGENTS.md LLM modes. |
| **How & why we used these LLMs +5** | "Spec-first: a single spec prompt (MASTER_PROMPT) defined the product; chat models generated/refactored modules; we gated every model change with scripted evals (accuracy probes, JSON-contract checks, SSE [DONE], identity-leak probes) — small local models for affordability + privacy in dev, hosted model for production reliability." | Model swap gating in repo scripts. |
| **Retrieval & RAG +12** | Tick: **Contextual RAG**, **Variable / Semantic Chunking**, **Graph RAG**, **Agentic RAG**, **Naive RAG** (cap counts 4×3=12). Details text: TF-IDF cosine over semantically chunked, context-prefixed KB passages; light crop→disease→treatment graph for multi-hop boost; top-2 passages injected silently into /advise + /chat; the agent loop classifies intent then retrieves. | `api/rag/`, `api/agent/`. |
| **MCP Usage +20** | "We built and/or used MCP servers/clients" ✓. Paste: we **built two**: (1) standalone `mcp-server/` — `krishibondhu-market` tools (`get_market_prices`, `get_price_history`, `get_health`) exposed over **Stdio and SSE**; (2) the production demo **Space itself is an MCP server** (`demo.launch(mcp_server=True)` → `/gradio_api/mcp`) exposing predict/chat/market tools. Used by local agent tooling to verified probes. | `mcp-server/MCP.md`, Space config. |
| **Open Source Tools & Libraries +8** | Paste: Ultralytics YOLO (vision backbone), PyTorch, FastAPI (backend), TanStack Start (SSR web), Recharts (charts), Gradio (@gradio/client), Hugging Face hub/Spaces (hosting + weights), n8n (DAM pipeline), plus the MCP SDK — each described with its role. | README structure. |
| **Agent Frameworks & Orchestration +7** | Custom orchestration: `api/agent/loop.py` runs intent → retrieve → advise → verify with node trace, bounded to one retrieve + one verify pass for predictable latency. No export framework claim. | `api/agent/`. |
| **Fine-tuning / Adaptation +5** | Domain adaptation = a fine-tuned/resumed YOLO11x detector on merged public crop-disease datasets (documented above); LLM behaviour adapted by system instructions + curated KB; no LoRA (explicit). | checkpoint metadata; SUBMISSION_NOTES §5. |
| **Evaluation & Quality +7** | Paste: `eval_accuracy.py` top-1 accuracy with explicit coverage-gap accounting; `stage_eval.py`/`test_yolo.py` gate model swaps; scripted LLM probes: RAG precision (rice-blast query must hit target chunks ≥0.45 cosine), identity-leak probes, JSON contract checks, SSE [DONE]; `/admin/stats` token counters; a 35-dimensional submission audit. | `scripts/`, SUBMISSION_NOTES §6. |
| **Guardrails, Safety & Privacy +6** | Per-IP rate limits (429 + retry-after) on heavy endpoints; uploads processed in-memory (never stored); no accounts/PII/tracking; admin endpoints token-gated (RBAC); outputs must not invent pesticide doses (safe-general guidance); brand-hardening (no base-model disclosure); secrets only in host secret stores; CORS configurable via `CORS_ORIGINS` (public demo uses the permissive default so the separate Flutter client can call it). | SUBMISSION_NOTES §7/§10. |
| **Frontend AI (+1 each, max 5)** | **Lovable** (guaranteed — Vercel project is Lovable-connected); optionally **Cursor Composer** if you used Cursor's agent for the web UI — confirm before ticking. | Vercel/AGENTS. |
| **Workflow Automation (+1 each, max 4, n8n +2)** | **n8n** — we authored an import-ready n8n workflow for DAM ingestion (`docs/n8n-dam-scrape.json`: EN+BN fetch → validate → snapshot append). The shipped production scrape runs in-process (`api/market.py`), so describe it as workflow tooling, not as a live n8n deployment. | `docs/n8n-dam-scrape.json` (`active:false` template). |
| **Local / On-device LLMs (max 8)** | Runtime tick: **LM Studio** (+1). Models: **Qwen 3.5 4B** (+2). Do NOT tick Ollama (runbook only, never run). Paste: "LM Studio serves an OpenAI-compatible endpoint locally for the full dev path; production swaps to hosted Groq via the same API shape (env-switched, no code change). Ollama is documented as a runbook, not a verified run." | `MODELS.md` (truthful log: only LM Studio + Qwen verified). |
| **Agentic Frameworks Used** | None of the listed frameworks — custom in-house orchestration (state it; don't tick untruthful options). | `api/agent/`. |
| **AI-DLC frameworks** | Tick **AGENTS.md spec** ✓ (our repo guide IS the spec). Only additionally tick "Cursor Rules + PRD workflow" if .cursor rules were actually used — confirm. Process notes: MASTER_PROMPT.md (single spec prompt) → AGENTS.md persistent memory → docs-first features → eval gates → evidence-first claims. | AGENTS.md itself. |

### "Anything else about your AI usage?" (free text)
```
Additive honesty: every accuracy/feature claim on our public homepage maps to a
measured number or a documented fallback; our submission copies live in the
repo (docs/PORTAL_SUBMISSION.md) where judges can diff marketing vs. reality.
The demo survives free-tier failure modes on purpose: CPU fallback restores
detection when ZeroGPU quota runs out, and static market fallback keeps the
marketplace honest offline.
```

---

## 3. Data Lifecycle & Engineering (checkbox map)

1. **Data Sources** — tick: Public Web (scraping) · External APIs (paid/free) · Open Datasets · User Uploads/Bulk Import · Internal (own app data). NOT: IoT, Partner, Synthetic.
2. **Acquisition** — tick: API Pull / SDK integrations · Automated Flows (n8n, cron) · MCP Servers for data access · Scrapers/crawlers (regular `urllib`+regex marquee scrape — we did not use Playwright/Scrapy, so prefer the plain "Scrapers / crawlers used" option).
3. **Parsing, Formats & Cleaning** — tick formats: JSON · HTML · Markdown · Images (+ YAML if judges count config, else skip). Text: regex marquee parse + row-order merge for bilingual DAM feeds; strict JSON schemas for detections/advice; market rows require crop+price+unit or are dropped (never 500); YOLO eval excludes out-of-vocabulary classes explicitly.
4. **Storage** — tick: Cache / KV. (No SQL/vector/graph database — the TF-IDF store and JSON snapshots are filesystem/in-memory. **Be honest — judges like a lean lifecycle.**)
5. **Visualization** — tick: Recharts. Details: price-history charts, bilingual labels.
6. **Insights** — tick: Deep Learning (PyTorch) · LLM Inference / RAG over data · Rule Engine / Heuristics · Statistical Analysis. (No classical-ML credit claimed beyond the detector itself.)
7. **Pipelines & Orchestration** — tick Orchestration: n8n + cron-style daily cache; Scheduling: daily market snapshot.
8. **Outbound** — tick Outbound APIs (REST endpoints + MCP tools as tool-calls); "Webhooks & exports": skip unless we expose one.
9. **Open Source Stack** — paste from the AI-Depth table row Open Source.
10. **Quality / Governance** — paste SUBMISSION_NOTES §9 (quality), §10 (privacy), §11 (lineage). **Fix the §11 line**: delete "UptimeRobot pings /health" — instead: "availability is judged against the live Space with CPU fallback + cache fallback; a daily DAM snapshot history is the audit record."
11. **Tunneling** — tick **ngrok** + paste §8 (ngrok dev/preview; free-tier throttle + interstitial expected; production switched to cloud hosts with CPU fallback so tunnels are dev-only now).

---

## 4. Truth-drift ledger (things NOT to claim anywhere)

- No "95% accuracy" / "top 10 crops validated by BARI" — use mAP50 0.699 (in-checkpoint) or the homepage's verified-facts cards.
- No invented testimonials (removed from the landing page in commit `11a30eb`).
- No voice claims (roadmap), no satellite monitoring claims (roadmap), no uptime-robot claims.
- No LoRA; no vector DB (TF-IDF store is keyword-sparse, not embeddings); Ollama listed as runbook only.
- SUBMISSION_NOTES §8/§11 corrected to Gradio-Space wording (UptimeRobot/Docker lines updated).
- No "CORS locked to the Vercel origin" (default is `*`; `CORS_ORIGINS` can lock it, but the live demo does not).
- No "streaming uploads" (uploads are read into memory), and no "`/health` is free" (it triggers the model load).
- No "live-only market prices": when DAM is unreachable the API returns the dated shipped dataset (`sources:["dataset"]`). Never claim the fallback numbers are today's.
- No "n8n runs the pipeline": the n8n file is an inactive template; production ingestion is `api/market.py`.
- No "agent framework" (no LangGraph): `api/agent/loop.py` is a custom bounded loop.
- No "price-history charts in production": the production web runs against the Space, which has no history endpoint, so charts fill in only in local `fastapi` mode.
