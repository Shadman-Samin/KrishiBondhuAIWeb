"""In-memory RAG store. See package docstring for technique disclosures."""
import math
import re
from collections import Counter

TECHNIQUES = [
    "naive_rag",
    "vector_db",  # in-memory TF-IDF cosine store (no external service)
    "contextual_rag",
    "semantic_chunking",
    "graph_rag",
]

_TOKEN = re.compile(r"[a-zA-Z\u0980-\u09FF]+")

_DOC_CONTEXT = {
    "rice_blast": "Rice blast (Magnaporthe oryzae) — fungal disease of rice; leaf lesions; treat with neem oil or Tricyclazole.",
    "late_blight": "Late blight (Phytophthora infestans) — devastating tomato/potato disease; needs Mancozeb/Metalaxyl.",
    "general": "General crop hygiene: clean seed, balanced fertilizer, drainage, monitoring.",
}

# Seed KB mirrors the curated cards in api/server.py::_DISEASE_KB plus a
# general-hygiene fallback doc. Each doc -> semantic chunks (sentence windows).
_DOCS = [
    {
        "id": "rice_blast",
        "title": "Rice Blast",
        "text": (
            "Rice Blast is caused by Magnaporthe oryzae. Severity Moderate. "
            "Organic treatment: spray neem oil solution (5 ml/L) on affected leaves every 5-7 days. "
            "Remove and burn heavily infected plants. "
            "Chemical treatment: apply Tricyclazole 75 WP (0.6 g/L) within 3 days. "
            "Repeat after 10-12 days if lesions persist. "
            "Prevention: use resistant varieties, avoid excess nitrogen, keep field free of standing water at night."
        ),
    },
    {
        "id": "late_blight",
        "title": "Late Blight (Tomato/Potato)",
        "text": (
            "Late Blight is caused by Phytophthora infestans. Severity High. "
            "Organic treatment: Bordeaux mixture (1%). Garlic extract spray. "
            "Remove and destroy infected plants immediately. "
            "Chemical treatment: Mancozeb 75% WP (2.5g/L) or Metalaxyl + Mancozeb (2g/L). Spray every 7-10 days. "
            "Prevention: use certified seed. Ensure good air circulation. Avoid overhead irrigation."
        ),
    },
    {
        "id": "general",
        "title": "General Crop Hygiene",
        "text": (
            "Use clean seed, balanced fertilizer, and good field hygiene. "
            "Remove affected leaves and spray neem oil (5 ml/L) every 5-7 days. "
            "Consult local extension for targeted fungicide for the specific crop. "
            "Maintain regular monitoring. Clear drainage channels before monsoon."
        ),
    },
]

# Light entity graph: crop -> diseases -> treatments (multi-hop).
_GRAPH = {
    "rice": {"diseases": ["rice_blast"], "related": ["general"]},
    "tomato": {"diseases": ["late_blight"], "related": ["general"]},
    "potato": {"diseases": ["late_blight"], "related": ["general"]},
    "rice_blast": {"crops": ["rice"], "treatments": ["neem oil", "Tricyclazole 75 WP"], "related": ["general"]},
    "late_blight": {
        "crops": ["tomato", "potato"],
        "treatments": ["Bordeaux mixture", "Mancozeb", "Metalaxyl + Mancozeb"],
        "related": ["general"],
    },
}


def _tokens(s: str):
    return _TOKEN.findall(s.lower())


def _sentences(text: str):
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def _build_index():
    """Semantic chunks: 1-2 sentence windows per doc, each with contextual prefix."""
    chunks = []
    for doc in _DOCS:
        ctx = _DOC_CONTEXT.get(doc["id"], "")
        for i, sent in enumerate(_sentences(doc["text"])):
            window = sent
            if i + 1 < len(_sentences(doc["text"])):
                window = sent + " " + _sentences(doc["text"])[i + 1]
            chunks.append(
                {
                    "doc": doc["id"],
                    "title": doc["title"],
                    # Contextual RAG: prepend chunk-specific global context.
                    "context": ctx,
                    "text": window,
                    "full": f"[{doc['title']} | Context: {ctx}] {window}",
                }
            )
    # TF-IDF over chunk full-texts.
    df = Counter()
    tf_list = []
    for c in chunks:
        toks = _tokens(c["full"])
        tf = Counter(toks)
        tf_list.append(tf)
        for t in set(toks):
            df[t] += 1
    n = len(chunks)
    idf = {t: math.log((n + 1) / (d + 1)) + 1.0 for t, d in df.items()}
    vecs = []
    for tf in tf_list:
        total = sum(tf.values()) or 1
        vecs.append({t: (c / total) * idf.get(t, 1.0) for t, c in tf.items()})
    return chunks, vecs, idf


_CHUNKS, _VECS, _IDF = _build_index()


def _query_vec(q: str):
    tf = Counter(_tokens(q))
    total = sum(tf.values()) or 1
    return {t: (c / total) * _IDF.get(t, math.log(len(_CHUNKS) + 1) + 1.0) for t, c in tf.items()}


def _cosine(a: dict, b: dict) -> float:
    if not a or not b:
        return 0.0
    dot = sum(v * b.get(k, 0.0) for k, v in a.items())
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def _graph_boost(query: str, doc_id: str) -> float:
    """+0.15 if a graph neighbour of a query-mentioned entity matches the chunk doc."""
    q = query.lower()
    boost = 0.0
    for entity, node in _GRAPH.items():
        if entity.replace("_", " ") in q or entity in q:
            related_docs = set(node.get("diseases", []) + node.get("related", []))
            if doc_id in related_docs:
                boost += 0.15
    return boost


def retrieve(query: str, top_k: int = 2):
    """Return top_k chunks as {title, text, context, score, doc} dicts."""
    if not query or not query.strip():
        return []
    qv = _query_vec(query)
    scored = []
    for c, v in zip(_CHUNKS, _VECS):
        s = _cosine(qv, v) + _graph_boost(query, c["doc"])
        scored.append((s, c))
    scored.sort(key=lambda x: x[0], reverse=True)
    out = []
    for s, c in scored[: max(1, top_k)]:
        if s <= 0:
            continue
        out.append(
            {"doc": c["doc"], "title": c["title"], "text": c["text"],
             "context": c["context"], "score": round(s, 4)}
        )
    return out


def get_graph_neighbors(entity: str):
    """Multi-hop neighbours for an entity (crop/disease), for disclosure + tracing."""
    key = entity.lower().strip().replace(" ", "_")
    node = _GRAPH.get(key, {})
    return {
        "entity": entity,
        "diseases": node.get("diseases", []),
        "crops": node.get("crops", []),
        "treatments": node.get("treatments", []),
        "related": node.get("related", []),
    }
