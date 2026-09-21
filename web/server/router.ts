/**
 * AGIES ALERT - Unified Backend Request Router
 * Dispatches all REST endpoints with rate limiting, auth checks, schema validation, and proper HTTP status codes.
 */

import { RateLimiter } from './middleware/rateLimiter';
import { AuthMiddleware } from './middleware/authMiddleware';
import { ValidationMiddleware, ErrorHandler } from './middleware/validationMiddleware';
import { SecurityMiddleware } from './middleware/securityMiddleware';
import { SanitizationMiddleware } from './middleware/sanitizationMiddleware';
import { AuditLogger } from './services/AuditLogger';
import { AuthService } from './services/AuthService';
import { WeatherService } from './services/WeatherService';
import { AlertService } from './services/AlertService';
import { RiskService } from './services/RiskService';
import { AnalyticsService } from './services/AnalyticsService';
import { ReportService } from './services/ReportService';
import { LocationService } from './services/LocationService';
import { MapService } from './services/MapService';
import { AIService } from './services/AIService';
import { RealtimeHub } from './services/RealtimeHub';
import { SOSBackendService } from './services/SOSBackendService';
import { SAFETY_GUIDES } from '../src/data/safetyGuidesData';

export interface HttpRequestContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  clientIp?: string;
}

export interface HttpResponseContext {
  status: number;
  headers: Record<string, string>;
  body: any;
}

export async function handleBackendApiRequest(req: HttpRequestContext): Promise<HttpResponseContext> {
  const { method, path, query, headers, body } = req;
  const clientIp = req.clientIp || (headers['x-forwarded-for'] as string) || '127.0.0.1';
  const origin = (headers['origin'] as string) || (headers['host'] ? `http://${headers['host']}` : undefined);
  const baseSecurityHeaders = SecurityMiddleware.getSecurityHeaders(origin);

  // 1. CORS Preflight OPTIONS Handling
  if (method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        ...baseSecurityHeaders,
        'Content-Type': 'application/json',
      },
      body: '',
    };
  }

  // 2. Sliding Window Endpoint Rate Limiting
  const rateLimit = RateLimiter.check(clientIp, path);
  if (!rateLimit.allowed) {
    AuditLogger.log({
      action: 'RATE_LIMIT_BLOCKED',
      severity: 'WARN',
      clientIp,
      details: { path, limit: rateLimit.limit },
    });

    const err = ErrorHandler.createError(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests sent to the emergency intelligence API. Please wait a moment before trying again.',
      429,
      { resetTime: new Date(rateLimit.resetTime).toISOString() }
    );
    return {
      status: err.status,
      headers: {
        ...baseSecurityHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimit.resetTime.toString(),
      },
      body: err.body,
    };
  }

  // 3. Extract and Verify Authentication Context
  const authHeader = (headers['authorization'] as string) || undefined;
  const auth = AuthMiddleware.authenticate(authHeader, clientIp);

  // Attach rate limit and security headers helper
  const attachHeaders = (customHeaders?: Record<string, string>): Record<string, string> => ({
    ...baseSecurityHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': rateLimit.limit.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': rateLimit.resetTime.toString(),
    ...(customHeaders || {}),
  });

  try {
    // -------------------------------------------------------------
    // GET /api/health or GET /api/info or GET /api/discovery
    // Safe Public API Discovery (No Secrets Exposed)
    // -------------------------------------------------------------
    if (method === 'GET' && (path === '/api/health' || path === '/api/info' || path === '/api/discovery')) {
      const discoveryInfo = {
        name: 'Aegis Software Disaster Intelligence API',
        version: '2.0.0',
        apiVersion: 'v1',
        status: 'HEALTHY',
        serverTime: new Date().toISOString(),
        endpoints: {
          discovery: '/api/discovery',
          health: '/api/health',
          weather: '/api/weather',
          alerts: '/api/alerts',
          nearbyAlerts: '/api/alerts/nearby',
          activity: '/api/v1/activity',
          events: '/api/v1/events',
          eventsPoll: '/api/events/poll',
          sos: '/api/v1/sos',
          sosNearby: '/api/v1/sos/nearby',
          safe: '/api/v1/safe',
          mapLayers: '/api/map/layers',
          mapEvents: '/api/map/events',
          reports: '/api/reports',
          reportMedia: '/api/reports/media',
          analytics: '/api/analytics',
          risk: '/api/risk',
          safetyGuides: '/api/safety-guides',
          aiChat: '/api/ai/chat',
          csrfToken: '/api/csrf-token',
          authLogin: '/api/auth/login',
          authMe: '/api/auth/me',
        },
        supportedHazardCategories: [
          'flood',
          'flash_flood',
          'cyclone',
          'earthquake',
          'wildfire',
          'heatwave',
          'coldwave',
          'heavy_rain',
          'thunderstorm',
          'lightning',
          'landslide',
          'building_collapse',
        ],
        authMethods: ['Bearer JWT', 'CSRF Token Handshake'],
        dataAuthorities: [
          'India Meteorological Department (IMD)',
          'Central Water Commission (CWC)',
          'National Disaster Management Authority (NDMA)',
          'National Center for Seismology (NCS)',
        ],
        clientConfig: {
          rateLimitWindowMs: 60000,
          rateLimitMax: 100,
          maxImageUploadMb: 10,
          maxVideoUploadMb: 50,
          allowedMediaMimeTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
        },
      };

      const res = ErrorHandler.createResponse(discoveryInfo);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/csrf-token
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/csrf-token') {
      const csrfToken = SecurityMiddleware.generateCsrfToken(clientIp);
      const res = ErrorHandler.createResponse({ csrfToken });
      return {
        status: res.status,
        headers: attachHeaders({
          'Set-Cookie': SecurityMiddleware.getSecureCookieString('agies_csrf', csrfToken, 14400),
        }),
        body: res.body,
      };
    }

    // -------------------------------------------------------------
    // POST /api/auth/login
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/auth/login') {
      const sanitized = SanitizationMiddleware.sanitizeObject(body || {});
      if (sanitized.hasSecurityThreat) {
        const err = ErrorHandler.createError('SECURITY_VIOLATION', 'Invalid characters in login payload.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const loginResult = await AuthService.login(sanitized.sanitized);
      AuditLogger.log({
        action: 'USER_LOGIN_SUCCESS',
        severity: 'INFO',
        clientIp,
        userId: loginResult.user.id,
        userRole: loginResult.user.role,
        details: { email: loginResult.user.email },
      });

      const res = ErrorHandler.createResponse(loginResult);
      return {
        status: res.status,
        headers: attachHeaders({
          'Set-Cookie': SecurityMiddleware.getSecureCookieString('agies_session', loginResult.token, 86400),
        }),
        body: res.body,
      };
    }

    // -------------------------------------------------------------
    // GET /api/auth/me
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/auth/me') {
      if (!auth.isAuthenticated || !auth.user) {
        const err = ErrorHandler.createError('UNAUTHORIZED', 'Missing or invalid authentication token.', 401);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse({ user: auth.user, isAuthenticated: true });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/admin/audit-logs (Protected: Official & Admin Only)
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/admin/audit-logs') {
      if (!auth.isAuthenticated || !auth.user) {
        const err = ErrorHandler.createError('UNAUTHORIZED', 'Authentication required to access audit logs.', 401);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const isAuthorized = AuthMiddleware.authorizeRole(auth, ['admin', 'official', 'sdrf_officer']);
      if (!isAuthorized) {
        AuditLogger.log({
          action: 'RBAC_ACCESS_DENIED',
          severity: 'SECURITY_ALERT',
          clientIp,
          userId: auth.user.id,
          userRole: auth.user.role,
          details: { endpoint: '/api/admin/audit-logs', requiredRole: 'admin/official' },
        });

        const err = ErrorHandler.createError('FORBIDDEN', 'Access denied. Insufficient administrative privileges.', 403);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const logs = AuditLogger.getLogs({
        severity: query.severity as any,
        action: query.action,
        limit: query.limit ? parseInt(query.limit, 10) : 50,
      });

      const res = ErrorHandler.createResponse({ logs, total: logs.length });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/admin/system-status (Protected: Admin Only)
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/admin/system-status') {
      if (!auth.isAuthenticated || !auth.user) {
        const err = ErrorHandler.createError('UNAUTHORIZED', 'Authentication required for system status.', 401);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      if (!AuthMiddleware.authorizeRole(auth, ['admin'])) {
        const err = ErrorHandler.createError('FORBIDDEN', 'Access restricted to system administrators.', 403);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const statusData = {
        serverTime: new Date().toISOString(),
        securityPosture: 'HARDENED',
        rateLimiting: 'ACTIVE',
        corsPolicy: 'STRICT',
        postgisStatus: 'HEALTHY',
        activeAlertsCount: 14,
        auditLogsCount: AuditLogger.getLogs().length,
      };

      const res = ErrorHandler.createResponse(statusData);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/alerts
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/alerts') {
      const alerts = await AlertService.getAlerts({
        category: query.category ? SanitizationMiddleware.stripHtmlTags(query.category) : undefined,
        severity: query.severity ? SanitizationMiddleware.stripHtmlTags(query.severity) : undefined,
        stateId: query.stateId ? SanitizationMiddleware.stripHtmlTags(query.stateId) : undefined,
        status: query.status ? SanitizationMiddleware.stripHtmlTags(query.status) : undefined,
      });
      const res = ErrorHandler.createResponse(alerts);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/alerts/nearby
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/alerts/nearby') {
      const lat = parseFloat(query.lat || '19.0760');
      const lng = parseFloat(query.lng || '72.8777');
      const radiusKm = parseFloat(query.radiusKm || '100');

      if (isNaN(lat) || isNaN(lng) || !SanitizationMiddleware.validateCoordinates(lat, lng)) {
        const err = ErrorHandler.createError('INVALID_COORDINATES', 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const alerts = await AlertService.getNearbyAlerts(lat, lng, radiusKm);
      const res = ErrorHandler.createResponse(alerts);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/weather
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/weather') {
      const lat = query.lat ? parseFloat(query.lat) : undefined;
      const lng = query.lng ? parseFloat(query.lng) : undefined;
      const city = query.city ? SanitizationMiddleware.stripHtmlTags(query.city) : undefined;

      if (lat !== undefined && lng !== undefined && !SanitizationMiddleware.validateCoordinates(lat, lng)) {
        const err = ErrorHandler.createError('INVALID_COORDINATES', 'Supplied coordinates are out of valid bounds.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const weather = await WeatherService.getWeather(lat, lng, city);
      const res = ErrorHandler.createResponse(weather);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/risk
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/risk') {
      const lat = query.lat ? parseFloat(query.lat) : undefined;
      const lng = query.lng ? parseFloat(query.lng) : undefined;
      const stateId = query.stateId ? SanitizationMiddleware.stripHtmlTags(query.stateId) : undefined;

      if (lat !== undefined && lng !== undefined && !SanitizationMiddleware.validateCoordinates(lat, lng)) {
        const err = ErrorHandler.createError('INVALID_COORDINATES', 'Supplied coordinates are out of valid bounds.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const risk = await RiskService.evaluateRisk(lat, lng, stateId);
      const res = ErrorHandler.createResponse(risk);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/hazards
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/hazards') {
      const alerts = await AlertService.getAlerts();
      const res = ErrorHandler.createResponse(alerts);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/safety-guides
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/safety-guides') {
      const slug = query.slug ? SanitizationMiddleware.stripHtmlTags(query.slug) : undefined;
      if (slug && SAFETY_GUIDES[slug]) {
        const res = ErrorHandler.createResponse(SAFETY_GUIDES[slug]);
        return { status: res.status, headers: attachHeaders(), body: res.body };
      }
      const res = ErrorHandler.createResponse(Object.values(SAFETY_GUIDES));
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/analytics
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/analytics') {
      const location = query.location ? SanitizationMiddleware.stripHtmlTags(query.location) : undefined;
      const hazard = query.hazard ? SanitizationMiddleware.stripHtmlTags(query.hazard) : undefined;
      const dateRange = query.dateRange ? SanitizationMiddleware.stripHtmlTags(query.dateRange) : undefined;

      const analytics = await AnalyticsService.getAnalytics({ location, hazard, dateRange });
      const res = ErrorHandler.createResponse(analytics);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/map/events
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/map/events') {
      const lat = query.lat ? parseFloat(query.lat) : undefined;
      const lng = query.lng ? parseFloat(query.lng) : undefined;
      const events = await MapService.getMapEvents(lat, lng);
      const res = ErrorHandler.createResponse(events);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/map/layers
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/map/layers') {
      const lat = query.lat ? parseFloat(query.lat) : undefined;
      const lng = query.lng ? parseFloat(query.lng) : undefined;
      const layers = await MapService.getMapLayers(lat, lng);
      const res = ErrorHandler.createResponse(layers);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/locations
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/locations') {
      const locations = await LocationService.getSavedLocations();
      const res = ErrorHandler.createResponse(locations);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/locations
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/locations') {
      const validation = ValidationMiddleware.validateLocationCreation(body);
      if (!validation.valid) {
        const err = ErrorHandler.createError('VALIDATION_ERROR', 'Invalid location payload.', 400, validation.errors);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const added = await LocationService.addSavedLocation(validation.sanitizedBody);
      const res = ErrorHandler.createResponse(added, 201);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // DELETE /api/locations/:id
    // -------------------------------------------------------------
    if (method === 'DELETE' && path.startsWith('/api/locations/')) {
      const id = SanitizationMiddleware.stripHtmlTags(path.replace('/api/locations/', ''));
      const deleted = await LocationService.deleteSavedLocation(id);
      if (!deleted) {
        const err = ErrorHandler.createError('NOT_FOUND', `Saved location "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse({ id, deleted: true });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/v1/activity or GET /api/activity
    // Real-time Unified Intelligence & Community Activity Feed
    // -------------------------------------------------------------
    if (method === 'GET' && (path === '/api/v1/activity' || path === '/api/activity')) {
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const activities: any[] = [];

      // 1. Gather real citizen reports
      const reports = await ReportService.getReports(limit);
      for (const rep of reports) {
        activities.push({
          id: rep.id || `act-rep-${rep.trackingId}`,
          trackingId: rep.trackingId,
          timestamp: rep.submittedAt || new Date().toISOString(),
          relativeTime: 'Recent',
          category: 'incident_detected',
          scope: 'india',
          title: rep.title || `Citizen Incident: ${rep.hazardType} Reported`,
          description: rep.description,
          severity: rep.severity === 'critical' ? 'critical' : rep.severity === 'high' ? 'warning' : 'moderate',
          sourceAgency: 'Citizen Intelligence Network',
          sourceType: 'citizen',
          locationTag: `${rep.location?.city || rep.location?.address || 'Local Area'}, ${rep.location?.state || 'India'}`,
          coordinates: rep.location?.lat && rep.location?.lng ? [rep.location.lat, rep.location.lng] : undefined,
          metricsBadge: rep.status === 'verified' ? 'Verified by Ops' : rep.status === 'dispatched' ? 'Unit Dispatched' : 'Pending Verification',
          isVerified: rep.status === 'verified' || rep.status === 'dispatched',
          status: rep.status,
          actionUrl: `/live-map?reportId=${rep.trackingId || rep.id}`,
        });
      }

      // 2. Gather real active SOS distress signals
      const beacons = await SOSBackendService.getBeacons();
      for (const b of beacons) {
        activities.push({
          id: `act-sos-${b.id}`,
          trackingId: b.id,
          timestamp: b.updatedAt || b.createdAt || b.timestamp,
          relativeTime: 'Live',
          category: 'sos_dispatch',
          scope: 'india',
          title: `🚨 SOS Distress Beacon: ${b.emergencyTitle || b.emergencyType}`,
          description: `Emergency distress call reported in ${b.locationName || b.district}. Status: ${b.triageStatus}.`,
          severity: b.severity || 'critical',
          sourceAgency: 'AEGIS SOS Dispatch Grid',
          sourceType: 'emergency_sos',
          locationTag: `${b.district}, ${b.state}`,
          coordinates: b.coordinates,
          metricsBadge: b.triageStatus === 'RESPONDER_EN_ROUTE' ? `Unit En Route (ETA ${b.assignedUnit?.etaMinutes || 8}m)` : b.triageStatus,
          isVerified: true,
          status: b.triageStatus,
          actionUrl: `/sos`,
        });
      }

      // 3. Gather real active alerts
      const alerts = await AlertService.getAlerts();
      for (const alt of alerts.slice(0, 20)) {
        activities.push({
          id: `act-alt-${alt.id}`,
          trackingId: alt.source?.bulletinId || alt.id,
          timestamp: alt.source?.publishedAt || alt.issuedAt || new Date().toISOString(),
          relativeTime: 'Active',
          category: 'official_alert',
          hazardCategory: alt.category,
          scope: 'india',
          title: alt.title || 'Official Meteorological Advisory',
          description: alt.headline || alt.description,
          severity: alt.severity === 'critical' ? 'critical' : alt.severity === 'warning' ? 'warning' : 'moderate',
          sourceAgency: alt.source?.agency || 'India Meteorological Department (IMD)',
          sourceType: 'official',
          locationTag: `${alt.location?.district || alt.location?.city || alt.location?.state || 'India'}`,
          coordinates: alt.location?.coordinates,
          metricsBadge: alt.metrics?.intensity || 'Official Bulletin',
          isVerified: true,
          status: alt.status,
          actionUrl: `/hazards?hazardId=${alt.id}`,
        });
      }

      // Sort chronological descending
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const res = ErrorHandler.createResponse({
        activities: activities.slice(0, limit),
        total: activities.length,
        serverTime: new Date().toISOString(),
      });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/v1/events or GET /api/events/poll or GET /api/events
    // Real-time Event Polling Buffer
    // -------------------------------------------------------------
    if (method === 'GET' && (path === '/api/v1/events' || path === '/api/events/poll' || path === '/api/events')) {
      const since = query.since ? SanitizationMiddleware.stripHtmlTags(query.since) : undefined;
      const events = RealtimeHub.getEventsSince(since);
      const res = ErrorHandler.createResponse({
        events,
        count: events.length,
        serverTime: new Date().toISOString(),
      });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/reports
    // -------------------------------------------------------------
    if (method === 'GET' && path === '/api/reports') {
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const reports = await ReportService.getReports(limit);
      const res = ErrorHandler.createResponse(reports);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/reports
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/reports') {
      const validation = ValidationMiddleware.validateReportSubmission(body);
      if (!validation.valid) {
        const err = ErrorHandler.createError('VALIDATION_ERROR', 'Invalid incident report submission.', 400, validation.errors);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const created = await ReportService.createReport(validation.sanitizedBody, clientIp);
      const res = ErrorHandler.createResponse(created, 201);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/reports/media (Strict Server-Side Validation)
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/reports/media') {
      if (!body || !body.fileName) {
        const err = ErrorHandler.createError('BAD_REQUEST', 'fileName is required for media upload.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      try {
        const uploaded = await ReportService.processMediaUpload(body, clientIp);
        const res = ErrorHandler.createResponse(uploaded, 201);
        return { status: res.status, headers: attachHeaders(), body: res.body };
      } catch (uploadErr: any) {
        const err = ErrorHandler.createError('FILE_REJECTED', uploadErr.message || 'File upload rejected by security filter.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
    }

    // -------------------------------------------------------------
    // GET /api/v1/sos or GET /api/sos
    // -------------------------------------------------------------
    if (method === 'GET' && (path === '/api/v1/sos' || path === '/api/sos')) {
      const isOperator = auth.isAuthenticated && AuthMiddleware.authorizeRole(auth, ['admin', 'official', 'sdrf_officer']);
      const statusFilter = query.status ? SanitizationMiddleware.stripHtmlTags(query.status) : undefined;
      const beacons = await SOSBackendService.getBeacons({ status: statusFilter, isOperator });
      const res = ErrorHandler.createResponse({ beacons, total: beacons.length });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/v1/sos/nearby or GET /api/sos/nearby
    // -------------------------------------------------------------
    if (method === 'GET' && (path === '/api/v1/sos/nearby' || path === '/api/sos/nearby')) {
      const lat = parseFloat(query.lat || '19.0760');
      const lng = parseFloat(query.lng || '72.8777');
      const radiusKm = parseFloat(query.radiusKm || '50');

      if (isNaN(lat) || isNaN(lng) || !SanitizationMiddleware.validateCoordinates(lat, lng)) {
        const err = ErrorHandler.createError('INVALID_COORDINATES', 'Valid latitude and longitude coordinates are required.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const beacons = await SOSBackendService.getNearbyBeacons(lat, lng, radiusKm);
      const res = ErrorHandler.createResponse({ beacons, total: beacons.length });
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos or POST /api/sos (Trigger Distress Beacon)
    // -------------------------------------------------------------
    if (method === 'POST' && (path === '/api/v1/sos' || path === '/api/sos')) {
      const sanitized = SanitizationMiddleware.sanitizeObject(body || {});
      const created = await SOSBackendService.createSOS(sanitized.sanitized, clientIp);
      const res = ErrorHandler.createResponse(created, 201);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/safe or POST /api/safe (Citizen Safety Check-in)
    // -------------------------------------------------------------
    if (method === 'POST' && (path === '/api/v1/safe' || path === '/api/safe')) {
      const sanitized = SanitizationMiddleware.sanitizeObject(body || {}).sanitized;
      const safeReport = {
        id: `safe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: SanitizationMiddleware.stripHtmlTags(sanitized?.name || 'Citizen'),
        phone: SanitizationMiddleware.stripHtmlTags(sanitized?.phone || '+91 98000 00000'),
        city: SanitizationMiddleware.stripHtmlTags(sanitized?.city || 'Current Sector'),
        state: SanitizationMiddleware.stripHtmlTags(sanitized?.state || 'India'),
        coordinates: Array.isArray(sanitized?.coordinates) && sanitized.coordinates.length === 2 ? sanitized.coordinates : [20.5937, 78.9629],
        notes: SanitizationMiddleware.stripHtmlTags(sanitized?.notes || 'Citizen safe and accounted for.'),
        familyContactsCount: Array.isArray(sanitized?.familyContacts) ? sanitized.familyContacts.length : 0,
        confirmedAt: new Date().toISOString(),
        status: 'SAFE',
      };

      // Broadcast real-time SAFE_REPORTED event
      RealtimeHub.broadcast({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'SAFE_REPORTED',
        timestamp: safeReport.confirmedAt,
        data: safeReport,
      });

      AuditLogger.log({
        action: 'CITIZEN_SAFE_REPORTED',
        severity: 'INFO',
        clientIp,
        details: { city: safeReport.city, state: safeReport.state, contactsNotified: safeReport.familyContactsCount },
      });

      const res = ErrorHandler.createResponse(safeReport, 201);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // GET /api/v1/sos/:id or GET /api/sos/:id
    // -------------------------------------------------------------
    if (method === 'GET' && (path.startsWith('/api/v1/sos/') || path.startsWith('/api/sos/'))) {
      const id = SanitizationMiddleware.stripHtmlTags(path.replace(/^\/api\/(v1\/)?sos\//, ''));
      const isOperator = auth.isAuthenticated && AuthMiddleware.authorizeRole(auth, ['admin', 'official', 'sdrf_officer']);
      const beacon = await SOSBackendService.getBeaconById(id, isOperator);
      if (!beacon) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS distress signal "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(beacon);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/acknowledge
    // -------------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/acknowledge$/)) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/acknowledge$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const actor = (body?.actor && SanitizationMiddleware.stripHtmlTags(body.actor)) || (auth.user ? auth.user.name : 'Operations Dispatcher');
      const notes = body?.notes ? SanitizationMiddleware.stripHtmlTags(body.notes) : undefined;
      const updated = await SOSBackendService.acknowledgeSOS(id, actor, notes);
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS beacon "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/dispatch or POST /api/v1/sos/:id/accept
    // -------------------------------------------------------------
    if (method === 'POST' && (path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/dispatch$/) || path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/accept$/))) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/(dispatch|accept)$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const actor = (body?.actor && SanitizationMiddleware.stripHtmlTags(body.actor)) || (auth.user ? auth.user.name : 'Central Command');
      const updated = await SOSBackendService.dispatchUnit(id, body?.unitData || body, actor);
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS beacon "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/responder-location
    // -------------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/responder-location$/)) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/responder-location$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const coords = body?.coordinates || body?.responderCoordinates;
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        const err = ErrorHandler.createError('INVALID_COORDINATES', 'Valid [lat, lng] coordinates are required for responder location.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const updated = await SOSBackendService.updateResponderLocation(
        id,
        [coords[0], coords[1]],
        body?.etaMinutes,
        body?.distanceKm
      );
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `Active SOS beacon or unit "${id}" not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/location (Requester Live GPS update)
    // -------------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/location$/)) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/location$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const coords = body?.coordinates;
      if (!coords || !Array.isArray(coords) || coords.length !== 2) {
        const err = ErrorHandler.createError('INVALID_COORDINATES', 'Valid [lat, lng] coordinates are required.', 400);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const updated = await SOSBackendService.updateRequesterLocation(
        id,
        [coords[0], coords[1]],
        body?.accuracyMeters,
        body?.batteryPercent
      );
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS beacon "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/on-site
    // -------------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/on-site$/)) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/on-site$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const actor = (body?.actor && SanitizationMiddleware.stripHtmlTags(body.actor)) || 'Responder Unit';
      const updated = await SOSBackendService.markOnSite(id, actor);
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS beacon "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/resolve
    // -------------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/resolve$/)) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/resolve$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const actor = (body?.actor && SanitizationMiddleware.stripHtmlTags(body.actor)) || (auth.user ? auth.user.name : 'Operations Supervisor');
      const notes = body?.notes ? SanitizationMiddleware.stripHtmlTags(body.notes) : undefined;
      const updated = await SOSBackendService.resolveSOS(id, actor, notes);
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS beacon "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/v1/sos/:id/cancel
    // -------------------------------------------------------------
    if (method === 'POST' && path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/cancel$/)) {
      const match = path.match(/^\/api\/(v1\/)?sos\/([^/]+)\/cancel$/);
      const id = SanitizationMiddleware.stripHtmlTags(match![2]);
      const actor = (body?.actor && SanitizationMiddleware.stripHtmlTags(body.actor)) || 'Citizen App User';
      const reason = body?.reason ? SanitizationMiddleware.stripHtmlTags(body.reason) : undefined;
      const updated = await SOSBackendService.cancelSOS(id, actor, reason);
      if (!updated) {
        const err = ErrorHandler.createError('NOT_FOUND', `SOS beacon "${id}" was not found.`, 404);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }
      const res = ErrorHandler.createResponse(updated);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // -------------------------------------------------------------
    // POST /api/ai/chat
    // -------------------------------------------------------------
    if (method === 'POST' && path === '/api/ai/chat') {
      const validation = ValidationMiddleware.validateAIChatRequest(body);
      if (!validation.valid) {
        const err = ErrorHandler.createError('VALIDATION_ERROR', 'Invalid AI chat request format.', 400, validation.errors);
        return { status: err.status, headers: attachHeaders(), body: err.body };
      }

      const aiResponse = await AIService.processMessage(validation.sanitizedBody);
      const res = ErrorHandler.createResponse(aiResponse);
      return { status: res.status, headers: attachHeaders(), body: res.body };
    }

    // Route Not Found (404)
    const notFoundErr = ErrorHandler.createError(
      'ROUTE_NOT_FOUND',
      `The requested endpoint ${method} ${path} does not exist on AGIES ALERT backend.`,
      404
    );
    return { status: notFoundErr.status, headers: attachHeaders(), body: notFoundErr.body };
  } catch (serverErr: any) {
    console.error('[AGIES Backend Error]', serverErr);
    // Redact stack traces and internal secrets from error response
    const internalErr = ErrorHandler.createError(
      'INTERNAL_SERVER_ERROR',
      'An unexpected error occurred while processing emergency intelligence.',
      500
    );
    return { status: internalErr.status, headers: attachHeaders(), body: internalErr.body };
  }
}
