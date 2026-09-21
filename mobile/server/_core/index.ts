import "dotenv/config";
import express from "express";
import http, { createServer, type IncomingMessage } from "http";
import fs from "fs";
import path from "path";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { rateLimit } from "express-rate-limit";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerCommunityReportRoutes } from "../reportsRoutes";
import { registerSosRoutes } from "../sosRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";

// Rate limiters for abuse prevention and DoS protection
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // Native mobile apps or same-origin requests often omit the Origin header
  if (!isProduction) return true; // Allow all origins in development
  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(origin);
  }
  // Default trusted production domains
  return (
    origin.endsWith(".aegisalert.com") ||
    origin.endsWith(".tidbcloud.com") ||
    origin.startsWith("http://localhost") ||
    origin.startsWith("http://127.0.0.1")
  );
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust first proxy if behind Cloudflare/Render/AWS load balancer
  app.set("trust proxy", 1);

  // Secure CORS middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && isAllowedOrigin(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    } else if (!origin) {
      // Direct mobile app calls without Origin header
      res.header("Access-Control-Allow-Origin", "*");
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Apply general rate limiting across API endpoints
  app.use("/api", generalRateLimiter);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerCommunityReportRoutes(app);
  registerSosRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // Serve production static web build if dist directory exists
  const distPath = path.join(process.cwd(), "dist");

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      
      // Try serving exact route html if exists (e.g. dist/safe.html, dist/beacon.html)
      const sanitized = req.path.replace(/^\//, "").replace(/\/$/, "");
      const directHtml = path.join(distPath, `${sanitized}.html`);
      if (sanitized && fs.existsSync(directHtml)) {
        return res.sendFile(directHtml);
      }
      
      const indexFile = path.join(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      next();
    });
  } else {
    // Fallback reverse proxy to Metro dev server (port 8081)
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      const metroReq = http.request(
        {
          hostname: "127.0.0.1",
          port: 8081,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: "localhost:8081",
          },
        },
        (metroRes: IncomingMessage) => {
          res.writeHead(metroRes.statusCode || 200, metroRes.headers);
          metroRes.pipe(res);
        }
      );
      metroReq.on("error", () => {
        res.status(502).send("Frontend server starting up, please refresh in a moment...");
      });
      req.pipe(metroReq);
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
