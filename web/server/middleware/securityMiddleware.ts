/**
 * AGIES ALERT - Security Middleware
 * Provides comprehensive HTTP security headers, CORS enforcement, and CSRF protection.
 */

export class SecurityMiddleware {
  private static ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8081',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:8081',
  ];

  private static csrfTokenStore: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Generates standard aviation & defense grade security headers
   */
  public static getSecurityHeaders(origin?: string): Record<string, string> {
    const isAllowedOrigin = origin && this.ALLOWED_ORIGINS.includes(origin);
    const allowOriginHeader = isAllowedOrigin ? origin : 'http://localhost:5173';

    return {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://server.arcgisonline.com https://images.unsplash.com",
        "connect-src 'self' https://api.open-meteo.com https://nominatim.openstreetmap.org",
        "media-src 'self' data: blob:",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),

      // Defense against MIME confusion attacks
      'X-Content-Type-Options': 'nosniff',

      // Defense against clickjacking
      'X-Frame-Options': 'DENY',

      // Legacy XSS filter for older user agents
      'X-XSS-Protection': '1; mode=block',

      // Referrer privacy
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      // Restrict unauthorized browser feature execution
      'Permissions-Policy': 'geolocation=(self), camera=(self), microphone=(), payment=(), usb=()',

      // Cross-Origin Isolations
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',

      // HSTS (Strict Transport Security)
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

      // CORS Headers
      'Access-Control-Allow-Origin': allowOriginHeader,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };
  }

  /**
   * Generates a cryptographically strong CSRF token for a client session
   */
  public static generateCsrfToken(clientId: string): string {
    const token = `csrf_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`;
    // Expire token in 4 hours
    this.csrfTokenStore.set(clientId, {
      token,
      expiresAt: Date.now() + 4 * 60 * 60 * 1000,
    });
    return token;
  }

  /**
   * Validates the CSRF token on mutating requests
   */
  public static validateCsrfToken(clientId: string, providedToken?: string | null): boolean {
    if (!providedToken) return false;
    const record = this.csrfTokenStore.get(clientId);
    if (!record) return false;

    if (Date.now() > record.expiresAt) {
      this.csrfTokenStore.delete(clientId);
      return false;
    }

    return record.token === providedToken;
  }

  /**
   * Generates secure cookie options
   */
  public static getSecureCookieString(name: string, value: string, maxAgeSeconds: number = 86400): string {
    return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Strict`;
  }
}
