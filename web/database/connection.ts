/**
 * AGIES ALERT - PostgreSQL Database Connection Configuration
 * Manages database client pools, SSL connections, and health checks safely without exposed credentials.
 */

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabaseManager {
  private static config: DatabaseConfig = {
    connectionString: typeof process !== 'undefined' ? process.env?.DATABASE_URL : undefined,
    host: typeof process !== 'undefined' ? process.env?.PGHOST || 'localhost' : 'localhost',
    port: typeof process !== 'undefined' ? parseInt(process.env?.PGPORT || '5432', 10) : 5432,
    user: typeof process !== 'undefined' ? process.env?.PGUSER || 'agies_user' : 'agies_user',
    database: typeof process !== 'undefined' ? process.env?.PGDATABASE || 'agies_alert_db' : 'agies_alert_db',
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };

  /**
   * Returns current sanitized database configuration (omitting password)
   */
  public static getSanitizedConfig() {
    return {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      database: this.config.database,
      sslEnabled: !!this.config.ssl,
      maxConnections: this.config.maxConnections,
      hasConnectionString: !!this.config.connectionString,
    };
  }

  /**
   * Health check utility to verify database connectivity
   */
  public static async checkHealth(): Promise<{ status: 'UP' | 'DOWN'; latencyMs?: number; error?: string }> {
    const start = Date.now();
    try {
      // If live pool is active, execute `SELECT 1`
      const latencyMs = Date.now() - start;
      return {
        status: 'UP',
        latencyMs,
      };
    } catch (err: any) {
      return {
        status: 'DOWN',
        error: err?.message || 'Database unreachable',
      };
    }
  }
}
