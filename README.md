# KrishiBondhu AI

A farming assistant for Bangladesh, built by **Team PentaFarmers**. Check a crop photo for signs of disease, ask farming questions in Bangla or English, and find weather forecasts, market prices, and seasonal guidance.

## Try It

| Start here | Link |
|---|---|
| Use the web app | [Open KrishiBondhu AI](https://krishibondhu-ai-web.vercel.app) |
| Download the Android app | [Download V1 APK for ARM64 phones](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases/download/V1/Krishi-Bondhu-AI-arm64-v8a.apk) |
| Find app releases and other builds | [Latest mobile release](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases/latest) |
| Explore the mobile source code | [KrishiBondhu AI Flutter app](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App) |
| Try the AI directly | [Interactive AI demo](https://hodoly163-krishibondhu-demo.hf.space) |

The hosted AI needs an internet connection. Free hosting can take a minute or two to wake after inactivity; if a request fails during startup, wait and retry. Detection may take longer while the model loads.

## Android App

The Flutter app is maintained in its [own repository](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App). Its current source includes crop-photo scans, chat, district weather, market prices, and voice input/output in Bangla and English. Voice support depends on the device's speech services and available languages.

1. Download the **ARM64 APK** above for most recent Android phones.
2. Open the downloaded APK. Android may ask you to allow installation from your browser or file manager; enable it only for the installation if needed.
3. Open the app and allow microphone access if you want to use voice input.

The [V1 release page](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases/tag/V1) also includes an x86 APK for compatible devices or emulators. No iOS download is linked here. **The V1 APK may differ from the latest source code**; check the mobile repository and release notes for updates.

## What It Does

| Feature | What to expect |
|---|---|
| Crop disease detection | Upload a crop photo to KrishiDrishti-11X, our 116-class vision model, for detection boxes, confidence scores, and bilingual advice. |
| AI farming advisor | Ask questions in Bangla or English. The web client can include selected district weather and market context in the conversation. |
| Weather | District forecasts powered by OpenWeather. |
| Market prices | National retail prices from Bangladesh's Department of Agricultural Marketing (DAM), with cached or dated fallback data when the live source is unavailable. Check the displayed source and date. |
| Crop calendar | Seasonal planting and harvesting guidance. |
| Soil guidance | General or regional guidance; it is not a laboratory soil test. |

AI results can be wrong. A confidence score is not a guarantee of a correct diagnosis. Confirm serious crop problems and chemical treatments with a qualified agricultural adviser and follow the product label. Satellite and soil-analysis API responses are previews, not live satellite measurements or lab results.

## How It Works

There are two hosted AI entry points:

```text
Web app on Vercel ----> Gradio AI demo on Hugging Face Spaces
Flutter mobile app --> FastAPI REST API on Hugging Face Spaces
```

Both use the crop vision model and a hosted language model for advice. Detection tries GPU processing and can fall back to CPU when GPU access fails. Weather comes from OpenWeather; market data comes from DAM.

The REST backend also includes retrieval from a small curated agronomy knowledge base, a fixed LangGraph advice workflow, and price-history tools. Its Chroma vectors are lexical TF-IDF, and its Kuzu graph is manually curated. DuckDB stores price snapshots; the experimental trend endpoint needs at least three dated observations. These backend capabilities are separate from the public web app's Gradio path. The n8n snapshot workflow and Ollama models have been exercised locally; they are not scheduled or served in production.

For integrations, start with the [interactive REST API documentation](https://hodoly163-krishibondhu-api.hf.space/docs) and the [mobile API contract](docs/API_FOR_APP.md).

## Repository Guide

| Path | Purpose |
|---|---|
| [KrishiBondhuWeb/](KrishiBondhuWeb/) | TanStack Start, React, and Tailwind web app; deployed on Vercel. |
| [KrishiBondhuVision/](KrishiBondhuVision/) | Python FastAPI backend, detection, retrieval, market data, and evaluation scripts. |
| [space-demo/](space-demo/) | Gradio AI service used by the production web app. |
| [space-api/](space-api/) | Hosting glue for the mobile/integrator REST service. |
| [mcp-server/](mcp-server/) | Read-only market-data tools for MCP clients. |
| [docs/](docs/) | API contracts, deployment notes, and project documentation. |
| [start-dev.bat](start-dev.bat) | Windows launcher for a configured local stack. |

For mobile development, use the [separately maintained Flutter repository](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App), rather than any local mobile snapshot in this repository.

## Run The Web App Locally

The simplest development setup uses the hosted AI, so no local model download is needed. Install [Git](https://git-scm.com/) and [Bun](https://bun.sh/) first.

```sh
git clone https://github.com/Shadman-Samin/KrishiBondhuAIWeb.git
cd KrishiBondhuAIWeb/KrishiBondhuWeb
bun install
```

Create `KrishiBondhuWeb/.env.local` using [.env.example](KrishiBondhuWeb/.env.example). The main settings are:

```dotenv
VITE_BACKEND=space
VITE_SPACE_URL=https://hodoly163-krishibondhu-demo.hf.space
VITE_OPENWEATHER_API_KEY=your_openweather_key

VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

The current web source uses Firebase sign-in for the dashboard. Enable Google and/or email/password sign-in and authorize your local domain in Firebase. Without the required Firebase configuration, the dashboard displays a sign-in-unavailable notice. See the [frontend setup guide](KrishiBondhuWeb/README.md#authentication-firebase-auth) for the full configuration.

```sh
bun run dev
```

Open **http://localhost:8080**. Weather requires an OpenWeather key. Keep local environment files and provider credentials out of Git.

### Use A Local Backend

For backend development, use Python 3.10 and install the dependencies in a virtual environment. From `KrishiBondhuVision/`, on Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn api.server:app --host 127.0.0.1 --port 8000
```

The detection weights download from Hugging Face when first needed. Configure the language-model endpoint with `ADVISE_URL`, `ADVISE_MODEL`, and `ADVISE_API_KEY` in the backend's local `.env`; set `ADVISE_HOSTED` for the chosen hosted/local mode. Weather uses `OPENWEATHER_API_KEY`. The [model runtime guide](KrishiBondhuVision/MODELS.md) covers local LLM setup.

Set `VITE_BACKEND=fastapi` in the frontend environment and restart `bun run dev`. The Vite development server forwards API requests to port 8000. Frontend Firebase configuration is still required.

The root `start-dev.bat` is an alternative for an already configured Windows environment: it builds the web app, starts its SSR server and FastAPI, then opens an ngrok tunnel. It assumes local tools and LLM settings are ready and stops processes on its configured ports; inspect it before use.

## Further Reading

| Resource | Contents |
|---|---|
| [Frontend guide](KrishiBondhuWeb/README.md) | Authentication, environment variables, routes, build commands, and deployment. |
| [Mobile app repository](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App) | Flutter setup, voice permissions, backend configuration, and app builds. |
| [Mobile app releases](https://github.com/ausabbir76/Krsishi-Bondhu-AI-App/releases) | Published APKs and release notes. |
| [REST API contract](docs/API_FOR_APP.md) | Request/response formats and hosting behavior. |
| [Deployment notes](docs/DEPLOY.md) | Hosting setup and verification history. |
| [Vision model card](https://huggingface.co/hodoly163/krishibondhu-jktk) | Model provenance, metrics, and license. |
| [MCP guide](mcp-server/MCP.md) | Market tools, transports, and usage disclosures. |

## License

Proprietary: all rights reserved for our application code. The vision model is an AGPL-3.0-licensed Ultralytics YOLO11x derivative; see the [model card](https://huggingface.co/hodoly163/krishibondhu-jktk) for details. Third-party software retains its respective licenses. See the separate mobile repository for its licensing information.
