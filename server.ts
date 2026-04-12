import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { kv } from "@vercel/kv";
import { put } from "@vercel/blob";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "map-data.json");

// Helper to check if Vercel KV is configured
const isKvConfigured = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
// Helper to check if Vercel Blob is configured
const isBlobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API: Load Data
  app.get("/api/map-data", async (req, res) => {
    try {
      // 1. Try Vercel KV
      if (isKvConfigured) {
        const data = await kv.get("map-data");
        return res.json(data || { regions: [], clusters: [], areas: [], kecamatans: [] });
      }

      // 2. Try Vercel Blob
      if (isBlobConfigured) {
        try {
          const { blobs } = await import('@vercel/blob').then(m => m.list());
          const mapBlob = blobs.find(b => b.pathname === 'map-data.json');
          if (mapBlob) {
            const data = await fetch(mapBlob.url).then(r => r.json());
            return res.json(data);
          }
        } catch (e) {
          console.error("Blob load error:", e);
        }
        return res.json({ regions: [], clusters: [], areas: [], kecamatans: [] });
      }

      // 3. Fallback to Local File
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.json({ regions: [], clusters: [], areas: [], kecamatans: [] });
      }
      console.error("Load error:", error);
      res.status(500).json({ error: "Failed to load data" });
    }
  });

  // API: Save Data
  app.post("/api/map-data", async (req, res) => {
    try {
      // 1. Try Vercel KV
      if (isKvConfigured) {
        await kv.set("map-data", req.body);
        return res.json({ success: true });
      }

      // 2. Try Vercel Blob
      if (isBlobConfigured) {
        await put('map-data.json', JSON.stringify(req.body), {
          access: 'public',
          addRandomSuffix: false, // Keep the same filename
        });
        return res.json({ success: true });
      }

      // 3. Fallback to Local File
      await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
