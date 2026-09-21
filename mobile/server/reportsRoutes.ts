import { Express, Request, Response } from "express";
import { reportsService } from "./reportsService";
import { sosService } from "./sosService";

export function registerCommunityReportRoutes(app: Express) {
  // 1. GET /api/v1/reports - List authoritative reports
  app.get(["/api/v1/reports", "/api/reports"], (req: Request, res: Response) => {
    try {
      const { category, severity, status, verificationStatus, limit } = req.query;
      const reports = reportsService.listReports({
        category: typeof category === "string" ? category : undefined,
        severity: typeof severity === "string" ? severity : undefined,
        status: typeof status === "string" ? status : undefined,
        verificationStatus: typeof verificationStatus === "string" ? verificationStatus : undefined,
        limit: limit ? parseInt(String(limit), 10) : undefined,
      });

      res.json({
        success: true,
        source: "Aegis Software Authoritative Database",
        count: reports.length,
        data: reports,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to list reports" });
    }
  });

  // 2. POST /api/v1/reports - Create authoritative report
  app.post(["/api/v1/reports", "/api/reports"], async (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      if (!payload.hazard && !payload.details && !payload.description && !payload.title) {
        return res.status(400).json({
          success: false,
          error: "Missing required report content (hazard, title, or details)",
        });
      }

      const report = await reportsService.createReport(payload);
      res.status(201).json({
        success: true,
        source: "Aegis Software Authoritative Database",
        reportId: report.id,
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to create report" });
    }
  });

  // 3. GET /api/v1/reports/:id - Get single authoritative report
  app.get(["/api/v1/reports/:id", "/api/reports/:id"], (req: Request, res: Response) => {
    const report = reportsService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    res.json({ success: true, data: report });
  });

  // 4. PATCH /api/v1/reports/:id/status - Update report status
  app.patch(["/api/v1/reports/:id/status", "/api/reports/:id/status"], (req: Request, res: Response) => {
    const { status, verificationStatus } = req.body || {};
    if (!status && !verificationStatus) {
      return res.status(400).json({ success: false, error: "Must specify status or verificationStatus" });
    }

    const updated = reportsService.updateReportStatus(req.params.id, status, verificationStatus);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    res.json({ success: true, data: updated });
  });

  // 5. POST /api/v1/reports/:id/upvote - Upvote report
  app.post(["/api/v1/reports/:id/upvote", "/api/reports/:id/upvote"], (req: Request, res: Response) => {
    const updated = reportsService.upvoteReport(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    res.json({ success: true, data: updated });
  });

  // 6. GET /api/v1/realtime & /api/realtime/stream - Server-Sent Events (SSE) Real-Time Stream
  app.get(["/api/v1/realtime", "/api/realtime/stream", "/api/realtime"], (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering (Nginx)

    if (res.flushHeaders) {
      res.flushHeaders();
    }

    // Initial handshake message
    const handshake = {
      type: "connected",
      timestamp: new Date().toISOString(),
      data: {
        server: "Aegis Software Realtime Gateway",
        status: "LIVE",
        reportsCount: reportsService.listReports().length,
      },
    };
    res.write(`data: ${JSON.stringify(handshake)}\n\n`);

    // Register real-time event listeners for reports and SOS incidents
    const cleanupReports = reportsService.registerRealtimeListener((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const cleanupSos = sosService.registerRealtimeListener((event) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Heartbeat ping every 20 seconds to maintain connection
    const interval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: "ping", timestamp: new Date().toISOString() })}\n\n`);
    }, 20000);

    req.on("close", () => {
      clearInterval(interval);
      cleanupReports();
      cleanupSos();
    });
  });
}

