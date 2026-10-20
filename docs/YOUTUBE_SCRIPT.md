# YouTube Demo Script — 4:00 target, one take

**Format:** story-first. Open on a rice field (illustrative scenario), then reveal the phone
and the Bangla voice loop; cut to the web dashboard for the platform view. English
voice-over; Bangla on screen speaks for itself.

**Recording setup:** mirror the Android phone with `scrcpy` at 1080p (or record the
device screen natively), browser at the live URL, zoom 90–110%, mic recorded dry.
Pre-open every file and screen; never navigate folders on camera. Rehearse once.

**Runtime:** 4:00 target. If real inference or Bangla playback runs long, allow
4:00–4:15 rather than cutting off a spoken answer. Stay under 5:00.

**Title suggestion:**
`KrishiBondhu AI — Bangla voice + crop disease detection for farmers | Idea to Unicorn`

---

## Blocking pre-record checks

Do not start recording until every item passes:

- [ ] **Story B-roll is ready:** sunrise field, wet leaves, hands parting plants, close-up
      of spots. Add a small lower-third: **“Illustrative scenario.”**
- [ ] **No testimonial implication:** the farmer is not named and is not presented as a
      real customer. If a real farmer appears, get consent; otherwise shoot hands, boots
      and field only.
- [ ] **App is wired to the live API.** Disease scan and chat verified against the live
      API; weather and marketplace verified against their actual data sources; Bangla STT
      and TTS tested on the installed device. Scan returns real detections and advice (not
      mock), and chat returns a real reply. The app is being migrated to the new API Space
      — verify the installed APK against `https://hodoly163-krishibondhu-api.hf.space`
      before filming.
- [ ] **TTS speaks Bangla** and **STT transcribes Bangla** on the recording device.
      Both run in the app; neither depends on our backend.
- [ ] **Web stats settle at** `116` disease classes · `30+` crops · `10` regions · `2`
      languages · `Cloud hosted`; no zeros on screen. Confirm in a real browser, not a
      cached snapshot.
- [ ] **Model card hard-refreshed:** confirm the rendered **AGPL-3.0** agrees with the
      model card and repository. If the Apache view reappears, resolve it before
      recording — do not ignore it.
- [ ] **Demo Space awake + model loaded;** one real scan already run.
- [ ] **Market state known** (live DAM rows or clearly labeled dated fallback) so the line
      matches what is on screen. If fallback, narrate it as dated, never as today’s live
      prices.
- [ ] **Web result pre-run separately** with the same rice image; the phone result does
      not appear on the web automatically.
- [ ] **Both language toggles pre-warmed** (EN ↔ BN).
- [ ] **No English VO over any Bangla TTS** — in the reveal, disease advice, or advisor
      section.

**What “one take” means:** record one continuous narration take, then edit the visuals
around it. For the opening, pre-render `0:00–0:48` B-roll as a single 48-second clip with
the lower-third baked in, load it as an OBS Media Source, read the VO live, and switch to
the `scrcpy` phone scene at `0:48`. Alternatively, record one continuous screen capture
with the B-roll preloaded; the narration-first edit is recommended.

**If the app is not wired in time:** record the web-only variant (same script, replace
phone shots with the browser) and present the app as “in migration” in the description.
Do not film mock screens as if they were live.

---

## 0:00–0:30 — A farmer’s morning (illustrative scenario)

**Action:** wide rice field at sunrise, dew on the leaves, footsteps in mud. Cut to hands
parting the plants, then a close-up of brown, spindle-shaped spots. Hold on the leaf. No
phone, no logo, no product UI. Lower-third: **“Illustrative scenario.”** Let the leaf
close-up linger silently after the last sentence.

> “Picture a farmer walking through a rice field just after sunrise. The leaves are wet,
> and a patch that looked healthy last week now has brown, spindle-shaped spots.
>
> Blast? Brown spot? Something else?
>
> They don’t know whether to spray, wait, or ask for help—and expert advice may not be
> nearby. A wrong decision can cost time they don’t have.”

## 0:30–0:48 — The uncertainty

**Action:** stay on the leaf, then a slow shot of a sprayer in the background and the
farmer’s hand holding a phone, screen still off. At **0:42**, as the product name lands,
the screen lights up with the app UI. Lower-third fades; cut to the live phone scene at
**0:48**.

> “The hardest part isn't just the spots; it's not knowing what to do next. KrishiBondhu
> is built to offer a first step: a second opinion in the farmer's language.”

## 0:48–1:08 — The reveal: Bangla in, Bangla out

**Action:** cut to the phone, assistant tab open. Tap the mic and ask in Bangla:
**“ধানের পাতায় বাদামি মাকুর মতো দাগ দেখা যাচ্ছে—এটা কী রোগ হতে পারে, কী করব?”** —
“Brown spindle-shaped spots are appearing on my rice leaves—what disease could it be,
and what should I do?” Let the spoken Bangla reply play fully. Do not narrate over it.
On-screen text: **“Bangla in · Bangla out.”**

> “Ask in Bangla. Hear the answer in Bangla. No typing. No English required.”

## 1:08–1:51 — Disease detection (the centerpiece, live on the phone)

**Action:** open Disease Scan, pick the pre-tested rice-blast image, run it, wait for the
real inference, then show boxes + confidence. Switch the advice to Bangla and tap
read-aloud; let TTS speak one sentence. Use the actual returned advice; do not substitute
the homepage sample card, and do not present any pesticide line as universally appropriate.

> “Or, instead of describing it, just snap a photo.”

> “Meet KrishiDrishti-11X, our crop-disease detector covering 116 disease and plant-health
> classes across more than 30 crops. The model card publishes its training record,
> validation results and limitations. Real field photos vary in angle and lighting, so
> treat every result as early guidance.”

> “Advice is grounded in a curated agronomy guide, in Bangla and English. The phone can
> read the answer aloud using its own speech features.”

## 1:51–2:04 — Cross-platform

**Action:** pre-run the same rice image in the web dashboard before recording, then cut to
that real browser result. Do not imply the phone’s result appears on the web automatically.

> “The same engine runs in the browser, alongside weather, soil guidance, crop calendar
> and market prices.”

## 2:04–2:32 — Advisor with live context (voice in, voice out)

**Action:** ask by voice on the phone: **“আগামীকাল নওগাঁয় স্প্রে করব?”** — or type it if
the recording environment is noisy. Show the answer streaming, then tap read-aloud and let
one sentence play before showing the weather/market chips. No English VO over the TTS.

> “Every answer is grounded with the selected district’s live weather and today’s
> national market prices — so the advice fits the day, not just the disease.”

**If the market is on fallback:**
> “Every answer is grounded with the selected district’s live weather and the latest
> available national market prices — so the advice fits the day, not just the disease.”

## 2:32–2:57 — Marketplace (web, honest data)

**Action:** scroll the price table. Show whatever the live state actually is. If it is on
fallback, call it a dated snapshot; never narrate it as today’s live prices.

> “Daily prices come from the Department of Agricultural Marketing, parsed bilingually.
> If the government feed is unreachable, the app says so and falls back to a dated
> dataset — we don’t present old prices as today’s.”

Do **not** switch to local mode to make the history chart look better. If the live
Space has no history, show the honest “data builds daily” state or skip the chart.

## 2:57–3:22 — Technical montage (three shots only)

**Action:** queue these windows before recording and switch quickly:

1. **Hosted AI demo** running a real predict; mention CPU fallback.
2. **Model card** — zoom on `AGPL-3.0`, the provenance table, and the limitations.
3. **GitHub repo** — `api/`, `mcp-server/`, `docs/`.

> “Under the hood, the web app connects to our hosted AI demo, while the mobile app
> integrates through a separate REST API. A standalone MCP server exposes market tools
> to compatible clients. The vision model uses GPU inference with CPU fallback when
> free-tier GPU capacity is unavailable.”

## 3:22–3:42 — Honest limits

**Action:** quick shot of the homepage “Verified facts” / FAQ section. Frame only that
section; do not show the hero sample cards.

> “What it can’t do, we say. No banana sigatoka class yet. In our initial 36-photo check,
> it identified the exact disease in 22 photos. We’re expanding the benchmark, so treat
> results as early guidance, not a guarantee. Voice quality depends on the device’s Bangla
> speech support. Satellite monitoring and soil lab analysis are on the roadmap.”

## 3:42–4:00 — Team + close

> “KrishiBondhu AI, by PentaFarmers — Shadman Samin, Ramim Azad, Nusrat Jahan Neha,
> Jannatul Ferdous Mim, AU Sabbir. Try it live, or read the code.”

**End card on screen for the final 7 seconds — two links only:**
- Live demo: `https://krishibondhu-ai-web.vercel.app`
- GitHub: `https://github.com/Shadman-Samin/KrishiBondhuAIWeb`

---

## YouTube description (paste as-is)

```
KrishiBondhu AI — a bilingual (Bangla/English) farming assistant by Team PentaFarmers.

Opening scenario is illustrative, not a testimonial or a claim about a specific farmer.

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
0:00 A farmer's morning
0:30 The uncertainty
0:48 Ask in Bangla
1:08 Disease detection on the phone
1:51 Same engine on the web
2:04 Advisor with live weather + market context
2:32 Marketplace
2:57 How it's built
3:22 Honest limits
3:42 Team + links
```

**Tags:** KrishiBondhu, Bangladesh agriculture, crop disease detection, Bangla AI,
YOLO11x, computer vision, RAG, farming assistant, Idea to Unicorn, PentaFarmers

---

## Pre-flight checklist (repeat before every take)

- [ ] Phone at 100%, notifications off, Do Not Disturb on
- [ ] scrcpy 1080p, no cursor on screen
- [ ] Story lower-third reads **“Illustrative scenario”**; no named farmer or testimonial claim
- [ ] App: disease scan and chat verified against the live API; weather and marketplace
      verified against their actual data sources; Bangla STT and TTS tested on the
      installed device
- [ ] Chat read-aloud works on the installed APK; otherwise retitle the section
      “Voice input with live context”
- [ ] Web: stats settle at `116 / 30+ / 10 / 2 / Cloud hosted`; no zeros on screen
- [ ] Model card hard-refreshed: confirm the rendered **AGPL-3.0** agrees with the model
      card and repository; resolve any Apache view before recording
- [ ] Web dashboard pre-run separately with the same rice image; show that real result
- [ ] Disease demo uses the actual returned result and advice; homepage sample cards are
      labeled and are not shown as a live prediction
- [ ] Market state matches the narration; if fallback, UI shows `Offline snapshot` /
      `Dated dataset` and the older date; narrate it as dated and use the `2:04`
      “latest available” line
- [ ] No English VO over Bangla TTS in the reveal, disease demo, or advisor section
- [ ] YouTube upload unlisted, link tested in an incognito window, then paste into the portal
