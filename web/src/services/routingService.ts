export interface SimulatedRoute {
  originCoordinates: [number, number];
  destinationCoordinates: [number, number];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
  waypoints: [number, number][];
  steps: {
    instruction: string;
    distance: string;
    duration: string;
    road: string;
  }[];
}

export class RoutingService {
  /**
   * Generates a realistic simulated emergency responder driving path
   * connecting responder coordinates to the SOS beacon coordinates.
   */
  public static calculateEmergencyRoute(
    origin: [number, number],
    destination: [number, number],
    originLabel: string = 'Responder Base Staging Depot',
    destLabel: string = 'SOS Distress Location'
  ): SimulatedRoute {
    const [lat1, lng1] = origin;
    const [lat2, lng2] = destination;

    // Haversine approximate distance
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const directDistKm = R * c;

    // Road factor adjustment (approx 1.25x direct distance for road network)
    const totalDistanceKm = Number(Math.max(1.2, directDistKm * 1.28).toFixed(1));
    const estimatedTimeMinutes = Math.max(3, Math.round((totalDistanceKm / 35) * 60)); // Avg 35 km/h emergency speed with sirens

    // Generate intermediate waypoints with slight realistic road-like zigzag
    const waypoints: [number, number][] = [];
    const stepsCount = 5;
    for (let i = 0; i <= stepsCount; i++) {
      const t = i / stepsCount;
      const jitterLat = i > 0 && i < stepsCount ? (Math.sin(i * 2.5) * 0.003) : 0;
      const jitterLng = i > 0 && i < stepsCount ? (Math.cos(i * 2.5) * 0.003) : 0;
      waypoints.push([
        lat1 + (lat2 - lat1) * t + jitterLat,
        lng1 + (lng2 - lng1) * t + jitterLng,
      ]);
    }

    const steps = [
      {
        instruction: `Deploy from ${originLabel} heading towards main arterial route`,
        distance: `${(totalDistanceKm * 0.3).toFixed(1)} km`,
        duration: `${Math.ceil(estimatedTimeMinutes * 0.25)} min`,
        road: 'Primary Access Bypass',
      },
      {
        instruction: 'Turn onto Emergency Relief Corridor (Maintain priority beacon & siren)',
        distance: `${(totalDistanceKm * 0.45).toFixed(1)} km`,
        duration: `${Math.ceil(estimatedTimeMinutes * 0.45)} min`,
        road: 'Arterial Ring Road',
      },
      {
        instruction: 'Navigate local access road approaching flood / incident perimeter',
        distance: `${(totalDistanceKm * 0.25).toFixed(1)} km`,
        duration: `${Math.ceil(estimatedTimeMinutes * 0.3)} min`,
        road: 'Local Sector Road',
      },
      {
        instruction: `Arrive at target ${destLabel}`,
        distance: '0.0 km',
        duration: '0 min',
        road: 'Target Location Coordinates',
      },
    ];

    return {
      originCoordinates: origin,
      destinationCoordinates: destination,
      totalDistanceKm,
      estimatedTimeMinutes,
      waypoints,
      steps,
    };
  }
}
