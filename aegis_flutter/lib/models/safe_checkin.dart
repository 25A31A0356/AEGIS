class SafeCheckinModel {
  final String userId;
  final String userName;
  final String status;
  final String locationName;
  final String timestamp;
  final int batteryPercent;

  const SafeCheckinModel({
    required this.userId,
    required this.userName,
    required this.status,
    required this.locationName,
    required this.timestamp,
    required this.batteryPercent,
  });

  factory SafeCheckinModel.fromMap(Map<String, dynamic> map) {
    return SafeCheckinModel(
      userId: map['user_id'] as String? ?? '',
      userName: map['user_name'] as String? ?? 'Citizen',
      status: map['status'] as String? ?? 'SAFE',
      locationName: map['location_name'] as String? ?? 'Mumbai Central',
      timestamp: map['timestamp'] as String? ?? 'Just now',
      batteryPercent: (map['battery_percent'] as num?)?.toInt() ?? 85,
    );
  }
}
