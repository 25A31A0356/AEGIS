import { LocationService } from '../src/services/locationService';
import { WeatherService } from '../src/services/weatherService';
import { HazardService } from '../src/services/hazardService';
import { AnalyticsService } from '../src/services/analyticsService';
import { ReportService } from '../src/services/reportService';
import { MapService } from '../src/services/mapService';
import { AIService } from '../src/services/aiService';
import { ProviderRegistry } from '../src/providers/ProviderRegistry';
import { SAFETY_GUIDES } from '../src/data/safetyGuidesData';
import { RealtimeHub } from '../server/services/RealtimeHub';

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('🔍 AGIES ALERT COMPLETE FUNCTIONALITY VERIFICATION PASS');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    }
  }

  // 1. DATA PROVIDER ARCHITECTURE
  console.log('--- 1. DATA PROVIDER ARCHITECTURE (LIVE vs DEMO) ---');
  const initialMode = ProviderRegistry.getDataMode();
  assert(initialMode === 'LIVE' || initialMode === 'DEMO', `Default Data Mode is valid: ${initialMode}`);

  ProviderRegistry.setDataMode('DEMO');
  assert(ProviderRegistry.getDataMode() === 'DEMO', 'ProviderRegistry switches to DEMO mode');
  const demoWeather = await ProviderRegistry.getWeatherProvider().getWeatherByCoordinates(19.076, 72.8777);
  assert(demoWeather.mode === 'DEMO', 'Weather provider returns DEMO mode payload in DEMO');

  ProviderRegistry.setDataMode('LIVE');
  assert(ProviderRegistry.getDataMode() === 'LIVE', 'ProviderRegistry switches to LIVE mode');
  const liveWeather = await ProviderRegistry.getWeatherProvider().getWeatherByCoordinates(19.076, 72.8777);
  assert(liveWeather.mode === 'LIVE', 'Weather provider returns LIVE mode payload in LIVE');

  const providersHealth = ProviderRegistry.getProvidersHealth();
  assert(providersHealth.length === 7, `All 7 provider health checks evaluated: ${providersHealth.length}/7`);
  const activeCount = providersHealth.filter(p => p.status === 'ONLINE').length;
  assert(activeCount === 7, `All 7 providers online in LIVE mode (${activeCount}/7)`);

  // 2. LOCATION SYSTEM & GEOCODING
  console.log('\n--- 2. LOCATION SYSTEM & GEOCODING ---');
  const searchResults = await LocationService.searchLocation('Hyderabad');
  assert(searchResults.length > 0, `Location search returns results for 'Hyderabad': found ${searchResults.length}`);
  assert(searchResults[0].coordinates.length === 2, `Result contains valid lat/lng coordinates: [${searchResults[0].coordinates.join(', ')}]`);

  const reverseGeo = await LocationService.reverseGeocode(17.385, 78.4867);
  assert(reverseGeo.cityName.length > 0, `Reverse geocoding resolves coordinates to city: ${reverseGeo.cityName}`);

  const nearbyActs = LocationService.getNearbyActivity([17.385, 78.4867]);
  assert(Array.isArray(nearbyActs), `Nearby activity feed initialized as array`);
  const calcDist = LocationService.calculateDistanceKm([17.385, 78.4867], [17.425, 78.5167]);
  assert(calcDist > 0, `Location distance calculator computes radial km distance: ${calcDist} km`);

  // 3. HOMEPAGE & WEATHER TELEMETRY
  console.log('\n--- 3. HOMEPAGE WEATHER & RISK ---');
  const hydWeather = WeatherService.getWeatherForCity('hyderabad');
  assert(hydWeather.temp > 0, `Weather telemetry loaded: Temp ${hydWeather.temp}°C`);
  assert(hydWeather.humidity >= 0 && hydWeather.humidity <= 100, `Humidity metric present: ${hydWeather.humidity}%`);
  assert(hydWeather.windSpeed >= 0, `Wind speed metric present: ${hydWeather.windSpeed} km/h`);
  assert(hydWeather.uvIndex >= 0, `UV Index metric present: ${hydWeather.uvIndex}`);
  assert(hydWeather.barometricPressureHpa > 900, `Pressure metric present: ${hydWeather.barometricPressureHpa} mb`);
  assert(hydWeather.visibilityKm > 0, `Visibility metric present: ${hydWeather.visibilityKm} km`);

  const allHazards = HazardService.getAllHazards();
  assert(allHazards.length >= 4, `Hazard alerts feed active: ${allHazards.length} alerts loaded`);

  // 4. ANALYTICS & EXPORTS
  console.log('\n--- 4. ANALYTICS & EXPORTS ---');
  const analyticsData = AnalyticsService.getAnalyticsData({
    location: 'all',
    hazard: 'all',
    dateRange: '7d',
  });
  assert(analyticsData.timeline.length > 0, `Timeline series loaded: ${analyticsData.timeline.length} points`);
  assert(analyticsData.severityDistribution.length > 0, `Severity distribution loaded: ${analyticsData.severityDistribution.length} categories`);
  assert(analyticsData.regionalImpact.length > 0, `Regional impact data loaded: ${analyticsData.regionalImpact.length} regions`);
  assert(analyticsData.stats.totalEvents > 0, `Total events metric calculated: ${analyticsData.stats.totalEvents}`);

  // Test filter reactivity
  const filteredData = AnalyticsService.getAnalyticsData({
    location: 'mumbai',
    hazard: 'flood',
    dateRange: '24h',
  });
  assert(filteredData.stats.totalEvents <= analyticsData.stats.totalEvents, 'Analytics filters reactively narrow dataset scope');

  const exportPayload = AnalyticsService.createExportPayload(
    { location: 'all', hazard: 'all', dateRange: '7d' },
    analyticsData
  );
  assert(exportPayload.stats.totalEvents === analyticsData.stats.totalEvents, 'Export payload generated correctly with stats');

  // 5. SAFETY & DISASTER GUIDES
  console.log('\n--- 5. SAFETY & DISASTER GUIDES ---');
  const availableGuideKeys = Object.keys(SAFETY_GUIDES);
  assert(availableGuideKeys.length >= 6, `Comprehensive safety guides available: ${availableGuideKeys.length} categories`);
  
  const floodGuide = SAFETY_GUIDES['floods'];
  assert(floodGuide.dos.length === 4, `Floods guide has exactly 4 numbered DO'S: count = ${floodGuide.dos.length}`);
  assert(floodGuide.donts.length === 4, `Floods guide has exactly 4 numbered DON'TS: count = ${floodGuide.donts.length}`);
  assert(floodGuide.video.duration.length > 0, `Floods guide has verified training video tutorial: ${floodGuide.video.title}`);

  const cycloneGuide = SAFETY_GUIDES['cyclones'];
  assert(cycloneGuide.dos.length === 4 && cycloneGuide.donts.length === 4, 'Cyclones guide has 4 DOs & 4 DONTS');
  assert(cycloneGuide.tagline !== floodGuide.tagline, 'Disaster selection dynamically updates guidance content');

  // 6. CITIZEN INCIDENT REPORTS
  console.log('\n--- 6. CITIZEN INCIDENT REPORTS ---');
  const mockMediaFile = new File(['mock_image_binary_data'], 'waterlogging_site.jpg', { type: 'image/jpeg' });
  const uploadedMedia = await ReportService.uploadMediaToObjectStorage(mockMediaFile);
  assert(uploadedMedia.id.startsWith('med-') || uploadedMedia.id.startsWith('media-'), `Media upload generated media ID: ${uploadedMedia.id}`);
  assert(uploadedMedia.url.length > 0, `Media URL generated: ${uploadedMedia.url}`);

  const submittedReport = await ReportService.submitReport({
    hazardType: 'flood',
    hazardLabel: 'Severe Urban Inundation',
    location: {
      lat: 17.4482,
      lng: 78.3915,
      address: 'Madhapur 100 Feet Road, Hyderabad',
      city: 'Hyderabad',
      state: 'Telangana',
    },
    media: [uploadedMedia],
    description: 'Over 3.5 feet of fast moving stormwater accumulation blocking major artery.',
    severity: 'high',
    optionalDetails: {
      peopleAffectedEstimate: '20-50',
      isRoadBlocked: true,
      isImmediateDanger: true,
    },
    reporter: {
      name: 'Ananya Sharma',
      isAnonymous: false,
    },
  });

  assert(submittedReport.id && submittedReport.id.length > 0, `Report submission successful! Generated ID: ${submittedReport.id}`);
  assert(submittedReport.status === 'pending_review' || submittedReport.status === 'active' || submittedReport.status === 'submitted', `Initial report status: ${submittedReport.status}`);

  // 7. LIVE MAP GIS & TECHNICAL LAYERS
  console.log('\n--- 7. LIVE MAP GIS & TECHNICAL LAYERS ---');
  const streetTile = MapService.getTileProvider('streets');
  assert(streetTile.url.includes('google') || streetTile.url.includes('openstreetmap') || streetTile.url.includes('cartocdn') || streetTile.url.includes('tile'), `Streets tile provider configured: ${streetTile.name}`);
  const satTile = MapService.getTileProvider('satellite');
  assert(satTile.url.includes('google') || satTile.url.includes('arcgisonline') || satTile.url.includes('satellite'), `Satellite imagery provider configured: ${satTile.name}`);

  const layers = await MapService.fetchMapLayers(19.076, 72.8777);
  assert(layers && typeof layers.radar === 'object', `Doppler Radar technical layer pipeline verified`);
  assert(layers && typeof layers.lightning === 'object', `Lightning sensor technical layer pipeline verified`);

  // 8. ASK AGIES GLOBAL CONTEXT-AWARE AI
  console.log('\n--- 8. ASK AGIES AI CHATBOT ---');
  const aiRiskResponse = await AIService.sendMessage({
    message: 'What is my current risk?',
    context: {
      pageContext: 'live-map',
      locationName: 'Hyderabad',
      currentRisk: { score: 78, level: 'High Risk' },
      currentWeather: {
        temperature: 32,
        condition: 'Thunderstorm with heavy rain',
        humidity: 82,
        windSpeed: 28,
        rainProbability: 90,
      },
      dataMode: 'LIVE',
    },
  });
  assert(aiRiskResponse.answer.includes('Current Risk Assessment'), 'Ask AGIES correctly recognizes risk queries');
  assert(aiRiskResponse.answer.includes('Hyderabad'), 'Ask AGIES injects location context into response');
  assert(aiRiskResponse.sources.length > 0, `Response grounded with authoritative sources: ${aiRiskResponse.sources[0]}`);
  assert(aiRiskResponse.suggestedActions.length > 0, `Response provides interactive actionable shortcuts: ${aiRiskResponse.suggestedActions[0].label}`);

  const aiRadarResponse = await AIService.sendMessage({
    message: 'What does this radar layer mean?',
    context: {
      pageContext: 'live-map',
      locationName: 'Mumbai',
      dataMode: 'LIVE',
    },
  });
  assert(aiRadarResponse.answer.includes('dBZ'), 'Ask AGIES explains technical Doppler radar dBZ scales');

  const aiDataModeResponse = await AIService.sendMessage({
    message: 'Is this real data or demo mode?',
    context: {
      pageContext: 'homepage',
      locationName: 'Chennai',
      dataMode: 'LIVE',
    },
  });
  assert(aiDataModeResponse.answer.includes('LIVE MODE') && aiDataModeResponse.answer.includes('IMD'), 'Ask AGIES provides full data provenance & dataMode transparency');

  console.log('\n====================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('====================================================');

  RealtimeHub.stopHeartbeat();

  process.exit(passedTests < totalTests ? 1 : 0);
}

runComprehensiveVerification().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

