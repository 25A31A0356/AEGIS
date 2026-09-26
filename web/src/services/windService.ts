import {
  INDIA_WIND_STREAMLINES,
  HEAVY_WIND_WARNING_ZONES,
  INDIA_ANEMOMETER_STATIONS,
  INDIA_ISOBAR_LINES,
  WindStreamline,
  HeavyWindWarningZone,
  AnemometerStation,
  IsobarLine,
} from '../data/demoWindData';

export interface SynopticTimeStep {
  id: string;
  offsetHours: number;
  label: string;
  formattedTime: string;
  cycleCode: string;
  isCurrent: boolean;
}

export interface TwoHourWindSnapshot {
  cycleTimestamp: string;
  cycleLabel: string;
  nextUpdateInSeconds: number;
  formattedNextUpdate: string;
  streamlines: WindStreamline[];
  warningZones: HeavyWindWarningZone[];
  anemometers: AnemometerStation[];
  isobars: IsobarLine[];
}

export class WindService {
  private static readonly CYCLE_INTERVAL_MS = 2 * 60 * 60 * 1000; // 2 Hours

  /**
   * Generates the 2-hourly synoptic time steps (-6h, -4h, -2h, NOW, +2h, +4h, +6h, +8h)
   */
  public static getTwoHourTimeSteps(): SynopticTimeStep[] {
    const now = new Date();
    // Round down to current 2-hour block (e.g., 22:00, 20:00, etc.)
    const currentHour = now.getHours();
    const cycleHour = Math.floor(currentHour / 2) * 2;
    const baseCycle = new Date(now);
    baseCycle.setHours(cycleHour, 0, 0, 0);

    const offsets = [-6, -4, -2, 0, 2, 4, 6, 8];

    return offsets.map((offset) => {
      const stepTime = new Date(baseCycle.getTime() + offset * 60 * 60 * 1000);
      const hoursStr = stepTime.getHours().toString().padStart(2, '0');
      const minsStr = stepTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hoursStr}:${minsStr} IST`;

      let label = `${offset > 0 ? '+' : ''}${offset}h`;
      if (offset === 0) label = 'NOW (Active)';
      else if (offset === -2) label = '-2h (Past)';
      else if (offset === 2) label = '+2h (Next)';

      return {
        id: `cycle-${offset}`,
        offsetHours: offset,
        label: `${label} • ${timeStr}`,
        formattedTime: timeStr,
        cycleCode: `${hoursStr}00Z-SYNOPTIC`,
        isCurrent: offset === 0,
      };
    });
  }

  /**
   * Returns the time remaining in seconds until the next 2-hour synoptic cycle refresh
   */
  public static getSecondsUntilNextTwoHourCycle(): number {
    const now = new Date();
    const currentHour = now.getHours();
    const cycleHour = Math.floor(currentHour / 2) * 2;
    const nextCycleTime = new Date(now);
    nextCycleTime.setHours(cycleHour + 2, 0, 0, 0);

    const diffMs = Math.max(0, nextCycleTime.getTime() - now.getTime());
    return Math.floor(diffMs / 1000);
  }

  /**
   * Formats seconds into "Xh Ym Zs"
   */
  public static formatCountdown(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  /**
   * Generates dynamic synoptic wind data for a given 2-hour offset (-6h to +8h)
   */
  public static getWindSnapshotForOffset(offsetHours: number = 0): TwoHourWindSnapshot {
    const steps = this.getTwoHourTimeSteps();
    const activeStep = steps.find((s) => s.offsetHours === offsetHours) || steps.find((s) => s.isCurrent)!;
    const nextSecs = this.getSecondsUntilNextTwoHourCycle();

    // Modulate speeds and gusts based on offset to simulate realistic synoptic evolution
    const speedFactor = 1 + (offsetHours * 0.035); // Cyclone DANA deepens over time

    const streamlines: WindStreamline[] = INDIA_WIND_STREAMLINES.map((s) => {
      const isCycloneFeeder = s.type === 'cyclonic_inflow' || s.type === 'downstream_outflow';
      const factor = isCycloneFeeder ? speedFactor : 1 + Math.sin(offsetHours) * 0.04;

      return {
        ...s,
        avgSpeedKmh: Math.round(s.avgSpeedKmh * factor),
        maxGustKmh: Math.round(s.maxGustKmh * factor),
      };
    });

    const warningZones: HeavyWindWarningZone[] = HEAVY_WIND_WARNING_ZONES.map((w) => {
      const isCyclone = w.category === 'SEVERE_CYCLONIC_GALE' || w.category === 'COASTAL_SQUALL';
      const factor = isCyclone ? speedFactor : 1;

      return {
        ...w,
        currentWindKmh: Math.round(w.currentWindKmh * factor),
        peakGustKmh: Math.round(w.peakGustKmh * factor),
      };
    });

    const anemometers: AnemometerStation[] = INDIA_ANEMOMETER_STATIONS.map((stn) => {
      const isEastCoast = stn.state === 'Andhra Pradesh' || stn.state === 'Odisha' || stn.state === 'West Bengal';
      const factor = isEastCoast ? speedFactor : 1 + (Math.cos(offsetHours + stn.windSpeedKmh) * 0.05);

      return {
        ...stn,
        windSpeedKmh: Math.round(stn.windSpeedKmh * factor),
        gustSpeedKmh: Math.round(stn.gustSpeedKmh * factor),
        barometricPressureHpa: isEastCoast
          ? Math.round(stn.barometricPressureHpa - offsetHours * 0.8)
          : stn.barometricPressureHpa,
      };
    });

    return {
      cycleTimestamp: activeStep.formattedTime,
      cycleLabel: activeStep.label,
      nextUpdateInSeconds: nextSecs,
      formattedNextUpdate: this.formatCountdown(nextSecs),
      streamlines,
      warningZones,
      anemometers,
      isobars: INDIA_ISOBAR_LINES,
    };
  }
}
