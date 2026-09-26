import 'dart:async';
import 'package:flutter/services.dart';
import '../models/sos_beacon.dart';

class SosService {
  static final SosService _instance = SosService._internal();
  factory SosService() => _instance;
  SosService._internal();

  Future<SosBeacon> triggerDistressBeacon({
    required double latitude,
    required double longitude,
    required String emergencyType,
  }) async {
    HapticFeedback.heavyImpact();
    // Immediate simulated PostGIS match response
    return SosBeacon(
      id: "SOS-${DateTime.now().millisecondsSinceEpoch}",
      latitude: latitude,
      longitude: longitude,
      emergencyType: emergencyType,
      status: "ACTIVE_BROADCAST",
      timestamp: "Just now",
      respondersMatched: 6,
    );
  }
}
