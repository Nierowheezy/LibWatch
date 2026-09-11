import { pathToFileURL } from "url";
import { createApp } from "./app.js";
import { createServer as createViteServer } from "vite";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
  const app = await createApp();

  // Vite dev middleware only when running locally (NODE_ENV !== "production")
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the local server when this file is run directly (e.g. `npm run dev`)
const isMain =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  startServer().catch((err) => {
    console.error("Failed to start server:", err);
  });
}
