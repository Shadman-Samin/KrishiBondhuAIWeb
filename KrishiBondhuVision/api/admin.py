"""Admin module — audit logging, token-usage tracking, analytics counters,
per-IP rate limiting, and RBAC gate for /admin/*.

Safe defaults: everything is in-memory and permissive when ADMIN_TOKEN is
unset (local dev unchanged). Setting ADMIN_TOKEN enables the RBAC gate.
Rate limits are generous and only apply to heavy endpoints.
"""
import os
import time
from collections import deque

ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
AUDIT_MAX = 500

_audit = deque(maxlen=AUDIT_MAX)
_counters: dict = {}
_token_usage: dict = {"prompt_chars": 0, "reply_chars": 0, "calls": 0}
_hits: dict = {}  # ip -> deque[timestamps] per endpoint

# endpoint -> (max_requests, window_seconds)
LIMITS = {
    "/predict": (30, 60),
    "/chat": (30, 60),
    "/chat/stream": (30, 60),
    "/agent/run": (30, 60),
}


def log_event(kind: str, detail: str = "", ip: str = ""):
    _audit.appendleft({"t": time.strftime("%Y-%m-%dT%H:%M:%S"), "kind": kind,
                       "ip": ip, "detail": detail[:200]})
    _counters[kind] = _counters.get(kind, 0) + 1


def track_tokens(prompt_chars: int, reply_chars: int):
    _token_usage["prompt_chars"] += prompt_chars
    _token_usage["reply_chars"] += reply_chars
    _token_usage["calls"] += 1


def check_rate_limit(ip: str, path: str):
    """Return None if allowed, else retry-after seconds."""
    if path not in LIMITS:
        return None
    max_req, window = LIMITS[path]
    now = time.time()
    key = f"{ip}|{path}"
    dq = _hits.get(key)
    if dq is None:
        dq = _hits[key] = deque()
    while dq and now - dq[0] > window:
        dq.popleft()
    if len(dq) >= max_req:
        return max(1, int(window - (now - dq[0])))
    dq.append(now)
    return None


def require_admin(headers) -> bool:
    if not ADMIN_TOKEN:
        return True  # open in dev; set ADMIN_TOKEN to enforce RBAC
    return headers.get("x-admin-token") == ADMIN_TOKEN


def stats():
    return {
        "counters": dict(_counters),
        "token_usage": dict(_token_usage),
        "token_est_cost_note": "chars/4 ~= tokens (estimate only)",
        "audit_events": len(_audit),
    }


def recent_audit(limit: int = 50):
    return list(_audit)[: max(1, min(limit, AUDIT_MAX))]
