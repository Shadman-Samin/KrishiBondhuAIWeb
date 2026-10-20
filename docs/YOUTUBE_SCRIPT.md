# YouTube Demo Script — 4:00 target, one take

**Format:** phone-first. Open on the mobile app (Bangla voice + TTS), cut to the web
dashboard for the platform view. English voice-over; Bangla on screen speaks for itself.

**Recording setup:** mirror the Android phone with `scrcpy` at 1080p (or record the
device screen natively), browser at the live URL, zoom 90–110%, mic recorded dry.
Pre-open every file and screen; never navigate folders on camera. Rehearse once.

**Title suggestion:**
`KrishiBondhu AI — Bangla voice + crop disease detection for farmers | Idea to Unicorn`

---

## Blocking pre-record checks

Do not start recording until every item passes:

- [ ] **App is wired to the live backend.** Disease scan returns real detections and
      advice (not mock), chat returns a real reply, market and weather return live data.
      The app is being migrated to the new API Space — verify the installed APK against
      `https://hodoly163-krishibondhu-api.hf.space` before filming.
- [ ] **TTS speaks Bangla** and **STT transcribes Bangla** on the recording device.
      Both run in the app; neither depends on our backend.
- [ ] Web landing stats band shows real values, not zeros:
      `116` disease classes · `30+` crops · `64` districts · `2` languages · `24/7`.
- [ ] Rendered HF model card visibly says **AGPL-3.0** and shows the training record.
- [ ] Demo Space awake + model loaded; one real scan already run.
- [ ] Market state known (live DAM rows or dated dataset fallback) so the line matches
      what is on screen.
- [ ] Both language toggles pre-warmed (EN ↔ BN).

**If the app is not wired in time:** record the web-only variant (same script, replace
phone shots with the browser) and present the app as "in migration" in the description.
Do not film mock screens as if they were live.

---

## 0:00–0:15 — Hook (phone in hand)

Action: app open on the assistant tab. Tap the mic, ask in Bangla, let the spoken reply
play.

> "Ask a farming question in Bangla, and KrishiBondhu answers out loud. Snap a sick
> leaf, and it names the disease and tells you what to do — in Bangla or English.
> It's built for Bangladesh, and it's live."

## 0:15–0:32 — Problem

Action: cut to the web dashboard home (weather widget + quick actions).

> "For many farmers, identifying crop diseases early is difficult, and expert advice
> isn't always nearby. KrishiBondhu provides an accessible first step — AI guidance in
> the language of the field."

## 0:32–1:20 — Disease detection (the centerpiece, live on the phone)

Action: open Disease Scan, pick the pre-tested rice-blast image, run it, wait for the
real inference, then show boxes + confidence. Switch the advice to Bangla and tap
read-aloud; let TTS speak one sentence.

> "Meet KrishiDrishti-11X, our crop-disease detector: 116 disease and plant-health
> classes across more than 30 crops. It's trained on merged public crop-disease
> datasets. The model card publishes the validation results and the limitations —
> and real field photos can be harder than test images: angle, light and crop all
> matter. Treat every diagnosis as advice."

> "Advice is drawn from a curated agronomy guide and written in Bangla and English in
> one workflow. On the phone, it can read the answer aloud — the voice runs in the app,
> not through our backend."

## 1:20–1:38 — Cross-platform

Action: cut to the same result on the web dashboard.

> "The same engine runs in the browser, alongside weather, soil guidance, crop calendar
> and market prices."

## 1:38–2:08 — Advisor with live context (voice in, voice out)

Action: ask by voice on the phone: "আগামীকাল নওগাঁয় স্প্রে করব?" — or type it if the
recording environment is noisy. Show the answer streaming and the weather/market chips.

> "Every answer is grounded with the selected district's live weather and today's
> national market prices — so the advice fits the day, not just the disease."

## 2:08–2:38 — Marketplace (web, honest data)

Action: scroll the price table. Show whatever the live state actually is.

> "Daily prices come from the Department of Agricultural Marketing, parsed bilingually.
> If the government feed is unreachable, the app says so and falls back to a dated
> dataset — we don't present old prices as today's."

Do **not** switch to local mode to make the history chart look better. If the live
Space has no history, show the honest "data builds daily" state or skip the chart.

## 2:38–3:08 — Technical montage (three shots only)

Queue these windows before recording and switch quickly:

1. **HF Space** running a real predict; mention CPU fallback.
2. **Model card** — zoom on `AGPL-3.0`, the provenance table, and the limitations.
3. **GitHub repo** — `api/`, `mcp-server/`, `docs/`.

> "Under the hood: a cloud demo app, a separate API for app integrations, a hosted AI
> model, and a market-tools server. The demo can also plug into other apps as a tool
> server. Everything runs on free cloud tiers, with automatic fallback when the free
> GPU is busy."

## 3:08–3:33 — Honest limits

Action: quick shot of the homepage "Verified facts" / FAQ section.

> "What it can't do, we say. No banana sigatoka class yet. Our test set is still
> growing, so we treat the result as early guidance, not a guarantee. Voice quality
> depends on the device's Bangla speech support. Satellite and soil lab analysis are
> roadmap. We label what's measured and what's planned."

## 3:33–3:55 — Team + close

> "KrishiBondhu AI, by PentaFarmers — Shadman Samin, Ramim Azad, Nusrat Jahan Neha,
> Jannatul Ferdous Mim, AU Sabbir. Try it live, or read the code."

End card on screen for the final 10 seconds — two links only:
- Live demo: `https://krishibondhu-ai-web.vercel.app`
- GitHub: `https://github.com/Shadman-Samin/KrishiBondhuAIWeb`

---

## YouTube description (paste as-is)

```
KrishiBondhu AI — a bilingual (Bangla/English) farming assistant by Team PentaFarmers.

Snap a crop photo for disease detection with treatment advice, or ask a farming
question by voice. The mobile app adds Bangla speech input and read-aloud advice;
the web dashboard adds weather, soil guidance, crop calendar and market prices.

Built AI-native: KrishiDrishti-11X (YOLO11x, 116 disease/health classes, 30+ crops),
RAG-grounded bilingual advice, live district weather, and daily market prices from
Bangladesh's Department of Agricultural Marketing.

Live demo: https://krishibondhu-ai-web.vercel.app
GitHub: https://github.com/Shadman-Samin/KrishiBondhuAIWeb
AI demo Space: https://hodoly163-krishibondhu-demo.hf.space
App REST API (Swagger): https://hodoly163-krishibondhu-api.hf.space/docs
Model card: https://huggingface.co/hodoly163/krishibondhu-jktk

Honest limits: our test set is still growing; results are published in the repo and
treated as early guidance, not a field-diagnosis guarantee. No banana sigatoka class
yet. Market prices fall back to a dated dataset (and say so) when the government feed
is unreachable.

Chapters:
0:00 Voice-first hook
0:15 The problem
0:32 Disease detection on the phone
1:20 Same engine on the web
1:38 Advisor with live weather + market context
2:08 Marketplace
2:38 How it's built
3:08 Honest limits
3:33 Team + links
```

**Tags:** KrishiBondhu, Bangladesh agriculture, crop disease detection, Bangla AI,
YOLO11x, computer vision, RAG, farming assistant, Idea to Unicorn, PentaFarmers

---

## Pre-flight checklist (repeat before every take)

- [ ] Phone at 100%, notifications off, Do Not Disturb on
- [ ] scrcpy 1080p, no cursor on screen
- [ ] App: scan + chat + TTS + STT verified against the live backend
- [ ] Web: stats band animates to real values; FAQ voice answer matches the app
- [ ] Market state matches the narration
- [ ] YouTube upload unlisted, link tested in an incognito window, then paste into the portal
