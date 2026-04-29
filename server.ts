import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy endpoint for Google Apps Script
  // This avoids CORS issues because the server makes the request, not the browser
  app.all("/api/proxy-gas", async (req, res) => {
    const gasUrl = req.query.url as string;
    if (!gasUrl) {
      return res.status(400).json({ error: "Missing URL parameter" });
    }

    try {
      const options: any = {
        method: req.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
        },
        redirect: 'follow',
        follow: 20
      };

      if (req.method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(gasUrl, {
        ...options,
        redirect: 'follow',
        follow: 20
      });
      
      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();
      
      // Log final URL and response info for debugging
      console.log(`GAS Proxy Request: ${gasUrl}`);
      console.log(`GAS Final URL: ${response.url}`);
      console.log(`GAS Status: ${response.status}`);
      console.log(`GAS Content-Type: ${contentType}`);

      if (response.url.includes("accounts.google.com") || response.url.includes("ServiceLogin")) {
        return res.status(401).json({ 
          error: "Authentication Required", 
          details: "Google Apps Script redirected to a login page. This means the script is NOT deployed with 'Anyone' access.",
          isHtml: true,
          finalUrl: response.url,
          htmlSnippet: text.substring(0, 1000) // Send snippet for debugging
        });
      }

      if (response.status >= 400) {
        return res.status(response.status).json({
          error: `Google returned ${response.status}`,
          details: text.substring(0, 1000),
          isHtml: text.includes("<!DOCTYPE html>")
        });
      }

      if (contentType.includes("application/json") || (text.trim().startsWith("{") && text.trim().endsWith("}")) || (text.trim().startsWith("[") && text.trim().endsWith("]"))) {
        try {
          const data = JSON.parse(text);
          res.json(data);
        } catch (e) {
          res.status(500).json({ 
            error: "JSON Parse Error",
            details: "The script returned something that looks like JSON but is invalid.",
            raw: text.substring(0, 200)
          });
        }
      } else if (text.includes("<!DOCTYPE html>") || text.includes("<html")) {
        res.status(401).json({ 
          error: "Authentication Required or Script Error", 
          details: "Google Apps Script returned an HTML page. This usually means the script is not deployed as 'Anyone' or requires authorization.",
          isHtml: true
        });
      } else {
        res.send(text);
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to proxy request to Google Apps Script" });
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
