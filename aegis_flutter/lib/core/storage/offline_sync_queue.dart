import 'dart:async';

class OfflineSyncQueue {
  static final OfflineSyncQueue _instance = OfflineSyncQueue._internal();
  factory OfflineSyncQueue() => _instance;
  OfflineSyncQueue._internal();

  final List<Map<String, dynamic>> _pendingQueue = [];

  void enqueue(String type, Map<String, dynamic> payload) {
    _pendingQueue.add({
      'type': type,
      'payload': payload,
      'enqueuedAt': DateTime.now().toIso8601String(),
    });
  }

  List<Map<String, dynamic>> getPending() => List.unmodifiable(_pendingQueue);
  void clearPending() => _pendingQueue.clear();
}
