import { SOSBeacon } from '../types/sos';

export interface StateVictimProfile extends SOSBeacon {
  victimName: string;
  familyContactName: string;
  familyContactPhone: string;
  familyRelationship: string;
  nearbyPoliceStationName: string;
  nearbyPoliceStationPhone: string;
  hometownPoliceStationName: string;
  hometownPoliceStationPhone: string;
  signalStatus: string;
  elevationMeters: number;
}

export const STATE_VICTIM_BEACONS: StateVictimProfile[] = [];
