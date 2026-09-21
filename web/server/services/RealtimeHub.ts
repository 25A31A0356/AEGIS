/**
 * AEGIS ALERT - Backend Realtime Event Hub
 * Manages Server-Sent Events (SSE) subscriptions, long-polling channels,
 * and high-priority emergency event broadcasting across Mobile App & Web clients.
 */

export interface RealtimeEventPayload {
  id: string;
  type:
    | 'REPORT_CREATED'
    | 'REPORT_UPDATED'
    | 'ALERT_UPDATED'
    | 'SOS_DISPATCHED'
    | 'WEATHER_TELEMETRY_UPDATED'
    | 'SYSTEM_HEARTBEAT'
    | 'SOS_CREATED'
    | 'SOS_OFFERED'
    | 'SOS_ACCEPTED'
    | 'SOS_LOCATION_UPDATED'
    | 'SOS_RESPONDER_MOVING'
    | 'SOS_ON_SITE'
    | 'SOS_RESOLVED'
    | 'SOS_CANCELLED'
    | string;
  timestamp: string;
  data: any;
}

export type EventListenerCallback = (event: RealtimeEventPayload) => void;

export class RealtimeHub {
  private static subscribers: Set<EventListenerCallback> = new Set();
  private static eventBuffer: RealtimeEventPayload[] = [];
  private static maxBufferLength = 100;
  private static heartbeatInterval: any = null;

  static {
    // Start periodic heartbeat every 20 seconds
    if (typeof setInterval !== 'undefined') {
      this.heartbeatInterval = setInterval(() => {
        this.broadcast({
          id: `hb-${Date.now()}`,
          type: 'SYSTEM_HEARTBEAT',
          timestamp: new Date().toISOString(),
          data: { status: 'HEALTHY', serverTime: new Date().toISOString() },
        }, false);
      }, 20000);
      if (this.heartbeatInterval && typeof this.heartbeatInterval.unref === 'function') {
        this.heartbeatInterval.unref();
      }
    }
  }

  public static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Subscribe to real-time events stream
   */
  public static subscribe(callback: EventListenerCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Broadcast an event to all active real-time subscribers and save to buffer
   */
  public static broadcast(event: RealtimeEventPayload, buffer: boolean = true): void {
    if (buffer) {
      this.eventBuffer.unshift(event);
      if (this.eventBuffer.length > this.maxBufferLength) {
        this.eventBuffer.pop();
      }
    }

    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (err) {
        console.error('[RealtimeHub] Error executing subscriber callback:', err);
      }
    });
  }

  /**
   * Get recent events buffer for reconnecting clients (events since a specific timestamp/id)
   */
  public static getEventsSince(sinceTimestampOrId?: string): RealtimeEventPayload[] {
    if (!sinceTimestampOrId) {
      return this.eventBuffer.slice(0, 20);
    }

    const sinceTime = Date.parse(sinceTimestampOrId);
    if (!isNaN(sinceTime)) {
      return this.eventBuffer.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
    }

    const index = this.eventBuffer.findIndex((e) => e.id === sinceTimestampOrId);
    if (index > 0) {
      return this.eventBuffer.slice(0, index);
    }

    return this.eventBuffer.slice(0, 20);
  }

  /**
   * Returns active subscriber count
   */
  public static getSubscriberCount(): number {
    return this.subscribers.size;
  }
}
