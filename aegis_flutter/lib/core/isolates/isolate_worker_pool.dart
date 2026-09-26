import 'dart:async';
import 'dart:convert';
import 'dart:isolate';

class FastIsolateWorkerPool {
  FastIsolateWorkerPool._();

  static Future<T> parseJson<T>({
    required String rawJson,
    required T Function(dynamic jsonMap) deserializer,
  }) async {
    return await Isolate.run<T>(() {
      final dynamic decoded = jsonDecode(rawJson);
      return deserializer(decoded);
    });
  }

  static Future<List<T>> parseList<T>({
    required String rawJson,
    required T Function(Map<String, dynamic> item) fromMap,
  }) async {
    return await Isolate.run<List<T>>(() {
      final dynamic decoded = jsonDecode(rawJson);
      if (decoded is! List) return <T>[];
      return decoded
          .map<T>((item) => fromMap(item as Map<String, dynamic>))
          .toList(growable: false);
    });
  }
}
