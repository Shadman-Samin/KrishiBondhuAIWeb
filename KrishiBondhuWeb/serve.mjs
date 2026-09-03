import { createServer } from "node:http";
import app from "./dist/server/server.js";

const PORT = Number(process.env.PORT || 8001);

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    }
    const init = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      init.body = Buffer.concat(chunks);
    }
    const response = await app.fetch(new Request(url, init), {}, {});
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end((err && err.stack) || String(err));
  }
}).listen(PORT, "127.0.0.1", () => console.log(`app server on http://127.0.0.1:${PORT}`));
