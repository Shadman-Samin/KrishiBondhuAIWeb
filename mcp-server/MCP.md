# MCP Disclosure — KrishiBondhu AI (PentaFarmers)

## MCP servers BUILT by the team (custom)

| Server | Tools | Transports | Repo path |
|---|---|---|---|
| `krishibondhu-market` v1.0.0 | `get_market_prices`, `get_price_history`, `get_health` | Stdio (JSON-RPC 2.0) + SSE (`GET /sse`, `POST /messages`) | `mcp-server/server.py` |

Run: `python mcp-server/server.py stdio` or `python mcp-server/server.py sse` (`MCP_PORT`, default 8765).
Stdlib only — no new dependencies. Tool data flows backend `/market-prices` → static
`market-prices.json` fallback, so tools never crash offline.

## MCP servers USED (external / public)

| Server | Purpose | Used where |
|---|---|---|
| Fetch MCP (public) | Pull DAM (`market.dam.gov.bd`) pages + docs during development and for agent web context | Dev + LangGraph web step |
| CloudCamp BD auth MCP (`cloudcamp-bd`) | Read competition knowledge base / submission rules | Planning only (not shipped in product) |

## Clients / Hosts

- Hosts: Claude / VS Code MCP host (dev), custom LangGraph agent (product, `api/agent/`).
- Clients disclose `clientInfo`; server answers `initialize` with `protocolVersion 2024-11-05`.

## Permission boundaries + reuse

- Tools are **read-only** (no writes, no PII, no secrets in tool output).
- `BACKEND_URL` env scopes which backend the tools query; CORS on the backend restricts browsers.
- Reuse: the same tool functions back the chat agent's market step — one implementation, two callers (MCP + in-process).
