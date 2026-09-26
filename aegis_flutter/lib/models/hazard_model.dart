class HazardModel {
  final String id;
  final String title;
  final String type;
  final String severity;
  final double latitude;
  final double longitude;
  final double radiusKm;
  final String description;
  final String source;

  const HazardModel({
    required this.id,
    required this.title,
    required this.type,
    required this.severity,
    required this.latitude,
    required this.longitude,
    required this.radiusKm,
    required this.description,
    required this.source,
  });

  factory HazardModel.fromMap(Map<String, dynamic> map) {
    return HazardModel(
      id: map['id'] as String? ?? '',
      title: map['title'] as String? ?? 'Hazard Alert',
      type: map['type'] as String? ?? 'GENERAL',
      severity: map['severity'] as String? ?? 'MODERATE',
      latitude: (map['latitude'] as num?)?.toDouble() ?? 19.0760,
      longitude: (map['longitude'] as num?)?.toDouble() ?? 72.8777,
      radiusKm: (map['radius_km'] as num?)?.toDouble() ?? 15.0,
      description: map['description'] as String? ?? '',
      source: map['source'] as String? ?? 'IMD/CWC',
    );
  }
}
