# KrishiBondhu AI

An AI-powered farming assistant for Bangladesh — voice-first, Bangla-native, built for low-end phones.

![KrishiBondhu](public/favicon.svg)

## What it does

KrishiBondhu helps Bangladeshi farmers make smarter decisions through:

- **Weather Forecasting** — real-time OpenWeather data for local areas
- **Crop Disease Detection** — AI-powered image analysis with treatment recommendations
- **Crop Calendar** — seasonal planting/harvesting schedules for Bangladesh's climate zones
- **Soil Intelligence** — soil health analysis and recommendations
- **Market Prices** — live market price tracking with trend visualization
- **Voice Assistant** — Bangla-first voice interface (coming soon)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) (SSR) |
| UI | React 19, [shadcn/ui](https://ui.shadcn.com), Radix UI |
| Styling | Tailwind CSS v4, glassmorphism design system |
| Routing | TanStack Router (file-based) |
| State | TanStack Query, React Context |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Build | Vite 8, Nitro (Cloudflare target) |
| Language | TypeScript 5.8, Bun |
| i18n | Bengali/English bilingual toggle |

## Design

- **Dark mode** — custom emerald-green glassmorphism palette (`#0A110D` → `#22C55E`)
- **Light mode** — white translucent glass with dark text
- **Responsive** — works on desktop, tablet, and low-end phones
- **Glassmorphism** — layered translucent panels with backdrop blur

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- An [OpenWeather API key](https://openweathermap.org/api)

### Setup

```bash
# Clone
git clone https://github.com/Shadman-Samin/KrishiBondhuAI.git
cd KrishiBondhuAI

# Install
bun install

# Configure
cp .env.example .env.local
# Add your OpenWeather API key to .env.local

# Run
bun run dev
```

Open [http://localhost:8080](http://localhost:8080).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_OPENWEATHER_API_KEY` | Yes | OpenWeather API key for weather data |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run preview` | Preview production build |
| `bun run lint` | Run ESLint |
| `bun run format` | Format with Prettier |

## Project Structure

```
src/
├── assets/          # Static images (hero, satellite, disease)
├── components/
│   ├── dashboard/   # Layout, sidebar, topbar
│   └── ui/          # shadcn/ui components (46 components)
├── data/            # Crops, diseases, marketplace, weather data
├── hooks/           # Custom React hooks
├── lib/             # Auth, theme, i18n, search, weather API, utils
├── routes/
│   ├── __root.tsx   # App shell, providers, theme flash prevention
│   ├── index.tsx    # Landing page
│   └── dashboard/   # Dashboard modules (7 pages)
├── styles.css       # Tailwind v4 + glassmorphism utilities
├── router.tsx       # TanStack Router config
├── server.ts        # SSR error handling
└── start.ts         # TanStack Start instance
```

## Dashboard Modules

| Route | Feature |
|-------|---------|
| `/dashboard` | Home — weather stats, quick actions, seasonal tips |
| `/dashboard/weather` | Real-time weather with hourly/daily forecasts |
| `/dashboard/crop-calendar` | Seasonal planting & harvesting calendar |
| `/dashboard/disease` | AI crop disease detection |
| `/dashboard/soil` | Soil health analysis |
| `/dashboard/marketplace` | Market prices & trends |
| `/dashboard/settings` | Profile & preferences |

## License

Private — KrishiBondhu AI
