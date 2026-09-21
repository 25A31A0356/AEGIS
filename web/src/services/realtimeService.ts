/**
 * AEGIS ALERT - Centralized Frontend Realtime Service
 * Manages Server-Sent Events (SSE) connection, auto-reconnection with backoff,
 * heartbeat watchdogs, event subscriber fan-out, and fallback polling for reliable
 * real-time community activity and hazard synchronization.
 */

import { ApiClient } from './apiClient';

export type RealtimeConnectionStatus = 'LIVE' | 'RECONNECTING' | 'OFFLINE';

export interface RealtimeEvent<T = any> {
  id?: string;
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  timestamp: string;
  version?: number;
  actor?: {
    id: string;
    role: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  payload?: Record<string, unknown>;
  type: string;
  data?: T;
  source?: string;
  correlationId?: string;
}

export type RealtimeEventHandler<T = any> = (event: RealtimeEvent<T>) => void;
export type StatusChangeHandler = (status: RealtimeConnectionStatus) => void;

class RealtimeServiceSingleton {
  private eventSource: EventSource | null = null;
  private status: RealtimeConnectionStatus = 'OFFLINE';
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();
  private globalListeners: Set<RealtimeEventHandler> = new Set();
  private statusListeners: Set<StatusChangeHandler> = new Set();
  
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private watchdogTimer: any = null;
  private pollingTimer: any = null;
  private lastEventTime: number = Date.now();
  private isExplicitlyClosed = false;
  private processedEventIds = new Set<string>();

  constructor() {
    // Auto-connect if in browser environment
    if (typeof window !== 'undefined') {
      // Connect on next tick to allow listeners to register
      setTimeout(() => {
        this.connect();
      }, 100);

      // Handle window online/offline events
      window.addEventListener('online', () => {
        this.reconnectAttempts = 0;
        this.connect();
      });

      window.addEventListener('offline', () => {
        this.setStatus('OFFLINE');
      });
    }
  }

  /**
   * Connect to the SSE endpoint or start polling
   */
  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.isExplicitlyClosed) {
      this.isExplicitlyClosed = false;
    }

    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {
        // ignore
      }
      this.eventSource = null;
    }

    const baseUrl = ApiClient.getBaseUrl();
    const cleanBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/api/v1`;
    const sseUrl = `${cleanBase}/events`;

    try {
      this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'OFFLINE');
      const es = new EventSource(sseUrl);
      this.eventSource = es;

      es.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastEventTime = Date.now();
        this.setStatus('LIVE');
        this.startWatchdog();
        this.stopPolling();
      };

      es.onmessage = (event) => {
        try {
          const parsed: RealtimeEvent = JSON.parse(event.data);
          this.handleIncomingEvent(parsed);
        } catch (e) {
          console.debug('[RealtimeService] SSE parse error:', e);
        }
      };

      es.onerror = () => {
        es.close();
        this.eventSource = null;
        this.handleDisconnect();
      };
    } catch {
      this.handleDisconnect();
    }
  }

  /**
   * Handles disconnections and schedules reconnection backoff / fallback polling
   */
  private handleDisconnect(): void {
    if (this.isExplicitlyClosed) return;

    this.setStatus('RECONNECTING');
    this.stopWatchdog();

    // Start fallback polling while reconnecting
    this.startPollingFallback();

    this.reconnectAttempts++;
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      this.setStatus('OFFLINE');
      return;
    }

    const backoffMs = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, backoffMs);
  }

  /**
   * Watchdog timer to detect silent connection drops (no heartbeat for > 45s)
   */
  private startWatchdog(): void {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(() => {
      const elapsed = Date.now() - this.lastEventTime;
      if (elapsed > 45000 && this.status === 'LIVE') {
        console.warn('[RealtimeService] Heartbeat missed for 45s, cycling connection...');
        this.connect();
      }
    }, 15000);
  }

  private stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  /**
   * Fallback polling when SSE is not directly reachable
   */
  private startPollingFallback(): void {
    if (this.pollingTimer) return;

    const poll = async () => {
      try {
        const res = await ApiClient.get<any>('/v1/events', { since: new Date(this.lastEventTime).toISOString() }, { skipCache: true, timeoutMs: 4000 });
        if (res && res.events && Array.isArray(res.events)) {
          res.events.forEach((evt: RealtimeEvent) => {
            this.handleIncomingEvent(evt);
          });
        }
      } catch {
        // quiet error in polling fallback
      }
    };

    // Initial poll
    poll();
    this.pollingTimer = setInterval(poll, 8000);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /**
   * Dispatches parsed event to type-specific and global listeners
   */
  private handleIncomingEvent(event: RealtimeEvent): void {
    this.lastEventTime = Date.now();
    const evtId = event.id || (event as any).event_id;
    if (evtId) {
      if (this.processedEventIds.has(evtId)) return;
      this.processedEventIds.add(evtId);
      if (this.processedEventIds.size > 500) {
        const first = this.processedEventIds.values().next().value;
        if (first) this.processedEventIds.delete(first);
      }
    }
    if (this.status !== 'LIVE') {
      this.setStatus('LIVE');
    }

    if (event.type === 'SYSTEM_HEARTBEAT') {
      return;
    }

    // Global listeners
    this.globalListeners.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error('[RealtimeService] Error in global listener:', err);
      }
    });

    // Type listeners
    const typeSet = this.listeners.get(event.type);
    if (typeSet) {
      typeSet.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`[RealtimeService] Error in ${event.type} listener:`, err);
        }
      });
    }
  }

  /**
   * Set connection status and notify subscribers
   */
  private setStatus(newStatus: RealtimeConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((fn) => {
      try {
        fn(newStatus);
      } catch (e) {
        console.error('[RealtimeService] Error in status change listener:', e);
      }
    });
  }

  /**
   * Get current connection status
   */
  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  /**
   * Subscribe to connection status changes
   */
  public onStatusChange(callback: StatusChangeHandler): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Subscribe to specific event types (e.g. 'REPORT_CREATED')
   */
  public on<T = any>(eventType: RealtimeEvent['type'], handler: RealtimeEventHandler<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler as any);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler as any);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to all incoming realtime events
   */
  public subscribe(handler: RealtimeEventHandler): () => void {
    this.globalListeners.add(handler);
    return () => {
      this.globalListeners.delete(handler);
    };
  }

  /**
   * Manually disconnect
   */
  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopWatchdog();
    this.stopPolling();
    clearTimeout(this.reconnectTimer);
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('OFFLINE');
  }
}

export const RealtimeService = new RealtimeServiceSingleton();
