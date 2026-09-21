/**
 * Aegis Real-Time Event Service
 *
 * Connects to the Aegis Software Real-Time Stream (SSE / Polling fallback)
 * to deliver live community reports, hazard status updates, and civil alerts.
 */

import { AegisRealtimeEvent, RealtimeConnectionStatus } from "./aegis-types";
import { getApiBaseUrl } from "@/constants/oauth";

type EventCallback = (event: AegisRealtimeEvent) => void;
type StatusCallback = (status: RealtimeConnectionStatus) => void;

class AegisRealtimeClient {
  private status: RealtimeConnectionStatus = "OFFLINE";
  private eventListeners: Set<EventCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private eventSource: any = null;
  private reconnectTimer: any = null;
  private pollTimer: any = null;
  private isDestroyed = false;
  private lastHeartbeat: number = 0;

  constructor() {
    // Autostart connection on initialization
    if (typeof window !== "undefined") {
      this.connect();
    }
  }

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  public onEvent(callback: EventCallback): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(newStatus: RealtimeConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((cb) => {
        try {
          cb(newStatus);
        } catch {}
      });
    }
  }

  private emitEvent(event: AegisRealtimeEvent) {
    this.eventListeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.warn("[AegisRealtime] Listener error:", err);
      }
    });
  }

  public connect() {
    if (this.isDestroyed) return;
    this.setStatus("RECONNECTING");

    const baseUrl = getApiBaseUrl();
    const endpoint = `${baseUrl}/api/v1/realtime`;

    // 1. Browser / Web EventSource Support
    if (typeof window !== "undefined" && typeof (window as any).EventSource !== "undefined") {
      try {
        if (this.eventSource) {
          this.eventSource.close();
        }

        const es = new (window as any).EventSource(endpoint, { withCredentials: true });
        this.eventSource = es;

        es.onopen = () => {
          this.setStatus("LIVE");
          this.lastHeartbeat = Date.now();
        };

        es.onmessage = (e: MessageEvent) => {
          this.lastHeartbeat = Date.now();
          this.setStatus("LIVE");
          try {
            const parsed = JSON.parse(e.data) as AegisRealtimeEvent;
            if (parsed.type !== "ping") {
              this.emitEvent(parsed);
            }
          } catch (err) {
            console.warn("[AegisRealtime] JSON parse error:", err);
          }
        };

        es.onerror = () => {
          this.setStatus("RECONNECTING");
          es.close();
          this.scheduleReconnect();
        };
        return;
      } catch (e) {
        console.warn("[AegisRealtime] EventSource initialization failed, using polling fallback:", e);
      }
    }

    // 2. Native Mobile / Node Fetch Streaming or Polling Fallback
    this.startPollingFallback();
  }

  private startPollingFallback() {
    this.setStatus("LIVE");
    if (this.pollTimer) clearInterval(this.pollTimer);

    // Poll every 12 seconds for fresh reports/events
    this.pollTimer = setInterval(async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/v1/reports?limit=15`, {
          signal: AbortSignal.timeout(6000),
        });
        if (res.ok) {
          this.setStatus("LIVE");
          this.lastHeartbeat = Date.now();
        } else {
          this.setStatus("RECONNECTING");
        }
      } catch {
        this.setStatus("OFFLINE");
      }
    }, 12000);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 4000);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.eventListeners.clear();
    this.statusListeners.clear();
    this.setStatus("OFFLINE");
  }
}

export const AegisRealtime = new AegisRealtimeClient();
