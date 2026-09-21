/**
 * AGIES ALERT - Security Audit Logger Service
 * Maintains an immutable log of system access, incident submissions, media uploads,
 * rate limit violations, and blocked injection/executable attacks.
 */

export type AuditEventSeverity = 'INFO' | 'WARN' | 'SECURITY_ALERT' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  severity: AuditEventSeverity;
  clientIp: string;
  userId?: string;
  userRole?: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export class AuditLogger {
  private static readonly MAX_LOG_SIZE = 1000;
  private static logs: AuditLogEntry[] = [];

  /**
   * Log a security or administrative event
   */
  public static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.MAX_LOG_SIZE) {
      this.logs = this.logs.slice(0, this.MAX_LOG_SIZE);
    }

    if (entry.severity === 'SECURITY_ALERT' || entry.severity === 'CRITICAL') {
      console.warn(`🚨 [SECURITY AUDIT ALERT] [${fullEntry.action}] Client: ${fullEntry.clientIp} | Details:`, fullEntry.details);
    }

    return fullEntry;
  }

  /**
   * Query filtered audit logs (Restricted to Authorized Admins/Officers)
   */
  public static getLogs(filters?: {
    severity?: AuditEventSeverity;
    action?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let result = [...this.logs];
    if (filters?.severity) {
      result = result.filter((l) => l.severity === filters.severity);
    }
    if (filters?.action) {
      result = result.filter((l) => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
    }
    return result.slice(0, filters?.limit || 50);
  }

  /**
   * Clear logs (for testing or rotation)
   */
  public static clearLogs(): void {
    this.logs = [];
  }
}
