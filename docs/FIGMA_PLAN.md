# Figma Plan — what the link must contain (1 pt + judge trust)

Page 1 — Wireframes: landing, dashboard home, disease upload → result, chat
(streaming), marketplace (prices + chart), weather, settings. Desktop + mobile frames.
Page 2 — Architecture: browser → Vercel frontend → HF Spaces FastAPI (YOLO/RAG/agent/
admin) → Groq LLM + DAM + OpenWeather; MCP server sidecar; ngrok dev path greyed out.
Page 3 — Data flow: DAM scrape → cache → history → API → RAG context → advice.
Publish with link-sharing on and paste the URL into the Figma field + Other Links.
