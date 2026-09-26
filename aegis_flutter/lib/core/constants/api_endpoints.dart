class AegisEndpoints {
  AegisEndpoints._();
  static const String baseUrl = 'http://127.0.0.1:8000';
  static const String apiV1 = '$baseUrl/api/v1';
  static const String health = '$baseUrl/health';
  static const String weather = '$apiV1/weather';
  static const String hazards = '$apiV1/hazards';
  static const String sos = '$apiV1/sos';
  static const String sosNearby = '$apiV1/sos/nearby';
  static const String safeCheckin = '$apiV1/safe-checkin';
  static const String reports = '$apiV1/reports';
  static const String shelters = '$apiV1/shelters';
}
