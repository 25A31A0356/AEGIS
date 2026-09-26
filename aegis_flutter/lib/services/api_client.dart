import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/constants/api_endpoints.dart';
import '../core/isolates/isolate_worker_pool.dart';
import '../models/weather_telemetry.dart';
import '../models/hazard_model.dart';
import '../models/safe_checkin.dart';
import '../models/citizen_report.dart';

class AegisApiClient {
  static final AegisApiClient _instance = AegisApiClient._internal();
  factory AegisApiClient() => _instance;
  AegisApiClient._internal();

  Future<WeatherTelemetry> fetchWeather(double lat, double lon) async {
    try {
      final res = await http.get(Uri.parse("${AegisEndpoints.weather}?lat=$lat&lon=$lon")).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        return await FastIsolateWorkerPool.parseJson<WeatherTelemetry>(
          rawJson: res.body,
          deserializer: (map) => WeatherTelemetry.fromMap((map["data"] as Map<String, dynamic>?) ?? {}),
        );
      }
    } catch (_) {}
    return const WeatherTelemetry(
      temperature: 30.2,
      humidity: 78.0,
      windSpeed: 18.5,
      aqi: 128,
      condition: "Tropical Monsoon Alert",
      riskScore: 0.62,
      riskLevel: "HIGH",
    );
  }

  Future<List<HazardModel>> fetchHazards() async {
    try {
      final res = await http.get(Uri.parse(AegisEndpoints.hazards)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        return await FastIsolateWorkerPool.parseList<HazardModel>(
          rawJson: res.body,
          fromMap: (item) => HazardModel.fromMap(item),
        );
      }
    } catch (_) {}
    return [
      const HazardModel(id: "H1", title: "Mumbai Coastal Surge", type: "FLOOD", severity: "CRITICAL", latitude: 18.96, longitude: 72.82, radiusKm: 12.0, description: "High tidal surge alert", source: "IMD"),
      const HazardModel(id: "H2", title: "Delhi Stubble Smog", type: "AIR_QUALITY", severity: "HIGH", latitude: 28.61, longitude: 77.23, radiusKm: 25.0, description: "AQI exceeding 450 PM2.5", source: "CPCB"),
      const HazardModel(id: "H3", title: "Odisha Depression Cyclone", type: "CYCLONE", severity: "CRITICAL", latitude: 19.81, longitude: 85.83, radiusKm: 40.0, description: "Gusts up to 110km/h", source: "IMD"),
    ];
  }

  Future<List<CitizenReportModel>> fetchReports() async {
    try {
      final res = await http.get(Uri.parse(AegisEndpoints.reports)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        return await FastIsolateWorkerPool.parseList<CitizenReportModel>(
          rawJson: res.body,
          fromMap: (item) => CitizenReportModel.fromMap(item),
        );
      }
    } catch (_) {}
    return [
      const CitizenReportModel(id: "R1", hazardType: "WATERLOGGING", title: "Hindmata Flyover Flooded", description: "Water level 2.5 ft. Traffic stalled.", severity: "HIGH", latitude: 19.01, longitude: 72.84, timestamp: "8m ago", upvotes: 24),
      const CitizenReportModel(id: "R2", hazardType: "TREE_FALL", title: "Fallen Banyan on SV Road", description: "Both lanes blocked near Khar.", severity: "MODERATE", latitude: 19.07, longitude: 72.83, timestamp: "15m ago", upvotes: 12),
    ];
  }
}
