class SosBeacon {
  final String id;
  final double latitude;
  final double longitude;
  final String emergencyType;
  final String status;
  final String timestamp;
  final int respondersMatched;

  const SosBeacon({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.emergencyType,
    required this.status,
    required this.timestamp,
    required this.respondersMatched,
  });

  factory SosBeacon.fromMap(Map<String, dynamic> map) {
    return SosBeacon(
      id: map['id'] as String? ?? '',
      latitude: (map['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (map['longitude'] as num?)?.toDouble() ?? 0.0,
      emergencyType: map['emergency_type'] as String? ?? 'MEDICAL',
      status: map['status'] as String? ?? 'BROADCASTING',
      timestamp: map['timestamp'] as String? ?? '',
      respondersMatched: (map['responders_matched'] as num?)?.toInt() ?? 0,
    );
  }
}
