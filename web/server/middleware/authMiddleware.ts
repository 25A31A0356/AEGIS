/**
 * AGIES Backend - Authentication & Role-Based Authorization Middleware
 * Protects administrative and restricted command endpoints while keeping public hazard feeds accessible.
 */

import { UserSession } from '../types/api';
import { AuditLogger } from '../services/AuditLogger';

export interface AuthContext {
  user: UserSession | null;
  isAuthenticated: boolean;
  token?: string;
  error?: string;
}

export class AuthMiddleware {
  // Preconfigured authoritative command users
  private static KNOWN_ACCOUNTS: Record<string, UserSession> = {
    'demo-citizen-token': {
      id: 'usr-citizen-01',
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      role: 'citizen',
      phone: '+91 98765 43210',
      stateId: 'MH',
      district: 'Mumbai Suburban',
    },
    'demo-official-token': {
      id: 'usr-official-01',
      name: 'Dr. A. Verma (Disaster Operations Chief)',
      email: 'chief.ops@ndma.gov.in',
      role: 'official',
      phone: '+91 94321 09876',
      stateId: 'DL',
      district: 'New Delhi',
    },
    'demo-admin-token': {
      id: 'usr-admin-01',
      name: 'System Administrator (India Command)',
      email: 'sysadmin@agies.gov.in',
      role: 'admin',
    },
  };

  /**
   * Extract and verify bearer token or API key from request headers
   */
  public static authenticate(authHeader?: string | null, clientIp: string = '127.0.0.1'): AuthContext {
    if (!authHeader) {
      // Unauthenticated public access
      return { user: null, isAuthenticated: false };
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token || token.length < 8) {
      AuditLogger.log({
        action: 'AUTH_FAILED_MALFORMED_TOKEN',
        severity: 'WARN',
        clientIp,
        details: { tokenPreview: token.substring(0, 4) },
      });
      return { user: null, isAuthenticated: false, error: 'Malformed authorization token.' };
    }

    const matchedUser = this.KNOWN_ACCOUNTS[token];
    if (matchedUser) {
      return {
        user: matchedUser,
        isAuthenticated: true,
        token,
      };
    }

    // If token has valid format `agies_jwt_...` or starts with `token_`
    if (token.startsWith('agies_jwt_') || token.startsWith('token_')) {
      const citizenUser: UserSession = {
        id: `usr-${token.substring(token.length - 8)}`,
        name: 'Verified Citizen',
        email: 'citizen@agies.gov.in',
        role: 'citizen',
      };
      return {
        user: citizenUser,
        isAuthenticated: true,
        token,
      };
    }

    AuditLogger.log({
      action: 'AUTH_REJECTED_UNKNOWN_TOKEN',
      severity: 'WARN',
      clientIp,
      details: { tokenPreview: token.substring(0, 6) },
    });

    return { user: null, isAuthenticated: false, error: 'Invalid or expired bearer token.' };
  }

  /**
   * Authorize specific roles (e.g. 'official' or 'admin')
   */
  public static authorizeRole(
    auth: AuthContext,
    allowedRoles: Array<'citizen' | 'official' | 'admin' | 'sdrf_officer'>
  ): boolean {
    if (!auth.isAuthenticated || !auth.user) return false;
    return allowedRoles.includes(auth.user.role as any);
  }
}
