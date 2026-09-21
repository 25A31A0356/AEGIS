/**
 * AEGIS ALERT - Master End-to-End Synchronization & Architecture Verification Suite
 * 
 * Verifies:
 * 1. Single Authoritative Backend Gateway (/api/v1 on port 8000)
 * 2. Mobile -> Backend -> Database -> Web Bidirectional Report Sync
 * 3. Web -> Backend -> Database -> Mobile Bidirectional Report Sync
 * 4. Zero Username Search Required for Global Activities
 * 5. Persistent SOS Signals & Schema Integrity (idempotency_key)
 * 6. Central Hazard Alerts & SASGrid Map Telemetry
 * 7. Offline Queue Replay & Idempotency Deduplication
 */

import { ApiClient } from '../src/services/apiClient';
import { ReportService } from '../src/services/reportService';
import { ActivityService } from '../src/services/activityService';
import { SOSService } from '../src/services/sosService';

async function runMasterE2EVerification() {
  console.log('======================================================================');
  console.log('🛡️  AEGIS MASTER E2E INTEGRATION & BIDIRECTIONAL SYNC VERIFICATION PASS');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetails?: any) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`, errorDetails ? errorDetails : '');
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Central Backend Health & Single Source of Truth Discovery
  // --------------------------------------------------------------------------
  console.log('--- 1. Central Backend Health & Gateway Discovery ---');
  const healthRes = await ApiClient.getWithMeta<any>('/health');
  assert(healthRes.success, 'Central Backend Gateway reached at /api/v1/health');
  assert(healthRes.data?.system_status === 'HEALTHY', `System status is HEALTHY (received: ${healthRes.data?.system_status})`);
  assert(healthRes.data?.security_posture === 'HARDENED', 'Backend reports HARDENED security posture');

  // --------------------------------------------------------------------------
  // TEST SUITE 2: TEST A - Mobile Report -> Central Backend -> Web Sync
  // --------------------------------------------------------------------------
  console.log('\n--- 2. TEST A: Mobile -> Backend -> Database -> Web Sync ---');
  const uniqueMobileTag = `Mobile-E2E-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const mobileIdempotencyKey = `idem-mobile-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  const mobilePayload = {
    category: 'FLOOD',
    hazard_type: 'flood',
    title: `Flash Flood Near Madhapur Bridge [${uniqueMobileTag}]`,
    description: `Severe inundation reported from mobile GPS tracker. Water level at 1.2 meters over road. [${uniqueMobileTag}]`,
    severity: 'HIGH',
    latitude: 17.4482,
    longitude: 78.3915,
    accuracy_meters: 5.0,
    location_name: 'Madhapur 100ft Road, Hyderabad',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    media_urls: ['https://storage.aegis.gov.in/evidence/flood_mobile_01.jpg'],
    reporter_name: 'Ravi Teja (Mobile Volunteer)',
    idempotency_key: mobileIdempotencyKey,
  };

  // Submit via Mobile REST endpoint on Central Backend
  const mobilePostRes = await ApiClient.post<any>('/reports', mobilePayload);
  assert(!!mobilePostRes, 'Mobile report submitted successfully to Central Backend');
  assert(!!mobilePostRes?.id, `Mobile report assigned persistent database ID: ${mobilePostRes?.id}`);
  assert(mobilePostRes?.title?.includes(uniqueMobileTag) || mobilePostRes?.idempotency_key === mobileIdempotencyKey, 'Report contains submitted metadata');

  const mobileReportId = mobilePostRes?.id;

  // Web queries /reports directly
  const webLiveReports = await ReportService.fetchLiveReports();
  const foundWebReport = webLiveReports.find((r) => r.id === mobileReportId || r.description?.includes(uniqueMobileTag) || r.hazardLabel?.includes(uniqueMobileTag));
  assert(!!foundWebReport, `Web fetchLiveReports retrieved mobile report without username search: ${foundWebReport?.id}`);

  // Web queries /activity directly
  const webActivities = await ActivityService.getActivities(50, true);
  const foundActivity = webActivities.find((a) => a.id?.includes(mobileReportId) || a.title?.includes(uniqueMobileTag) || a.description?.includes(uniqueMobileTag));
  assert(!!foundActivity, `Web Activity Feed contains real mobile event: "${foundActivity?.title}"`);

  // --------------------------------------------------------------------------
  // TEST SUITE 3: TEST B - Web Report -> Central Backend -> Mobile Sync
  // --------------------------------------------------------------------------
  console.log('\n--- 3. TEST B: Web -> Backend -> Database -> Mobile Sync ---');
  const uniqueWebTag = `Web-Portal-E2E-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const webReportSubmission = await ReportService.submitReport({
    hazardType: 'landslide',
    hazardLabel: `Landslide Blocking Hill Route [${uniqueWebTag}]`,
    location: {
      lat: 17.7231,
      lng: 83.3152,
      address: 'Kailasagiri Ghat Road, Visakhapatnam',
      city: 'Visakhapatnam',
      state: 'Andhra Pradesh',
    },
    description: `Massive boulders and debris covering northern lane after heavy rains. [${uniqueWebTag}]`,
    severity: 'critical',
    reporter: {
      name: 'Pooja Varma',
      isAnonymous: false,
    },
  });

  assert(!!webReportSubmission.id, `Web report submitted and assigned persistent ID: ${webReportSubmission.id}`);

  // Verify mobile endpoint /reports returns this exact web report
  const mobileReportsFeed = await ApiClient.get<any[]>('/reports', undefined, { skipCache: true });
  const rawList = Array.isArray(mobileReportsFeed) ? mobileReportsFeed : (mobileReportsFeed as any)?.data || [];
  const foundInMobileFeed = rawList.find(
    (r: any) => r.id === webReportSubmission.id || r.title?.includes(uniqueWebTag) || r.description?.includes(uniqueWebTag)
  );
  assert(!!foundInMobileFeed, `Mobile reports feed retrieves Web-originated report from PostGIS database: ${foundInMobileFeed?.id}`);

  // --------------------------------------------------------------------------
  // TEST SUITE 4: TEST C - SOS Emergency Beacon Lifecycle
  // --------------------------------------------------------------------------
  console.log('\n--- 4. TEST C: Emergency SOS Beacon Lifecycle ---');
  const uniqueSOSTag = `Distress-E2E-${Date.now()}`;
  const createdBeacon = await SOSService.createSOSBeacon({
    anonymousAlias: `Citizen in Distress [${uniqueSOSTag}]`,
    emergencyType: 'flash_flood_stranding',
    emergencyTitle: `Stranded in Rising Floodwaters [${uniqueSOSTag}]`,
    locationName: 'Gopalpur Coastal Ward, Ganjam',
    district: 'Ganjam',
    state: 'Odisha',
    coordinates: [19.2612, 84.9084],
    gpsAccuracyMeters: 4.5,
    batteryPercent: 48,
    personsCount: 3,
    severity: 'critical',
  });

  assert(!!createdBeacon?.id, `Emergency SOS beacon created in database with ID: ${createdBeacon?.id}`);

  // Query /sos to verify persistence
  const activeSOSBeacons = await SOSService.fetchBeaconsFromApi(true);
  const foundSOS = activeSOSBeacons.find((b) => b.id === createdBeacon.id || b.emergencyTitle?.includes(uniqueSOSTag));
  assert(!!foundSOS, `Active SOS beacon persisted and retrievable via /api/v1/sos: ${foundSOS?.id}`);
  assert(foundSOS?.triageStatus === 'PENDING' || foundSOS?.triageStatus === 'MATCHING' || foundSOS?.triageStatus === 'OFFERED' || foundSOS?.triageStatus === 'ACCEPTED', `SOS beacon triage state valid: ${foundSOS?.triageStatus}`);

  // --------------------------------------------------------------------------
  // TEST SUITE 5: TEST D - Shared Central Hazard Alerts
  // --------------------------------------------------------------------------
  console.log('\n--- 5. TEST D: Central Hazard Alerts Shared Feed ---');
  const alertsRes = await ApiClient.get<any[]>('/alerts');
  const alertsList = Array.isArray(alertsRes) ? alertsRes : (alertsRes as any)?.data || [];
  assert(alertsList.length > 0, `Central Hazard Alerts stream active: ${alertsList.length} authoritative alerts loaded`);
  if (alertsList.length > 0) {
    const alert0 = alertsList[0];
    assert(!!alert0.id && !!alert0.severity, `Alert record structure validated: [${alert0.severity}] ${alert0.title || alert0.headline || alert0.id}`);
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 6: TEST E - Offline Queue Replay & Idempotency Protection
  // --------------------------------------------------------------------------
  console.log('\n--- 6. TEST E: Offline Idempotency & Deduplication ---');
  const duplicateIdempotencyKey = `idem-test-${Date.now()}`;
  const firstSubmission = await ApiClient.post<any>('/reports', {
    ...mobilePayload,
    title: `Idempotency Test Original [${duplicateIdempotencyKey}]`,
    idempotency_key: duplicateIdempotencyKey,
  });

  const replaySubmission = await ApiClient.post<any>('/reports', {
    ...mobilePayload,
    title: `Idempotency Test Replay [${duplicateIdempotencyKey}]`,
    idempotency_key: duplicateIdempotencyKey,
  });

  assert(firstSubmission?.id === replaySubmission?.id, `Duplicate submission with same idempotency key matched original ID: ${firstSubmission?.id}`);

  // --------------------------------------------------------------------------
  // TEST SUITE 7: TEST F - Weather, Analytics, Map Layers Telemetry
  // --------------------------------------------------------------------------
  console.log('\n--- 7. TEST F: Weather, Analytics & Map Layer Telemetry ---');
  const weatherRes = await ApiClient.get<any>('/weather', { city: 'Hyderabad' });
  assert(!!weatherRes, 'Central weather endpoint returned telemetry');

  const analyticsRes = await ApiClient.get<any>('/analytics', { date_range: '7d' });
  assert(!!analyticsRes, 'Central analytics endpoint returned regional statistics');

  const mapLayersRes = await ApiClient.get<any>('/map-data');
  assert(!!mapLayersRes, 'Central spatial layers endpoint returned PostGIS GIS layers');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🏁 MASTER E2E VERIFICATION COMPLETE: ${passed}/${passed + failed} TESTS PASSED`);
  console.log('======================================================================\n');

  if (failed > 0) {
    process.exitCode = 1;
  } else {
    process.exitCode = 0;
  }
}

runMasterE2EVerification().catch((err) => {
  console.error('Fatal Test Execution Error:', err);
  process.exitCode = 1;
});
