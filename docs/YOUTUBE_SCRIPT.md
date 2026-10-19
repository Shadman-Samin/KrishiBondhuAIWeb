# YouTube Demo Script — 3:30–4:30 min, one take, crisp audio

**Recording setup:** full-screen browser at the live URL
(https://krishibondhu-ai-web.vercel.app), zoom 90–110%, mic recorded dry, keep
each screen ~20–35 s. Do every live action for real before recording (Space
awake, weather page loaded); rehearse once. English voice-over; Bangla on
screens speaks for itself.

**Title suggestion:** "KrishiBondhu AI — bilingual AI farming assistant
(Bangla/English) | Idea to Unicorn by Team PentaFarmers"

---

## 0:00–0:20 — Hook (show landing page)
> "This is KrishiBondhu AI — an AI farming assistant built for Bangladesh, by
> students. Snap a photo of a sick crop, and it detects the disease and tells
> you what to do — in Bangla or English. Everything you see in this video is
> live, right now, on free cloud infrastructure."

- Show the landing hero. Immediately hit the language toggle once — the entire
  homepage flips to Bangla, then back. That's the "wow, it's actually bilingual"
  moment; don't linger on the marketing paragraphs.

## 0:20–0:30 — The problem (one slide, over the dashboard)
> "Bangladesh's smallholders lose yield to diseases they can't identify in
> time. Diagnosis normally needs an agronomist most farmers never reach — and
> existing AI is English-first and lab-trained. KrishiBondhu closes that gap."

- On the dashboard home (`/dashboard`): weather widget, quick actions.

## 0:30–1:10 — Disease detection (the money shot; do it live)
- Open `/dashboard/disease`, pick a real rice leaf photo that shows blast
  symptoms (a file from `space-demo/examples/`). Upload.
- While the result streams in (boxes + confidence):
> "This is KrishiDrishti-11X — our own detector. 116 disease and health
> classes across 30+ crops. We trained it on an 89-class public
> plant-disease dataset merged with the 27 classes of a public Roboflow field
> dataset — the full training record is embedded in the checkpoint, so anyone
> can verify it was trained by us — and it records about 0.70 validation mAP."
- Switch to Bangla advice. Read one step aloud in Bangla.
> "Advice is generated twice — Bangla and English — in one call, grounded by a
> retrieval system over a curated agronomy knowledge base."

## 1:10–1:50 — Advisor chat with live context
- `/dashboard/chat`: type (or paste) in Bangla: "আম বাগানে আগামীকাল স্প্রে করব?
  (আবহাওয়া দেখে বলো)" — or "Should I spray tomorrow in Naogaon?"
- While it streams:
> "Everything the farmer's situation actually needs is folded silently into
> the answer: the selected district's live weather, today's national market
> prices, and retrieved agronomy passages. When safer-dose questions come up
> for garden plants, the system stays on general guidance — never invented
> doses."
- Show that weather chip / market chip on the page.

## 1:50–2:20 — Marketplace (live data)
- `/dashboard/marketplace` — scroll the price table, open a crop's detail.
> "Daily national retail prices straight from the Department of Agricultural
> Marketing's own site — scraped bilingually, merged by row order, with an honest
> fallback to a dated dataset when the source is down. The price-history chart fills
> in from the local backend's daily snapshots."
- In the live `space` deployment the history chart shows "Not enough history yet — data
  builds daily" (the Space has no history endpoint). Either shoot that message as-is (it
  is honest) or switch to local `fastapi` mode for the chart shot — do not script a chart
  that isn't there.

## 2:20–2:50 — How it's built (slide/screen each, rapid)
The under-the-hood montage (queue up minimized windows and switch quickly):
1. **The Space in Hugging Face** (https://huggingface.co/spaces/hodoly163/krishibondhu-demo)
   — show app doing GPU predict; mention CPU fallback "so free-tier quota never
   breaks the demo" and the Space is itself an MCP server.
2. **Model card** (https://huggingface.co/hodoly163/krishibondhu-jktk) — zoom
   on the provenance table (Colab, 100 epochs, datasets) and AGPL license.
3. **GitHub repo** — `KrishiBondhuVision/api` + `mcp-server/` (Stdio+SSE
   Market MCP) + `docs/` (submission packets).
4. Optional quick flash: `/agent/run` node trace and `/admin/stats` — both are
   **local-backend** routes (the API Space serves `/admin/*` only with the token
   header). Shoot them from the local stack, not from the live web URL.
> "The whole thing was built AI-native: one spec prompt bootstrapped the
> product, agents executed with AGENTS.md as standing memory, and every claim
> I've made so far is machine-verified — accuracy evals, RAG-precision probes,
> identity-leak probes, GPU-CPU parity checks."

## 2:50–3:20 — Honest limits (30 s of credibility)
> "What it can't do, we say. The detector has no banana sigatoka class. Voice
> is on the roadmap. Satellite monitoring is on the roadmap. Accuracy in the
> field depends on the photo. We label what's measured and what's planned —
> including on our homepage."
- Show the homepage "Verified facts" section quickly.

## 3:20–3:40 — Team + CTA
> "KrishiBondhu AI — by PentaFarmers — Shadman Samin, Ramim Azad, Nusrat Jahan
> Neha, Jannatul Ferdous Mim, AU Sabbir. Try it live …"
- Overlay (keep on screen 10 s):
  - Live demo: https://krishibondhu-ai-web.vercel.app
  - Direct AI Space: https://hodoly163-krishibondhu-demo.hf.space
  - App REST API: https://hodoly163-krishibondhu-api.hf.space (/docs for Swagger)
  - GitHub: https://github.com/Shadman-Samin/KrishiBondhuAIWeb
> "Snap a photo, get the answer — in the language of the field. Thanks."

---

### Checklist before recording
- [ ] Demo Space awake + model loaded (upload one photo in the UI once; the demo Space
      has no `/health` route — the API Space does)
- [ ] Demo images ready and pre-tested (`space-demo/examples/rice_blast.jpg`,
      `space-demo/examples/tomato_late_blight.jpg`)
- [ ] Both language toggles warmed (EN ↔ BN)
- [ ] End-card overlays prepared (URLs)
- [ ] Target total length ≤ 4:30

---

## Recording checklist (repeat)

- [ ] Space awake (run one real scan through the web UI)
- [ ] Example image pre-tested
- [ ] Both language toggles ready (EN ↔ BN)
- [ ] Record at 1080p; montage screen time ~30 s total
- [ ] File: `KrishiBondhu-IdeaToUnicorn.mp4` → unlisted YouTube → paste link in portal
