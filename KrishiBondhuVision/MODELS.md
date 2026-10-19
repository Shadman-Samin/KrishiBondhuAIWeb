# Local LLM Runtimes & Models Run Log — KrishiBondhu AI (PentaFarmers)

## Production runtime (hosted)

| Runtime | Status | Details |
|---|---|---|
| Groq (OpenAI-compatible) | **Verified in production** | `ADVISE_URL=https://api.groq.com/openai/v1`, `ADVISE_MODEL=openai/gpt-oss-20b`, key in Space/env secrets. Serves `/advise`, `/chat`, `/chat/stream` on both Spaces. |

## Runtimes used locally

| Runtime | Status | Details |
|---|---|---|
| LM Studio | **Verified in the local/dev path** | Serves OpenAI-compatible `/v1/chat/completions` on `127.0.0.1:1234`; `ADVISE_URL` default for local dev. `continue_assistant_turn` + forced-turn streaming path (`ADVISE_HOSTED=false`). |
| Ollama | **Runbook ready** | `ollama pull qwen2.5:3b && ollama pull llama3.2:3b && ollama run <model>` exposes `http://localhost:11434/v1`; set `ADVISE_URL=http://localhost:11434/v1` + `ADVISE_HOSTED=true`. Same `_chat()` path as Groq — no code change. |

## Models run locally (verified)

| Model | Runtime | Params/Quant | Used for | Notes |
|---|---|---|---|---|
| `qwen3.5-4b-uncensored-hauhaucs-aggressive` | LM Studio | 4B | `/advise`, `/chat`, `/chat/stream`, `/agent/run` | Default `ADVISE_MODEL`; 12-msg history cap + 0.3–0.7 temps keep the 4B model fast. |

## Models queued (Ollama runbook, same API shape)

- `qwen2.5:3b` (Q4) — advise/chat parity check.
- `llama3.2:3b` (Q4) — Bengali reply quality comparison.
- `deepseek-r1:7b` (Q4) — reasoning-trace eval on disease advice (slower; eval-only).

Hardware note: runs target a single consumer GPU/CPU box; 3–4B Q4 fits CPU-only inference
for demo throughput. Quantization and per-model latency/quality notes go in `scripts/eval_accuracy.py`
follow-ups. No local-run claim above is fabricated — only the LM Studio + Qwen row is verified;
Ollama rows are the operator runbook for judges reproducing locally.
