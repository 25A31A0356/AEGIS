import { Express, Request, Response } from "express";
import { sosService } from "./sosService";

export function registerSosRoutes(app: Express) {
  // 1. POST /api/v1/sos - Create Authoritative SOS Incident
  app.post(["/api/v1/sos", "/api/sos"], async (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      if (payload.latitude === undefined || payload.longitude === undefined) {
        return res.status(400).json({
          success: false,
          error: "Missing required location coordinates (latitude, longitude)",
        });
      }

      const incident = await sosService.createIncident(payload);
      res.status(201).json({
        success: true,
        source: "Aegis Software Authoritative Emergency Gateway",
        sosId: incident.id,
        data: incident,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to create SOS incident" });
    }
  });

  // 2. GET /api/v1/sos/offers - Get Nearby Masked Offers for Candidate Responders
  app.get(["/api/v1/sos/offers", "/api/sos/offers"], (req: Request, res: Response) => {
    try {
      const { responderId, latitude, longitude } = req.query;
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: "Missing latitude or longitude query parameters",
        });
      }

      const lat = parseFloat(String(latitude));
      const lng = parseFloat(String(longitude));
      const respId = typeof responderId === "string" ? responderId : "usr-anon-responder";

      const offers = sosService.getNearbyOffersForResponder(respId, lat, lng);
      res.json({
        success: true,
        source: "Aegis Software Proximity Dispatch",
        count: offers.length,
        data: offers,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to query nearby SOS offers" });
    }
  });

  // 3. GET /api/v1/sos - List Active Incidents
  app.get(["/api/v1/sos", "/api/sos"], (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radiusKm, excludeRequesterId } = req.query;
      const filter = {
        latitude: latitude ? parseFloat(String(latitude)) : undefined,
        longitude: longitude ? parseFloat(String(longitude)) : undefined,
        radiusKm: radiusKm ? parseFloat(String(radiusKm)) : undefined,
        excludeRequesterId: typeof excludeRequesterId === "string" ? excludeRequesterId : undefined,
      };

      const incidents = sosService.listActiveIncidents(filter);
      res.json({
        success: true,
        source: "Aegis Software Authoritative Emergency Gateway",
        count: incidents.length,
        data: incidents,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to list active SOS incidents" });
    }
  });

  // 4. GET /api/v1/sos/:id - Get Single SOS Incident
  app.get(["/api/v1/sos/:id", "/api/sos/:id"], (req: Request, res: Response) => {
    const incident = sosService.getIncident(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: "SOS incident not found" });
    }
    res.json({ success: true, data: incident });
  });

  // 5. POST /api/v1/sos/:id/accept - Authoritative Responder Acceptance
  app.post(["/api/v1/sos/:id/accept", "/api/sos/:id/accept"], (req: Request, res: Response) => {
    try {
      const { id, name, phone, badge, latitude, longitude, accuracy, address } = req.body || {};
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({
          success: false,
          error: "Missing responder location coordinates (latitude, longitude)",
        });
      }

      const responderId = id || `resp-${Date.now().toString(36)}`;
      const result = sosService.acceptSos(req.params.id, {
        id: responderId,
        name: name || "Community Responder",
        phone,
        badge,
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        accuracy: accuracy ? parseFloat(String(accuracy)) : 5,
        address,
      });

      if (!result.success) {
        if (result.alreadyAccepted) {
          return res.status(409).json({
            success: false,
            error: "This SOS has already been accepted.",
            alreadyAccepted: true,
          });
        }
        return res.status(400).json({ success: false, error: result.error });
      }

      res.json({
        success: true,
        message: "✓ Responder successfully assigned to emergency incident",
        data: result.incident,
        route: result.route,
        authorizedLocation: result.authorizedLocation,
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to process SOS acceptance" });
    }
  });

  // 6. POST /api/v1/sos/:id/decline - Decline Nearby SOS Offer
  app.post(["/api/v1/sos/:id/decline", "/api/sos/:id/decline"], (req: Request, res: Response) => {
    const { responderId } = req.body || {};
    const respId = typeof responderId === "string" ? responderId : "usr-anon-responder";
    const result = sosService.declineSos(req.params.id, respId);
    res.json(result);
  });

  // 7. PATCH /api/v1/sos/:id/location - Live Location Update
  app.patch(["/api/v1/sos/:id/location", "/api/sos/:id/location"], (req: Request, res: Response) => {
    try {
      const { role, latitude, longitude, accuracy, address } = req.body || {};
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, error: "Missing coordinates" });
      }

      const userRole = role === "responder" ? "responder" : "requester";
      const result = sosService.updateLocation(req.params.id, userRole, {
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        accuracy: accuracy ? parseFloat(String(accuracy)) : undefined,
        address,
      });

      if (!result.success) {
        return res.status(404).json({ success: false, error: "SOS incident not found" });
      }
      res.json({ success: true, data: result.incident });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to update location" });
    }
  });

  // 8. POST /api/v1/sos/:id/status - Status Lifecycle Transitions
  app.post(["/api/v1/sos/:id/status", "/api/sos/:id/status"], (req: Request, res: Response) => {
    try {
      const { status, reason } = req.body || {};
      if (!status) {
        return res.status(400).json({ success: false, error: "Missing status parameter" });
      }

      const result = sosService.updateStatus(req.params.id, status, reason);
      if (!result.success) {
        return res.status(404).json({ success: false, error: "SOS incident not found" });
      }
      res.json({ success: true, data: result.incident });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to update status" });
    }
  });

  // 9. GET /api/v1/sos/markers - Pan-India SOS Map Markers
  app.get(["/api/v1/sos/markers", "/api/sos/markers"], (req: Request, res: Response) => {
    try {
      const { state, role, userId } = req.query;
      const markers = sosService.getSosMapMarkers({
        state: typeof state === "string" ? state : undefined,
        role: role === "responder" || role === "admin" ? role : "citizen",
        userId: typeof userId === "string" ? userId : undefined,
      });

      res.json({
        success: true,
        source: "Aegis Software Pan-India SOS Map Gateway",
        count: markers.length,
        data: markers,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to query SOS markers" });
    }
  });

  // 10. GET /api/v1/activities - Canonical Recent Activities Feed
  app.get(["/api/v1/activities", "/api/activities"], (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 25;
      const activities = sosService.getRecentActivities(limit);
      res.json({
        success: true,
        source: "Aegis Canonical Emergency Activity Stream",
        count: activities.length,
        data: activities,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to query activities" });
    }
  });

  // 11. POST /api/v1/safe - Safe Check-In Broadcast
  app.post(["/api/v1/safe", "/api/safe"], (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      const checkIn = sosService.createSafeCheckIn(payload);
      res.status(201).json({
        success: true,
        source: "Aegis Software Safe Check-In Gateway",
        checkInId: checkIn.id,
        data: checkIn,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message || "Failed to submit Safe Check-In" });
    }
  });
}

