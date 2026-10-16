"""KrishiBondhu agent — LangGraph-style decision loop (stdlib implementation).

Nodes: intent -> retrieve -> advise -> verify. Each node appends to the
trace; the loop is bounded (max 1 retrieve + 1 verify pass) to stay fast on
small hosted LLMs. Framework disclosure: custom loop with LangGraph-compatible
node/edge semantics; no heavyweight agent dependency shipped.
"""
from .loop import run_agent

__all__ = ["run_agent"]
