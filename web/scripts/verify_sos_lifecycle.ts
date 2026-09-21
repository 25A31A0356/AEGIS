/**
 * AEGIS ALERT - Real-Time SOS Command Center & Responder GIS Lifecycle Verification Suite
 * Validates authoritative SOS distress creation, canonical lifecycle state transitions,
 * real-time SSE broadcasts (RealtimeHub), responder GPS telemetry, privacy phone masking,
 * and zero vendor key leakage.
 */

import { handleBackendApiRequest } from '../server/router';
import { RealtimeHub, RealtimeEventPayload } from '../server/services/RealtimeHub';
import * as fs from 'fs';
import * as path from 'path';

async function runSOSLifecycleVerification() {
  console.log('===========================================================');
  console.log('  AEGIS ALERT: SOS COMMAND CENTER & RESPONDER LIFECYCLE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetails?: any) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`, errorDetails ? errorDetails : '');
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test Suite 1: Discovery & REST Endpoints Catalog
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Discovery & SOS Endpoints ---');
  const discRes = await handleBackendApiRequest({
    method: 'GET',
    url: '/api/discovery',
    path: '/api/discovery',
    query: {},
    headers: {},
  });

  assert(discRes.status === 200, 'GET /api/discovery returns HTTP 200');
  assert(discRes.body?.data?.endpoints?.sos === '/api/v1/sos', 'Discovery declares /api/v1/sos');
  assert(discRes.body?.data?.endpoints?.sosNearby === '/api/v1/sos/nearby', 'Discovery declares /api/v1/sos/nearby');

  const listRes = await handleBackendApiRequest({
    method: 'GET',
    url: '/api/v1/sos',
    path: '/api/v1/sos',
    query: {},
    headers: {},
  });
  assert(listRes.status === 200, 'GET /api/v1/sos returns HTTP 200');
  const beaconsList = listRes.body?.data?.beacons;
  assert(Array.isArray(beaconsList), `GET /api/v1/sos returns valid beacons array (length: ${beaconsList?.length})`);

  // -------------------------------------------------------------
  // Test Suite 2: SOS Full Lifecycle & Realtime SSE Stream
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: SOS Lifecycle & Realtime Events ---');

  const receivedEvents: RealtimeEventPayload[] = [];
  const unsubscribe = RealtimeHub.subscribe((evt) => {
    if (evt.type.startsWith('SOS_') || evt.data?.eventType?.startsWith('SOS_')) {
      receivedEvents.push(evt);
    }
  });

  // Step 2.1: Citizen Triggers SOS Distress Beacon
  const createPayload = {
    emergencyType: 'flash_flood_stranding',
    emergencyTitle: 'E2E Test Flood Stranding Distress',
    locationName: 'Andheri West Subway Corridor',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    coordinates: [19.1197, 72.8464] as [number, number],
    personsCount: 3,
    medicalConditions: 'Elderly person with diabetic shock',
    phone: '+91 98765 43210',
    batteryPercent: 45,
    gpsAccuracyMeters: 6,
  };

  const createRes = await handleBackendApiRequest({
    method: 'POST',
    url: '/api/v1/sos',
    path: '/api/v1/sos',
    body: createPayload,
    query: {},
    headers: {},
  });

  assert(createRes.status === 201, 'POST /api/v1/sos returns HTTP 201 Created');
  const beaconId = createRes.body?.data?.id;
  assert(!!beaconId, `SOS Beacon registered with ID: ${beaconId}`);
  assert(createRes.body?.data?.triageStatus === 'PENDING', 'Initial triage status is PENDING');
  assert(createRes.body?.data?.phoneMasked === '+91 98**** 3210', 'Phone number is masked in response (+91 98**** 3210)');

  // Verify RealtimeHub received SOS_CREATED
  const createdEvt = receivedEvents.find((e) => (e.type === 'SOS_CREATED' || e.data?.eventType === 'SOS_CREATED') && (e.data?.beacon?.id === beaconId || e.data?.id === beaconId));
  assert(!!createdEvt, 'RealtimeHub broadcast SOS_CREATED event');

  // Step 2.2: Dispatcher Acknowledges Beacon
  const ackRes = await handleBackendApiRequest({
    method: 'POST',
    url: `/api/v1/sos/${beaconId}/acknowledge`,
    path: `/api/v1/sos/${beaconId}/acknowledge`,
    body: { actor: 'Senior Dispatch Officer Rao', notes: 'Distress acknowledged by Mumbai Emergency Center' },
    query: {},
    headers: {},
  });
  assert(ackRes.status === 200, 'POST /api/v1/sos/:id/acknowledge returns HTTP 200');
  assert(ackRes.body?.data?.triageStatus === 'ACCEPTED', 'Status transitioned to ACCEPTED');

  const ackEvt = receivedEvents.find((e) => (e.type === 'SOS_ACCEPTED' || e.data?.eventType === 'SOS_ACCEPTED') && (e.data?.beaconId === beaconId || e.data?.beacon?.id === beaconId));
  assert(!!ackEvt, 'RealtimeHub broadcast SOS_ACCEPTED event');

  // Step 2.3: Dispatcher Assigns Responder Unit
  const dispatchRes = await handleBackendApiRequest({
    method: 'POST',
    url: `/api/v1/sos/${beaconId}/dispatch`,
    path: `/api/v1/sos/${beaconId}/dispatch`,
    body: {
      unitName: 'NDRF 5th Battalion Water Rescue',
      callsign: 'NDRF-BOAT-07',
      unitType: 'NDRF Rescue Boat',
      commanderName: 'Insp. Vikram Rathore',
      commanderContact: '+91 98111 22334',
      responderCoordinates: [19.1120, 72.8350],
      etaMinutes: 8,
      notes: 'Deploying heavy Zodiac boat with paramedical kit',
    },
    query: {},
    headers: {},
  });
  assert(dispatchRes.status === 200, 'POST /api/v1/sos/:id/dispatch returns HTTP 200');
  assert(dispatchRes.body?.data?.triageStatus === 'RESPONDER_EN_ROUTE', 'Status transitioned to RESPONDER_EN_ROUTE');
  assert(dispatchRes.body?.data?.assignedUnit?.callsign === 'NDRF-BOAT-07', 'Assigned unit callsign matches NDRF-BOAT-07');

  // Step 2.4: Responder Moves & Updates Telemetry
  const moveRes = await handleBackendApiRequest({
    method: 'POST',
    url: `/api/v1/sos/${beaconId}/responder-location`,
    path: `/api/v1/sos/${beaconId}/responder-location`,
    body: {
      responderCoordinates: [19.1160, 72.8410],
      etaMinutes: 4,
    },
    query: {},
    headers: {},
  });
  assert(moveRes.status === 200, 'POST /api/v1/sos/:id/responder-location returns HTTP 200');
  assert(moveRes.body?.data?.assignedUnit?.etaMinutes === 4, 'Responder ETA updated to 4 minutes');

  const moveEvt = receivedEvents.find((e) => (e.type === 'SOS_RESPONDER_MOVING' || e.data?.eventType === 'SOS_RESPONDER_MOVING') && (e.data?.beaconId === beaconId || e.data?.id === beaconId));
  assert(!!moveEvt, 'RealtimeHub broadcast SOS_RESPONDER_MOVING event');

  // Step 2.5: Requester Updates Live GPS Location
  const reqLocRes = await handleBackendApiRequest({
    method: 'POST',
    url: `/api/v1/sos/${beaconId}/location`,
    path: `/api/v1/sos/${beaconId}/location`,
    body: {
      coordinates: [19.1199, 72.8468],
      accuracyMeters: 4,
      batteryPercent: 42,
    },
    query: {},
    headers: {},
  });
  assert(reqLocRes.status === 200, 'POST /api/v1/sos/:id/location returns HTTP 200');
  assert(reqLocRes.body?.data?.batteryPercent === 42, 'Requester battery updated to 42%');

  const reqLocEvt = receivedEvents.find((e) => (e.type === 'SOS_LOCATION_UPDATED' || e.data?.eventType === 'SOS_LOCATION_UPDATED') && (e.data?.beaconId === beaconId || e.data?.id === beaconId));
  assert(!!reqLocEvt, 'RealtimeHub broadcast SOS_LOCATION_UPDATED event');

  // Step 2.6: Responder Arrives On Scene
  const onSiteRes = await handleBackendApiRequest({
    method: 'POST',
    url: `/api/v1/sos/${beaconId}/on-site`,
    path: `/api/v1/sos/${beaconId}/on-site`,
    body: { notes: 'NDRF-BOAT-07 has established visual contact and initiated evacuation' },
    query: {},
    headers: {},
  });
  assert(onSiteRes.status === 200, 'POST /api/v1/sos/:id/on-site returns HTTP 200');
  assert(onSiteRes.body?.data?.triageStatus === 'ON_SITE', 'Status transitioned to ON_SITE');

  const onSiteEvt = receivedEvents.find((e) => (e.type === 'SOS_ON_SITE' || e.data?.eventType === 'SOS_ON_SITE') && (e.data?.beaconId === beaconId || e.data?.id === beaconId));
  assert(!!onSiteEvt, 'RealtimeHub broadcast SOS_ON_SITE event');

  // Step 2.7: Triage Resolved
  const resolveRes = await handleBackendApiRequest({
    method: 'POST',
    url: `/api/v1/sos/${beaconId}/resolve`,
    path: `/api/v1/sos/${beaconId}/resolve`,
    body: { actor: 'Insp. Vikram Rathore', notes: 'All 3 souls safely evacuated to Cooper Hospital relief camp' },
    query: {},
    headers: {},
  });
  assert(resolveRes.status === 200, 'POST /api/v1/sos/:id/resolve returns HTTP 200');
  assert(resolveRes.body?.data?.triageStatus === 'RESOLVED', 'Status transitioned to RESOLVED');

  const resolveEvt = receivedEvents.find((e) => (e.type === 'SOS_RESOLVED' || e.data?.eventType === 'SOS_RESOLVED') && (e.data?.beaconId === beaconId || e.data?.id === beaconId));
  assert(!!resolveEvt, 'RealtimeHub broadcast SOS_RESOLVED event');

  unsubscribe();

  // -------------------------------------------------------------
  // Test Suite 3: Nearby Geosearch
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Nearby Geospatial Query ---');
  const nearbyRes = await handleBackendApiRequest({
    method: 'GET',
    url: '/api/v1/sos/nearby?lat=19.1197&lng=72.8464&radiusKm=25',
    path: '/api/v1/sos/nearby',
    query: { lat: '19.1197', lng: '72.8464', radiusKm: '25' },
    headers: {},
  });
  assert(nearbyRes.status === 200, 'GET /api/v1/sos/nearby returns HTTP 200');
  const nearbyBeacons = nearbyRes.body?.data?.beacons;
  assert(Array.isArray(nearbyBeacons), 'Nearby returns array of matches');

  // -------------------------------------------------------------
  // Test Suite 4: Privacy & PII Masking Security
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Privacy & Phone Masking ---');
  const getSingle = await handleBackendApiRequest({
    method: 'GET',
    url: `/api/v1/sos/${beaconId}`,
    path: `/api/v1/sos/${beaconId}`,
    query: {},
    headers: {},
  });
  assert(getSingle.status === 200, 'GET /api/v1/sos/:id returns HTTP 200');
  assert(getSingle.body?.data?.phoneMasked === '+91 98**** 3210', 'Phone is masked (+91 98**** 3210)');
  assert(getSingle.body?.data?.rawPhone === undefined, 'Raw citizen phone is redacted from public API response');

  // -------------------------------------------------------------
  // Test Suite 5: Frontend Codebase Secrets Audit
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Frontend Codebase Secrets Audit ---');
  const srcDir = path.resolve(process.cwd(), 'src');
  const sensitivePatterns = [
    /AIza[0-9A-Za-z-_]{35}/, // Google Maps / Firebase API Key
    /sk_live_[0-9a-zA-Z]{24}/, // Stripe live key
    /ghp_[0-9a-zA-Z]{36}/, // GitHub personal access token
  ];

  let leakedSecretsCount = 0;
  function scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            console.error(`  [LEAK DETECTED] File ${entry.name} matches pattern ${pattern}`);
            leakedSecretsCount++;
          }
        }
      }
    }
  }

  scanDirectory(srcDir);
  assert(leakedSecretsCount === 0, 'Zero private vendor secrets detected in src/ directory');

  // -------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------
  console.log('\n===========================================================');
  console.log(`  SOS COMMAND CENTER VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  RealtimeHub.stopHeartbeat();

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runSOSLifecycleVerification().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
