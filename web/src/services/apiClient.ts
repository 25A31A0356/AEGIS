/**
 * AEGIS ALERT - Centralized Frontend API Client
 * Single secure gateway connecting Aegis Web to the Aegis Software API.
 * Handles authentication headers, CSRF tokens, request deduplication, in-memory caching,
 * timeouts, and graceful error conversion without exposing internal server stack traces.
 */

export interface ApiErrorDetails {
  code: string;
  message: string;
  status: number;
  details?: unknown;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetails;
  isCached?: boolean;
  timestamp: string;
}

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
  skipCache?: boolean;
  cacheTtlMs?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class ApiClient {
  private static defaultTimeoutMs = 8000;
  private static defaultCacheTtlMs = 45000; // 45 seconds for GET requests
  private static memoryCache = new Map<string, CacheEntry<unknown>>();
  private static inflightRequests = new Map<string, Promise<ApiResult<any>>>();
  private static discoveryCache: any = null;

  /**
   * Resolves the API base URL from Vite environment variables or relative /api
   * Supports VITE_AEGIS_API_URL, VITE_API_BASE_URL, and VITE_API_URL.
   */
  public static getBaseUrl(): string {
    const env = (import.meta as any).env || {};
    const envUrl = env.VITE_AEGIS_API_URL || env.VITE_API_BASE_URL || env.VITE_API_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.replace(/\/+$/, '');
    }
    if (typeof window === 'undefined') {
      return 'http://localhost:8000/api/v1';
    }
    return 'http://localhost:8000/api/v1';
  }

  /**
   * Safe Public API discovery handshake with Aegis Software backend
   */
  public static async discoverBackend(force: boolean = false): Promise<any> {
    if (this.discoveryCache && !force) return this.discoveryCache;
    try {
      const res = await this.get<any>('/discovery', undefined, { skipCache: true, timeoutMs: 3500 });
      if (res) {
        this.discoveryCache = res;
        return res;
      }
    } catch (e) {
      console.warn('[ApiClient] Backend discovery query failed, utilizing standard route catalog:', e);
    }
    return null;
  }

  /**
   * Retrieves Bearer auth header from storage if session exists
   */
  public static getAuthHeader(): Record<string, string> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const token = localStorage.getItem('aegis_auth_token') || localStorage.getItem('agies_auth_token');
      const csrf = localStorage.getItem('aegis_csrf_token') || localStorage.getItem('agies_csrf_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (csrf) headers['X-CSRF-Token'] = csrf;
      return headers;
    } catch {
      return {};
    }
  }

  /**
   * Formats friendly user-facing messages from HTTP status codes
   */
  private static translateError(status: number, rawMessage?: string, rawCode?: string): ApiErrorDetails {
    const code = rawCode || `HTTP_${status}`;
    let message = rawMessage || 'An unexpected error occurred while communicating with Aegis intelligence servers.';

    if (status === 0 || status === -1) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to reach Aegis API. Check your internet connection.',
        status: 0,
      };
    }
    if (status === 400) {
      message = rawMessage || 'Invalid request parameters submitted to emergency gateway.';
    } else if (status === 401) {
      message = 'Authentication required. Please sign in to access restricted disaster commands.';
    } else if (status === 403) {
      message = 'Access restricted. Insufficient operational privileges.';
    } else if (status === 404) {
      message = rawMessage || 'Requested emergency resource or bulletin was not found.';
    } else if (status === 429) {
      message = 'High request volume detected. Please wait a moment before refreshing.';
    } else if (status >= 500) {
      message = 'Aegis disaster telemetry service is temporarily busy. Retrying with cached telemetry.';
    }

    return { code, message, status };
  }

  /**
   * Core request executor with timeout, deduplication, and caching
   */
  public static async execute<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResult<T>> {
    let endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const base = this.getBaseUrl();
    if (base.endsWith('/api/v1') && endpointPath.startsWith('/v1/')) {
      endpointPath = endpointPath.replace(/^\/v1/, '');
    }
    let url = `${base}${endpointPath}`;

    // Query parameters
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const cacheKey = `${method}:${url}`;

    // 1. Check in-memory cache for GET requests
    if (method === 'GET' && !options.skipCache) {
      const cached = this.memoryCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return {
          success: true,
          data: cached.data as T,
          isCached: true,
          timestamp: new Date(cached.timestamp).toISOString(),
        };
      }
    }

    // 2. Request deduplication for identical GET requests
    if (method === 'GET' && this.inflightRequests.has(cacheKey)) {
      return this.inflightRequests.get(cacheKey)!;
    }

    const fetchPromise = (async (): Promise<ApiResult<T>> => {
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.getAuthHeader(),
          ...(options.headers || {}),
        };

        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: options.signal || controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle empty or No-Content responses
        if (res.status === 204) {
          return {
            success: true,
            timestamp: new Date().toISOString(),
          };
        }

        let jsonPayload: any = null;
        try {
          jsonPayload = await res.json();
        } catch {
          jsonPayload = null;
        }

        if (!res.ok) {
          const errPayload = jsonPayload?.error;
          const translated = this.translateError(
            res.status,
            errPayload?.message || res.statusText,
            errPayload?.code
          );
          return {
            success: false,
            error: translated,
            timestamp: new Date().toISOString(),
          };
        }

        // Parse Aegis standard response envelope { success: true, data: T }
        const data: T = jsonPayload && typeof jsonPayload === 'object' && 'data' in jsonPayload
          ? jsonPayload.data
          : jsonPayload;

        const timestamp = jsonPayload?.meta?.timestamp || new Date().toISOString();

        // Save to cache for GET requests
        if (method === 'GET') {
          const ttl = options.cacheTtlMs || this.defaultCacheTtlMs;
          this.memoryCache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
          });
        }

        return {
          success: true,
          data,
          isCached: false,
          timestamp,
        };
      } catch (err: any) {
        clearTimeout(timeoutId);

        const isAbort = err?.name === 'AbortError' || controller.signal.aborted;
        const errDetails: ApiErrorDetails = isAbort
          ? {
              code: 'TIMEOUT',
              message: 'Request to Aegis emergency gateway timed out. Please retry.',
              status: 408,
            }
          : this.translateError(0, err?.message);

        return {
          success: false,
          error: errDetails,
          timestamp: new Date().toISOString(),
        };
      } finally {
        if (method === 'GET') {
          this.inflightRequests.delete(cacheKey);
        }
      }
    })();

    if (method === 'GET') {
      this.inflightRequests.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  // Convenience helper wrappers
  public static async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: Omit<RequestOptions, 'params'>
  ): Promise<T | null> {
    const res = await this.execute<T>(endpoint, 'GET', undefined, { ...options, params });
    return res.success && res.data !== undefined ? res.data : null;
  }

  public static async getWithMeta<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined | null>,
    options?: Omit<RequestOptions, 'params'>
  ): Promise<ApiResult<T>> {
    return this.execute<T>(endpoint, 'GET', undefined, { ...options, params });
  }

  public static async post<T, B = any>(
    endpoint: string,
    body: B,
    options?: RequestOptions
  ): Promise<T | null> {
    const res = await this.execute<T>(endpoint, 'POST', body, options);
    return res.success && res.data !== undefined ? res.data : null;
  }

  public static async postWithMeta<T, B = any>(
    endpoint: string,
    body: B,
    options?: RequestOptions
  ): Promise<ApiResult<T>> {
    return this.execute<T>(endpoint, 'POST', body, options);
  }

  public static async put<T, B = any>(
    endpoint: string,
    body: B,
    options?: RequestOptions
  ): Promise<T | null> {
    const res = await this.execute<T>(endpoint, 'PUT', body, options);
    return res.success && res.data !== undefined ? res.data : null;
  }

  public static async patch<T, B = any>(
    endpoint: string,
    body: B,
    options?: RequestOptions
  ): Promise<T | null> {
    const res = await this.execute<T>(endpoint, 'PATCH', body, options);
    return res.success && res.data !== undefined ? res.data : null;
  }

  public static async delete<T>(
    endpoint: string,
    options?: RequestOptions
  ): Promise<T | null> {
    const res = await this.execute<T>(endpoint, 'DELETE', undefined, options);
    return res.success && res.data !== undefined ? res.data : null;
  }

  /**
   * Clears in-memory API response cache
   */
  public static clearCache(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      return;
    }
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}
