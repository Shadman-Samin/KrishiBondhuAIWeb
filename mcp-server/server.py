"""KrishiBondhu Market MCP server — custom MCP server built by PentaFarmers.

Exposes live market data as MCP tools so any MCP host/client (Claude,
VS Code, custom agent) can query prices with permission boundaries.

Tools:
- get_market_prices(top_n): live rows from the backend /market-prices,
  falling back to the bundled static snapshot when offline.
- get_price_history(crop, days): history points for a crop.
- get_health(): backend liveness.

Transports (both standard):
- Stdio: JSON-RPC 2.0 lines on stdin/stdout
  (initialize, tools/list, tools/call, ping).
- SSE: GET /sse opens an event stream; POST /messages accepts JSON-RPC.

Stdlib only — zero new dependencies.
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.request import Request as UrlRequest, urlopen

BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")
STATIC_SNAPSHOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "KrishiBondhuWeb", "src", "data", "market-prices.json",
)
PORT = int(os.environ.get("MCP_PORT", "8765"))

SERVER_INFO = {"name": "krishibondhu-market", "version": "1.0.0"}
TOOLS = [
    {
        "name": "get_market_prices",
        "description": "Live daily crop market prices (DAM). Returns rows with crop, price, min, max, date, unit.",
        "inputSchema": {
            "type": "object",
            "properties": {"top_n": {"type": "integer", "default": 10}},
        },
    },
    {
        "name": "get_price_history",
        "description": "Price history points for one crop over N days.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "crop": {"type": "string"},
                "days": {"type": "integer", "default": 30},
            },
            "required": ["crop"],
        },
    },
    {
        "name": "get_health",
        "description": "Backend liveness check.",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def _http_get(path: str, timeout: int = 10):
    req = UrlRequest(BACKEND_URL + path, headers={"User-Agent": "KrishiBondhu-MCP/1.0"})
    with urlopen(req, timeout=timeout) as res:
        return json.loads(res.read())


def _static_rows():
    try:
        with open(STATIC_SNAPSHOT, encoding="utf-8") as f:
            data = json.load(f)
        rows = data.get("rows", data if isinstance(data, list) else [])
        return [{"crop": r.get("crop"), "price": r.get("price"), "unit": r.get("unit", "kg"),
                 "date": r.get("date"), "_source": "static-fallback"} for r in rows]
    except Exception as e:
        return [{"error": f"static snapshot unavailable: {e}"}]


def tool_call(name: str, args: dict):
    args = args or {}
    if name == "get_health":
        try:
            return _http_get("/health")
        except Exception as e:
            return {"ok": False, "error": str(e)[:200]}
    if name == "get_market_prices":
        try:
            data = _http_get("/market-prices")
            rows = data.get("rows", [])
            return {"updated_at": data.get("updated_at"), "rows": rows[: int(args.get("top_n", 10))]}
        except Exception:
            return {"updated_at": None, "rows": _static_rows()[: int(args.get("top_n", 10))]}
    if name == "get_price_history":
        from urllib.parse import quote

        crop = str(args.get("crop", ""))
        days = int(args.get("days", 30))
        try:
            return _http_get(f"/market-prices/history?crop={quote(crop)}&days={days}")
        except Exception as e:
            return {"crop": crop, "points": [], "error": str(e)[:200]}
    raise ValueError(f"unknown tool: {name}")


def handle_rpc(msg: dict):
    """Minimal JSON-RPC dispatcher shared by both transports."""
    method = msg.get("method")
    mid = msg.get("id")
    params = msg.get("params", {}) or {}

    def ok(result):
        return {"jsonrpc": "2.0", "id": mid, "result": result}

    def err(code, message):
        return {"jsonrpc": "2.0", "id": mid, "error": {"code": code, "message": message}}

    if method == "initialize":
        return ok({"protocolVersion": "2024-11-05", "serverInfo": SERVER_INFO,
                   "capabilities": {"tools": {}}})
    if method == "ping":
        return ok({})
    if method == "tools/list":
        return ok({"tools": TOOLS})
    if method == "tools/call":
        try:
            result = tool_call(params.get("name", ""), params.get("arguments", {}))
            return ok({"content": [{"type": "text", "text": json.dumps(result, ensure_ascii=False)}]})
        except Exception as e:
            return err(-32602, str(e)[:200])
    return err(-32601, f"method not found: {method}")


def run_stdio():
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            resp = handle_rpc(json.loads(line))
        except Exception as e:
            resp = {"jsonrpc": "2.0", "id": None,
                    "error": {"code": -32700, "message": str(e)[:200]}}
        sys.stdout.write(json.dumps(resp, ensure_ascii=False) + "\n")
        sys.stdout.flush()


class _SSEHandler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path == "/sse":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            hello = json.dumps({"jsonrpc": "2.0", "method": "hello",
                                "params": SERVER_INFO}, ensure_ascii=False)
            try:
                self.wfile.write(f"data: {hello}\n\n".encode())
                self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
        elif self.path in ("/", "/health"):
            body = json.dumps({"ok": True, **SERVER_INFO}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path != "/messages":
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        try:
            resp = handle_rpc(json.loads(self.rfile.read(length) or b"{}"))
        except Exception as e:
            resp = {"jsonrpc": "2.0", "id": None,
                    "error": {"code": -32700, "message": str(e)[:200]}}
        body = json.dumps(resp, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_sse(port: int = PORT):
    HTTPServer(("0.0.0.0", port), _SSEHandler).serve_forever()


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    (run_sse if mode == "sse" else run_stdio)()
