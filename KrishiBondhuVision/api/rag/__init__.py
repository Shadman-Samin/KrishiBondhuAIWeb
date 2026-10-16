"""KrishiBondhu RAG — lightweight, zero-dependency retrieval over the in-repo
disease knowledge base.

Techniques implemented (disclosed honestly for submission):
- Naive RAG: retrieve-then-generate; chunks injected as silent context.
- Semantic / variable chunking: split on semantic boundaries (headings +
  sentence windows), not fixed token lengths.
- Contextual RAG (Anthropic-style): each chunk is prepended with a short
  document-level context summary before scoring/generation.
- TF-IDF cosine vector store: in-memory numpy vectors over the KB
  (JSON-seeded, no external service required).
- Graph RAG (light): crop -> disease -> treatment entity graph extracted
  from the KB; multi-hop neighbours boost retrieval + are cited.

Only stdlib + numpy (already a backend dependency).
"""
from .store import retrieve, get_graph_neighbors, TECHNIQUES

__all__ = ["retrieve", "get_graph_neighbors", "TECHNIQUES"]
