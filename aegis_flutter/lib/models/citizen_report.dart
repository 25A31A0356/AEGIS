class CitizenReportModel {
  final String id;
  final String hazardType;
  final String title;
  final String description;
  final String severity;
  final double latitude;
  final double longitude;
  final String timestamp;
  final int upvotes;

  const CitizenReportModel({
    required this.id,
    required this.hazardType,
    required this.title,
    required this.description,
    required this.severity,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    required this.upvotes,
  });

  factory CitizenReportModel.fromMap(Map<String, dynamic> map) {
    return CitizenReportModel(
      id: map['id'] as String? ?? '',
      hazardType: map['hazard_type'] as String? ?? 'FLOOD',
      title: map['title'] as String? ?? 'Field Hazard',
      description: map['description'] as String? ?? '',
      severity: map['severity'] as String? ?? 'MODERATE',
      latitude: (map['latitude'] as num?)?.toDouble() ?? 19.0760,
      longitude: (map['longitude'] as num?)?.toDouble() ?? 72.8777,
      timestamp: map['timestamp'] as String? ?? 'Just now',
      upvotes: (map['upvotes'] as num?)?.toInt() ?? 1,
    );
  }
}
