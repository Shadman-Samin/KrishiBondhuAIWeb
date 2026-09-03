// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Dev server proxies API calls to the FastAPI backend so the whole app
    // works same-origin (needed when served through a single ngrok tunnel).
    server: {
      allowedHosts: true,
      proxy: {
        "/predict": "http://localhost:8000",
        "/advise": "http://localhost:8000",
        "/chat": "http://localhost:8000",
        "/health": "http://localhost:8000",
        "/market-prices": "http://localhost:8000",
      },
    },
  },
});
