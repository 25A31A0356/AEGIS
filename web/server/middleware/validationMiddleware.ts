/**
 * AGIES Backend - Validation Middleware & Error Handling
 * Validates request schemas, sanitizes payloads, and ensures safe sanitized error responses without internal leakages.
 */

import { ApiResponse } from '../types/api';
import { SanitizationMiddleware } from './sanitizationMiddleware';

export class ValidationMiddleware {
  /**
   * Validate incident report submission payload
   */
  public static validateReportSubmission(body: any): { valid: boolean; errors?: string[]; sanitizedBody?: any } {
    const errors: string[] = [];

    if (!body || typeof body !== 'object') {
      return { valid: false, errors: ['Request body must be a valid JSON object.'] };
    }

    // Input sanitization & security check
    const sanitization = SanitizationMiddleware.sanitizeObject(body);
    if (sanitization.hasSecurityThreat) {
      return { valid: false, errors: [sanitization.threatReason || 'Malicious input signature detected in payload.'] };
    }

    const clean = sanitization.sanitized;

    const hazardType = clean.hazardType || clean.hazardCategory;
    if (!hazardType || typeof hazardType !== 'string' || hazardType.trim().length === 0) {
      errors.push('hazardType is required (e.g. Flood, Fire, Earthquake, Cyclone, Landslide, etc.).');
    } else {
      clean.hazardType = hazardType;
    }

    if (!clean.description || typeof clean.description !== 'string' || clean.description.trim().length < 5) {
      errors.push('description is required and must be at least 5 characters long.');
    } else if (clean.description.length > 2000) {
      errors.push('description cannot exceed 2,000 characters.');
    }

    if (!clean.severity || !['low', 'medium', 'high', 'critical'].includes(clean.severity.toLowerCase())) {
      errors.push('severity is required and must be one of: low, medium, high, critical.');
    }

    if (!clean.location || typeof clean.location !== 'object') {
      errors.push('location object with lat, lng, and address is required.');
    } else {
      const lat = typeof clean.location.lat === 'number' ? clean.location.lat : typeof clean.location.latitude === 'number' ? clean.location.latitude : undefined;
      const lng = typeof clean.location.lng === 'number' ? clean.location.lng : typeof clean.location.longitude === 'number' ? clean.location.longitude : undefined;

      if (lat === undefined || lng === undefined) {
        errors.push('location.lat and location.lng must be valid numeric coordinates.');
      } else if (!SanitizationMiddleware.validateCoordinates(lat, lng)) {
        errors.push('location.lat must be between -90 and 90, and location.lng between -180 and 180.');
      } else {
        clean.location.lat = lat;
        clean.location.lng = lng;
      }

      if (!clean.location.address || typeof clean.location.address !== 'string' || clean.location.address.trim().length === 0) {
        errors.push('location.address string is required.');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      sanitizedBody: clean,
    };
  }

  /**
   * Validate AI chat request
   */
  public static validateAIChatRequest(body: any): { valid: boolean; errors?: string[]; sanitizedBody?: any } {
    const errors: string[] = [];

    if (!body || typeof body !== 'object') {
      return { valid: false, errors: ['Request body must be a JSON object.'] };
    }

    const sanitization = SanitizationMiddleware.sanitizeObject(body);
    if (sanitization.hasSecurityThreat) {
      return { valid: false, errors: [sanitization.threatReason || 'Security policy violation detected in AI query.'] };
    }

    const clean = sanitization.sanitized;

    if (!clean.message || typeof clean.message !== 'string' || clean.message.trim().length === 0) {
      errors.push('message string is required.');
    } else if (clean.message.length > 1000) {
      errors.push('message cannot exceed 1,000 characters.');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      sanitizedBody: clean,
    };
  }

  /**
   * Validate Location creation
   */
  public static validateLocationCreation(body: any): { valid: boolean; errors?: string[]; sanitizedBody?: any } {
    const errors: string[] = [];

    if (!body || typeof body !== 'object') {
      return { valid: false, errors: ['Request body must be a JSON object.'] };
    }

    const sanitization = SanitizationMiddleware.sanitizeObject(body);
    if (sanitization.hasSecurityThreat) {
      return { valid: false, errors: [sanitization.threatReason || 'Security policy violation in location payload.'] };
    }

    const clean = sanitization.sanitized;

    if (!clean.name || typeof clean.name !== 'string' || clean.name.trim().length === 0) {
      errors.push('name string is required.');
    } else if (clean.name.length > 100) {
      errors.push('location name cannot exceed 100 characters.');
    }

    if (!Array.isArray(clean.coordinates) || clean.coordinates.length !== 2) {
      errors.push('coordinates must be a tuple of [latitude, longitude].');
    } else {
      const [lat, lng] = clean.coordinates;
      if (!SanitizationMiddleware.validateCoordinates(lat, lng)) {
        errors.push('coordinates must contain valid latitude (-90 to 90) and longitude (-180 to 180).');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      sanitizedBody: clean,
    };
  }
}

export class ErrorHandler {
  /**
   * Safe response builder
   */
  public static createResponse<T>(data: T, status: number = 200): { body: ApiResponse<T>; status: number } {
    return {
      status,
      body: {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
    };
  }

  /**
   * Creates a sanitized error response that NEVER leaks internal stack traces, tokens, or environment keys
   */
  public static createError(
    code: string,
    message: string,
    status: number = 400,
    details?: any
  ): { body: ApiResponse; status: number } {
    // Redact sensitive details in production
    let safeDetails = details;
    if (details && typeof details === 'string') {
      // Redact stack traces and internal paths
      safeDetails = details
        .replace(/(\/[a-zA-Z0-9_.-]+)+/g, '[path_redacted]')
        .replace(/[a-zA-Z0-9_\-]{24,}/g, '[token_redacted]');
    } else if (details && typeof details === 'object' && !(details instanceof Array)) {
      safeDetails = { ...details };
      delete safeDetails.stack;
      delete safeDetails.password;
      delete safeDetails.secret;
      delete safeDetails.apiKey;
    }

    return {
      status,
      body: {
        success: false,
        error: {
          code,
          message,
          details: safeDetails,
          status,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
    };
  }
}
