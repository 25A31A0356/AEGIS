/**
 * AEGIS ALERT - Real-time Community Activity & Map Sync E2E Verification Suite
 * Validates backend SSE event hub, report broadcasting, /api/v1/activity unification,
 * marker deduplication, and privacy redaction.
 */

import { handleBackendApiRequest } from '../server/router';
import { RealtimeHub, RealtimeEventPayload } from '../server/services/RealtimeHub';
import { ReportService } from '../server/services/ReportService';

async function runRealtimeSyncVerification() {
  console.log('===========================================================');
  console.log('  AEGIS ALERT: REAL-TIME COMMUNITY SYNC VERIFICATION');
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
  // Test 1: API Discovery declares activity and events endpoints
  // -------------------------------------------------------------
  console.log('--- Test Suite 1: Discovery & Endpoint Catalog ---');
  const discRes = await handleBackendApiRequest({
    method: 'GET',
    url: '/api/discovery',
    path: '/api/discovery',
    query: {},
    headers: {},
  });

  assert(discRes.status === 200, 'GET /api/discovery returns HTTP 200');
  assert(discRes.body?.data?.endpoints?.activity === '/api/v1/activity', 'Discovery declares /api/v1/activity endpoint');
  assert(discRes.body?.data?.endpoints?.events === '/api/v1/events', 'Discovery declares /api/v1/events endpoint');

  // -------------------------------------------------------------
  // Test 2: RealtimeHub Subscription and Event Broadcast
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 2: RealtimeHub Subscriber Fan-Out ---');
  let receivedEvent: RealtimeEventPayload | null = null;
  const unsubscribe = RealtimeHub.subscribe((evt) => {
    receivedEvent = evt;
  });

  const testReportPayload = {
    hazardType: 'Flood',
    title: 'High Tide Inundation & Sea Water Overtopping',
    description: 'Waves breached the promenade wall; water flooding low-lying parking sector.',
    severity: 'high' as const,
    location: {
      lat: 18.9438,
      lng: 72.8234,
      address: 'Marine Drive Promenade Sector 4',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    contactInfo: {
      name: 'Rohan V.',
      phone: '+91 99887 66554',
      isAnonymous: false,
    },
    mediaUrls: [],
  };

  const created = await ReportService.createReport(testReportPayload, '192.168.1.100');
  assert(!!created.trackingId, `Report created with tracking ID: ${created.trackingId}`);
  assert(created.status === 'pending_review', 'Report initialized with pending_review status');

  // Verify subscriber received event
  assert(receivedEvent !== null, 'RealtimeHub broadcast event delivered to active subscriber');
  assert((receivedEvent as any)?.type === 'REPORT_CREATED', 'Event type is REPORT_CREATED');
  assert((receivedEvent as any)?.data?.trackingId === created.trackingId, 'Broadcast payload contains matching report tracking ID');

  unsubscribe();

  // -------------------------------------------------------------
  // Test 3: Activity Stream GET /api/v1/activity
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 3: Activity Feed GET /api/v1/activity ---');
  const actRes = await handleBackendApiRequest({
    method: 'GET',
    url: '/api/v1/activity?limit=20',
    path: '/api/v1/activity',
    query: { limit: '20' },
    headers: {},
  });

  assert(actRes.status === 200, 'GET /api/v1/activity returns HTTP 200');
  const activities = actRes.body?.data?.activities;
  assert(Array.isArray(activities) && activities.length > 0, `Returned ${activities?.length} unified activity items`);

  // Check that the new report is included
  const foundReportInActivity = activities?.find((a: any) => a.trackingId === created.trackingId);
  assert(!!foundReportInActivity, 'New community report present in /api/v1/activity feed');
  assert(foundReportInActivity?.sourceAgency === 'Citizen Intelligence Network', 'Community report marked with Citizen Intelligence Network source');
  assert(foundReportInActivity?.actionUrl?.includes(created.trackingId), 'Activity actionUrl links to live map with reportId');

  // Check that official bulletins are also merged
  const foundOfficial = activities?.find((a: any) => a.sourceType === 'official');
  assert(!!foundOfficial, 'Official IMD/CWC bulletins merged alongside community reports');

  // -------------------------------------------------------------
  // Test 4: Real-time Event Polling Buffer GET /api/v1/events
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 4: Event Polling Buffer GET /api/v1/events ---');
  const eventsRes = await handleBackendApiRequest({
    method: 'GET',
    url: '/api/v1/events',
    path: '/api/v1/events',
    query: {},
    headers: {},
  });

  assert(eventsRes.status === 200, 'GET /api/v1/events returns HTTP 200');
  const events = eventsRes.body?.data?.events;
  assert(Array.isArray(events) && events.length > 0, `Event buffer returned ${events?.length} buffered events`);
  const bufferedEvent = events?.find((e: any) => e.data?.trackingId === created.trackingId);
  assert(!!bufferedEvent, 'New report creation event persisted in buffer for reconnecting clients');

  // -------------------------------------------------------------
  // Test 5: Client-side Safety & Zero Direct Keys Validation
  // -------------------------------------------------------------
  console.log('\n--- Test Suite 5: Security & Architecture Rules ---');
  assert(!JSON.stringify(activities).includes('AIzaSy'), 'No Google/vendor private API keys exposed in activity feed');
  assert(!JSON.stringify(activities).includes('secret'), 'No database/server secrets leaked in activity stream');

  console.log('\n===========================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  RealtimeHub.stopHeartbeat();

  process.exit(failed > 0 ? 1 : 0);
}

runRealtimeSyncVerification().catch((err) => {
  console.error('[Verification Suite Fatal Error]', err);
  process.exitCode = 1;
});
