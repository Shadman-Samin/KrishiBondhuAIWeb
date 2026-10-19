# KrishiBondhuWeb — frontend

TanStack Start + React 19 web client for KrishiBondhu AI. Voice-first ambitions, Bangla-native, glassmorphism UI, runs on low-end phones. Deployed to **Vercel** in production.

> Repo layout note: this folder lives inside the monorepo `Shadman-Samin/KrishiBondhuAIWeb` and is the **Vercel `rootDir`** (Vercel auto-builds on every push to `main`). Clone the monorepo, then `cd KrishiBondhuWeb`.

## Backend switch (important)

The frontend works against **two interchangeable AI backend modes** via `src/lib/model-api.ts` + `src/lib/space-client.ts`:

| `VITE_BACKEND` | Client used | Behaviour |
|---|---|---|
| `space` | `space-client.ts` → Gradio Space API (`@gradio/client`) | Production mode. Zero local backend needed — vision detect + bilingual advice + chat + market all served by the HF Space. Includes retry/backoff, Space-wake-up and quota messaging, auto CPU-fallback handling. |
| `fastapi` (or unset) | `model-api.ts` → same-origin FastAPI | Dev mode. Vite proxy forwards `/predict /advise /chat /chat/stream /health /market-prices …` → `http://localhost:8000`. Requires the local backend (`start-dev.bat` or manual uvicorn) + LM Studio on `:1234`. Never hard-code absolute backend URLs. |

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Vite dev server (:8080) with API proxy |
| `bun run build` | Production build → `dist/client/` + `dist/server/` (SSR — no stray `index.html`; runtime HTML via Nitro/SSR) |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview production build |
| `bun run lint` | ESLint |
| `bun run format` | Prettier |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | Yes | OpenWeather key (client key; also set on Vercel) |
| `VITE_BACKEND` | Prod: `space` | Backend mode selector (`space` \| `fastapi`) |
| `VITE_SPACE_URL` | With `space` mode | HF Space base URL (`https://hodoly163-krishibondhu-demo.hf.space`) |

`.env.example` lists the current variables. `VITE_MODEL_API_URL` is gone — origins come
from `VITE_SPACE_URL` (Space mode) or same-origin (FastAPI mode).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SSR) + TanStack Router (file-based) |
| UI | React 19, shadcn/ui, Radix |
| Styling | Tailwind CSS v4, glassmorphism system (dark `#0A110D→#22C55E` / light glass) |
| State | TanStack Query + React Context (auth, theme, language) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Build | Vite 8 via `@lovable.dev/vite-tanstack-config`, Bun, Nitro (Cloudflare target) |
| i18n | en/bn toggle (`src/lib/i18n.tsx`) |

## Structure

```
src/
├── assets/            # hero, satellite, disease images
├── components/
│   ├── dashboard/     # layout, sidebar, topbar
│   └── ui/            # shadcn/ui primitives (~46)
├── data/              # crops.ts, diseases.ts KB, marketplace.ts, market-prices.json (offline fallback), weather.ts
├── lib/
│   ├── model-api.ts   # backend switch + FastAPI client (predictDisease, getAdvice, sendChat, streamChat, buildContext, fetchMarketPrices, fetchPriceHistory)
│   ├── space-client.ts# Gradio Space adapter: /predict (3-output EN+BN advice), /chat, /market; retry & wake/quota copy
│   ├── weather-api.ts # OpenWeather
│   ├── error-capture.ts / error-page.ts / lovable-error-reporting.ts # error boundary + reporting
│   ├── auth.tsx / theme.tsx / i18n.tsx / search.ts / district.ts / utils.ts
│   └── api-key.ts     # dead code (kept, inert)
├── routes/
│   ├── __root.tsx     # providers/shell
│   ├── index.tsx      # public landing
│   ├── dashboard.tsx  # layout gate + LangProvider
│   └── dashboard/     # index, weather, soil, disease, chat, crop-calendar, marketplace, settings
├── styles.css         # Tailwind v4 + glass utilities
├── router.tsx / server.ts / start.ts
```

## Dashboard modules

| Route | Feature |
|---|---|
| `/dashboard` | Home — weather stats, quick actions, seasonal tips |
| `/dashboard/weather` | Real-time/hourly/daily forecasts |
| `/dashboard/crop-calendar` | Seasonal planting & harvest calendar |
| `/dashboard/disease` | Upload → detection boxes → bilingual advice |
| `/dashboard/chat` | Bilingual AI advisor (streaming, context-folded) |
| `/dashboard/soil` | Soil health analysis |
| `/dashboard/marketplace` | DAM prices (live or dated dataset fallback) + history chart in `fastapi` mode only — the Space has no history endpoint, so production shows "not enough history yet" |
| `/dashboard/settings` | Profile & preferences |

## Deployment

- **Vercel** auto-deploys pushes to `main` (project `krishibondhu-ai-web`, `framework: tanstack-start-lovable` wrapper, root `KrishiBondhuWeb/`, `vercel.json` sets bun install/build).
- Rebuild locally to test the production SSR path: `bun run build && node serve.mjs` (:8001) — used by `start-dev.bat` behind FastAPI + ngrok.

## Gotchas

- **TanStack version skew**: `@tanstack/router` / `start` / vite-plugin versions must stay aligned with the lockfile — mismatched versions broke SSR builds with `MISSING_EXPORT` before. Bump all three together.
- `/chat/stream` carries the model's private thinking as `delta.reasoning` (most chunks) — render only `choices[0].delta.content`, or the UI shows internal analysis.
- Pre-existing ESLint errors in `i18n.tsx`, `dashboard/index.tsx`, `dashboard/marketplace.tsx` — leave them.
- `LangProvider` sets `<div lang>` on the shell, **not** `document.documentElement.lang` — don't add DOM-lang-guessing logic relying on that.
- Backend contract for integrators lives at `docs/API_FOR_APP.md`; the app REST Space is
  <https://hodoly163-krishibondhu-api.hf.space> (Swagger at `/docs`).

## License

Private — KrishiBondhu AI
