import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  /**
   * PORT CONFIGURATION:
   * AI Studio preview usually requires port 3000.
   * On your server (heart.styni.com), we use 3009 to avoid conflicts.
   */
  const PORT = Number(process.env.PORT) || 3009;

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Mode: DEVELOPMENT (Vite Middleware)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Mode: PRODUCTION (Static Assets)");
    const distPath = path.resolve(__dirname, "dist");
    
    console.log(`[Server] Production mode active.`);
    console.log(`[Server] Serving static files from: ${distPath}`);
    
    // Safety check: is distPath valid?
    import("fs").then(fs => {
      if (!fs.existsSync(distPath)) {
        console.error(`[Server] ERROR: 'dist' folder NOT FOUND at ${distPath}`);
      } else {
        console.log(`[Server] 'dist' folder found.`);
      }
    });
    
    app.use(express.static(distPath));
    
    // SPA Fallback: handle client-side routing
    app.get("*", (req, res) => {
      // If it's an API request (if you add any) or an asset request that missed, return 404
      if (req.path.startsWith("/api") || (req.path.includes(".") && !req.path.endsWith(".html"))) {
        return res.status(404).send("Not found");
      }
      
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html from ${indexPath}: ${err.message}`);
          res.status(500).send("Application not built. Please run 'npm run build' on the server.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
