class WeatherTelemetry {
  final double temperature;
  final double humidity;
  final double windSpeed;
  final int aqi;
  final String condition;
  final double riskScore;
  final String riskLevel;

  const WeatherTelemetry({
    required this.temperature,
    required this.humidity,
    required this.windSpeed,
    required this.aqi,
    required this.condition,
    required this.riskScore,
    required this.riskLevel,
  });

  factory WeatherTelemetry.fromMap(Map<String, dynamic> map) {
    return WeatherTelemetry(
      temperature: (map['temperature'] as num?)?.toDouble() ?? 29.5,
      humidity: (map['humidity'] as num?)?.toDouble() ?? 74.0,
      windSpeed: (map['wind_speed'] as num?)?.toDouble() ?? 14.2,
      aqi: (map['aqi'] as num?)?.toInt() ?? 142,
      condition: map['condition'] as String? ?? 'Moderate Rain',
      riskScore: (map['risk_score'] as num?)?.toDouble() ?? 0.45,
      riskLevel: map['risk_level'] as String? ?? 'MODERATE',
    );
  }
}
