/**
 * Unified 2-Hour Synoptic Met & Environmental Telemetry Engine
 * Synchronizes automated 2-hour update cycles across all AEGIS maps:
 * - Cyclone Tracking Maps
 * - Full India Wind & Air Currents Map
 * - Real-Time Weather Map (India & Districts)
 * - Satellite Earth Observation Maps
 * - IMD Doppler Weather Radar Map
 * - NASA FIRMS Thermal Anomaly & Fire Map
 * - Detailed Street Map
 *
 * IMD Standard 2-Hourly Cadence: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00,
 * 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 IST.
 */

export interface UniversalSynopticStep {
  offsetHours: number; // e.g. -6, -4, -2, 0, +2, +4, +6
  label: string; // e.g. "Live (14:00 IST)", "Forecast +2h"
  timestampStr: string;
  isCurrent: boolean;
  bulletinId: string;
}

export class SynopticEngine {
  /**
   * Get current active 2-hour synoptic cycle base hour (IST: 0, 2, 4, ..., 22)
   */
  public static getCurrentCycleHour(): number {
    const now = new Date();
    // Convert to IST (UTC + 5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffsetMs);
    const hour = istDate.getHours();
    return Math.floor(hour / 2) * 2;
  }

  /**
   * Returns current cycle timestamp string (e.g. "14:00 IST • Bulletin #07")
   */
  public static getCurrentCycleTimestamp(): string {
    const cycleHour = this.getCurrentCycleHour();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const bulletinNum = Math.floor(cycleHour / 2) + 1;
    return `${pad(cycleHour)}:00 IST (Synoptic Bulletin #${pad(bulletinNum)})`;
  }

  /**
   * Returns precise seconds until next 2-hour synoptic cycle
   */
  public static getSecondsUntilNextCycle(): number {
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffsetMs);

    const currentHour = istDate.getHours();
    const currentMin = istDate.getMinutes();
    const currentSec = istDate.getSeconds();

    const currentCycleHour = Math.floor(currentHour / 2) * 2;
    const nextCycleHour = currentCycleHour + 2;

    const currentTotalSec = (currentHour * 3600) + (currentMin * 60) + currentSec;
    const nextTotalSec = nextCycleHour * 3600;

    const remaining = nextTotalSec - currentTotalSec;
    return remaining > 0 ? remaining : 7200;
  }

  /**
   * Formats seconds into MM:SS or HH:MM:SS
   */
  public static formatCountdown(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }

  /**
   * Generates standard 2-hourly time steps from -6h to +6h
   */
  public static getTwoHourTimeSteps(): UniversalSynopticStep[] {
    const baseHour = this.getCurrentCycleHour();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const offsets = [-6, -4, -2, 0, 2, 4, 6];

    return offsets.map((offset) => {
      let targetHour = (baseHour + offset) % 24;
      if (targetHour < 0) targetHour += 24;

      const isCurrent = offset === 0;
      let label = '';
      if (offset < 0) {
        label = `T${offset}h Analysis`;
      } else if (offset === 0) {
        label = `LIVE (00h)`;
      } else {
        label = `+${offset}h Forecast`;
      }

      const bulletinNum = Math.floor(targetHour / 2) + 1;

      return {
        offsetHours: offset,
        label,
        timestampStr: `${pad(targetHour)}:00 IST`,
        isCurrent,
        bulletinId: `SYN-IND-${pad(bulletinNum)}`,
      };
    });
  }
}
