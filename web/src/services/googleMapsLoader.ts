/**
 * AEGIS ALERT - Google Maps JavaScript API Loader
 * Securely loads the Google Maps JavaScript API using browser-restricted VITE_GOOGLE_MAPS_API_KEY.
 * Guarantees zero hardcoded credentials, zero server secrets in client bundles,
 * and provides fallback capability if network fails or no key is provided in development.
 */

export type GoogleMapsLoadingStatus = 'IDLE' | 'LOADING' | 'LOADED' | 'FAILED';

export interface GoogleMapsLoaderConfig {
  apiKey?: string;
  libraries?: string[];
  version?: string;
  language?: string;
  region?: string;
}

class GoogleMapsLoaderService {
  private status: GoogleMapsLoadingStatus = 'IDLE';
  private loadingPromise: Promise<boolean> | null = null;
  private listeners: Set<(status: GoogleMapsLoadingStatus) => void> = new Set();
  private apiKey: string = '';

  constructor() {
    this.apiKey = this.resolveApiKey();
  }

  /**
   * Resolves browser-restricted Google Maps API key from environment variable
   */
  private resolveApiKey(): string {
    try {
      const env = (import.meta as any).env || {};
      return (env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
    } catch {
      if (typeof process !== 'undefined' && process.env) {
        return (process.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
      }
      return '';
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public hasApiKey(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('placeholder');
  }

  public getStatus(): GoogleMapsLoadingStatus {
    return this.status;
  }

  public isLoaded(): boolean {
    return this.status === 'LOADED' && typeof window !== 'undefined' && typeof (window as any).google?.maps !== 'undefined';
  }

  public onStatusChange(callback: (status: GoogleMapsLoadingStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribe(callback: (status: GoogleMapsLoadingStatus) => void): () => void {
    return this.onStatusChange(callback);
  }

  private setStatus(newStatus: GoogleMapsLoadingStatus) {
    this.status = newStatus;
    this.listeners.forEach((fn) => {
      try {
        fn(newStatus);
      } catch (err) {
        console.error('[GoogleMapsLoader] Listener error:', err);
      }
    });
  }

  /**
   * Loads the Google Maps JavaScript API dynamically
   */
  public async loadGoogleMaps(config?: GoogleMapsLoaderConfig): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // If already loaded in window
    if (typeof (window as any).google?.maps?.Map !== 'undefined') {
      this.setStatus('LOADED');
      return true;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    const key = config?.apiKey || this.apiKey;
    if (!key || key.includes('placeholder')) {
      // In dev or test environments without an active key, flag fallback mode
      this.setStatus('FAILED');
      return false;
    }

    this.setStatus('LOADING');

    this.loadingPromise = new Promise<boolean>((resolve) => {
      const scriptId = 'aegis-google-maps-script';
      const existing = document.getElementById(scriptId);

      if (existing) {
        if (typeof (window as any).google?.maps?.Map !== 'undefined') {
          this.setStatus('LOADED');
          resolve(true);
        } else {
          existing.addEventListener('load', () => {
            this.setStatus('LOADED');
            resolve(true);
          });
          existing.addEventListener('error', () => {
            this.setStatus('FAILED');
            resolve(false);
          });
        }
        return;
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;

      const libraries = (config?.libraries || ['places', 'geometry', 'marker']).join(',');
      const language = config?.language || 'en';
      const region = config?.region || 'IN'; // India region bias
      const version = config?.version || 'weekly';

      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=${libraries}&language=${language}&region=${region}&v=${version}`;

      script.onload = () => {
        this.setStatus('LOADED');
        resolve(true);
      };

      script.onerror = () => {
        console.warn('[GoogleMapsLoader] Failed to load Google Maps JS API script. Using resilient fallback canvas.');
        this.setStatus('FAILED');
        resolve(false);
      };

      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }
}

export const GoogleMapsLoader = new GoogleMapsLoaderService();
export const googleMapsLoader = GoogleMapsLoader;
