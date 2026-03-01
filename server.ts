import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { apiRouter } from "./src/server/api.js";
import { seedDatabase } from "./src/server/seed.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Seed database
  seedDatabase();

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", apiRouter);

  // Vite middleware for development
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

startServer();
