"""Decision-loop implementation. All LLM calls reuse api.server._chat so the
hosted/local backend choice stays in one place."""
from __future__ import annotations


def _intent(message: str) -> str:
    m = message.lower()
    if any(k in m for k in ("price", "bazar", "market", "দাম", "বাজার")):
        return "market"
    if any(k in m for k in ("disease", "blast", "blight", "spot", "রোগ", "পোকা", "spray", "স্প্রে")):
        return "disease"
    if any(k in m for k in ("weather", "rain", "বৃষ্টি", "আবহাওয়া")):
        return "weather"
    return "general"


def run_agent(message: str, lang: str = "en", context: dict | None = None):
    """Run intent -> retrieve -> advise -> verify. Returns {reply, trace}."""
    from ..rag import retrieve as _retrieve
    from .. import server as _srv

    trace = []
    intent = _intent(message or "")
    trace.append({"node": "intent", "output": intent})

    chunks = _retrieve(message or "", top_k=2)
    trace.append({"node": "retrieve", "output": [c["doc"] for c in chunks]})

    ctx = dict(context or {})
    if chunks:
        ctx["rag_passages"] = [{"title": c["title"], "text": c["text"]} for c in chunks]
    adapted = {"messages": [{"role": "user", "content": message}], "lang": lang, "context": ctx}
    try:
        reply = _srv._chat(_srv._chat_messages(adapted), temperature=0.5, max_tokens=1024)
        text = (reply.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
    except Exception as e:
        text, trace_err = "", str(e)[:200]
        trace.append({"node": "advise", "output": f"error: {trace_err}"})
        return {"reply": None, "trace": trace}
    trace.append({"node": "advise", "output": f"{len(text)} chars"})

    # Verify: empty or echo-only replies fail; one bounded retry flag.
    ok = bool(text) and text.lower() not in (message or "").lower()
    trace.append({"node": "verify", "output": "pass" if ok else "fail-empty"})
    return {"reply": text or None, "trace": trace}
