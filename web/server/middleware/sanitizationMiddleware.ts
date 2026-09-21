/**
 * AGIES ALERT - Input Sanitization, XSS Protection & SQLi Prevention Middleware
 * Sanitizes all client inputs, protects against injection attacks, and validates geometry boundaries.
 */

export class SanitizationMiddleware {
  // Regex patterns targeting dangerous SQL injection signatures
  private static readonly SQLI_PATTERNS = [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|UNION|EXEC|TRUNCATE|GRANT|REVOKE)\b[\s\S]+\b(FROM|INTO|TABLE|DATABASE|WHERE|JOIN)\b/i,
    /('|\b)(OR|AND)\b[\s\S]+(=|>|<|LIKE)[\s\S]+/i,
    /(--|#|\/\*|\*\/|;[\s]*DROP|;[\s]*DELETE|;[\s]*UPDATE)/i,
    /'\s*OR\s*'\d+'\s*=\s*'\d+/i,
    /"\s*OR\s*"\d+"\s*=\s*"\d+/i,
  ];

  // Regex patterns targeting Cross-Site Scripting (XSS) vectors
  private static readonly XSS_PATTERNS = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /<[\s\S]*?\bon\w+\s*=[\s\S]*?>/gi,
    /javascript\s*:\s*[\s\S]*/gi,
    /data\s*:\s*text\/html[\s\S]*/gi,
    /vbscript\s*:\s*[\s\S]*/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
  ];

  /**
   * Encodes HTML special characters to prevent DOM-based and Reflected XSS
   */
  public static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Strips raw HTML tags from rich text input
   */
  public static stripHtmlTags(input: string): string {
    if (typeof input !== 'string') return '';
    return input.replace(/<\/?[^>]+(>|$)/g, '').trim();
  }

  /**
   * Detects potential SQL Injection attack payloads
   */
  public static containsSqlInjection(input: string): boolean {
    if (typeof input !== 'string') return false;
    return this.SQLI_PATTERNS.some((pattern) => pattern.test(input));
  }

  /**
   * Detects potential Cross-Site Scripting (XSS) attack payloads
   */
  public static containsXssPayload(input: string): boolean {
    if (typeof input !== 'string') return false;
    return this.XSS_PATTERNS.some((pattern) => pattern.test(input));
  }

  /**
   * Recursively inspects and sanitizes object payloads
   */
  public static sanitizeObject<T>(obj: T): { sanitized: T; hasSecurityThreat: boolean; threatReason?: string } {
    if (obj === null || obj === undefined) {
      return { sanitized: obj, hasSecurityThreat: false };
    }

    if (typeof obj === 'string') {
      if (this.containsSqlInjection(obj)) {
        return {
          sanitized: this.stripHtmlTags(obj) as any,
          hasSecurityThreat: true,
          threatReason: 'Potential SQL Injection signature detected in payload.',
        };
      }
      if (this.containsXssPayload(obj)) {
        return {
          sanitized: this.stripHtmlTags(obj) as any,
          hasSecurityThreat: true,
          threatReason: 'Dangerous script tag or XSS event handler detected.',
        };
      }
      return { sanitized: this.stripHtmlTags(obj) as any, hasSecurityThreat: false };
    }

    if (Array.isArray(obj)) {
      const sanitizedArray: any[] = [];
      for (const item of obj) {
        const res = this.sanitizeObject(item);
        if (res.hasSecurityThreat) {
          return { sanitized: obj, hasSecurityThreat: true, threatReason: res.threatReason };
        }
        sanitizedArray.push(res.sanitized);
      }
      return { sanitized: sanitizedArray as any, hasSecurityThreat: false };
    }

    if (typeof obj === 'object') {
      const sanitizedObj: any = {};
      for (const [key, val] of Object.entries(obj)) {
        const res = this.sanitizeObject(val);
        if (res.hasSecurityThreat) {
          return { sanitized: obj, hasSecurityThreat: true, threatReason: `${key}: ${res.threatReason}` };
        }
        sanitizedObj[key] = res.sanitized;
      }
      return { sanitized: sanitizedObj, hasSecurityThreat: false };
    }

    return { sanitized: obj, hasSecurityThreat: false };
  }

  /**
   * Validates geographic latitude and longitude ranges
   */
  public static validateCoordinates(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }
}
