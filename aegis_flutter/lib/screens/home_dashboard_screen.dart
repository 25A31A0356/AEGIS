import 'package:flutter/material.dart';
import '../core/constants/theme_tokens.dart';
import '../services/api_client.dart';
import '../models/weather_telemetry.dart';

class HomeDashboardScreen extends StatefulWidget {
  final VoidCallback onTriggerSos;
  final VoidCallback onOpenMap;

  const HomeDashboardScreen({
    super.key,
    required this.onTriggerSos,
    required this.onOpenMap,
  });

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  final ValueNotifier<WeatherTelemetry?> _telemetryNotifier = ValueNotifier<WeatherTelemetry?>(null);

  @override
  void initState() {
    super.initState();
    _refreshTelemetry();
  }

  @override
  void dispose() {
    _telemetryNotifier.dispose();
    super.dispose();
  }

  Future<void> _refreshTelemetry() async {
    final data = await AegisApiClient().fetchWeather(19.0760, 72.8777);
    _telemetryNotifier.value = data;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AegisTokens.background,
      appBar: AppBar(
        backgroundColor: AegisTokens.surface,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(color: AegisTokens.primaryRed.withOpacity(0.2), shape: BoxShape.circle),
              child: const Icon(Icons.shield, color: AegisTokens.primaryRed, size: 20),
            ),
            const SizedBox(width: 10),
            const Text("AEGIS ALERT", style: AegisTokens.titleStyle),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AegisTokens.primaryCyan),
            onPressed: _refreshTelemetry,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshTelemetry,
        color: AegisTokens.primaryCyan,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 1. Weather & Live Threat Hero Card (Leaf rebuild)
            ValueListenableBuilder<WeatherTelemetry?>(
              valueListenable: _telemetryNotifier,
              builder: (context, data, _) {
                if (data == null) {
                  return const SizedBox(
                    height: 160,
                    child: Center(child: CircularProgressIndicator(color: AegisTokens.primaryCyan)),
                  );
                }
                return Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AegisTokens.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AegisTokens.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("MUMBAI REGION", style: TextStyle(color: AegisTokens.textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
                              const SizedBox(height: 4),
                              Text("${data.temperature}°C", style: AegisTokens.metricLarge),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AegisTokens.warningOrange.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AegisTokens.warningOrange),
                            ),
                            child: Text(
                              "RISK: ${data.riskLevel}",
                              style: const TextStyle(color: AegisTokens.warningOrange, fontSize: 12, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _SensorMetric(icon: Icons.air, label: "Wind", value: "${data.windSpeed} km/h"),
                          _SensorMetric(icon: Icons.water_drop, label: "Humidity", value: "${data.humidity}%"),
                          _SensorMetric(icon: Icons.cloud, label: "AQI", value: "${data.aqi}"),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: 20),

            // 2. Quick Action Grid (Const Static Layout)
            Row(
              children: [
                Expanded(
                  child: _QuickActionCard(
                    title: "TRIGGER SOS",
                    subtitle: "Instant 0ms Response",
                    icon: Icons.crisis_alert_rounded,
                    color: AegisTokens.primaryRed,
                    onTap: widget.onTriggerSos,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickActionCard(
                    title: "EVAC MAP",
                    subtitle: "120Hz GIS Radar",
                    icon: Icons.map_rounded,
                    color: AegisTokens.primaryCyan,
                    onTap: widget.onOpenMap,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // 3. Security & Safety Advisory
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AegisTokens.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AegisTokens.border),
              ),
              child: const Row(
                children: [
                  Icon(Icons.offline_pin, color: AegisTokens.successGreen, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "Offline Mesh Mode is Active. If cellular networks drop, emergency beacons hop peer-to-peer over Bluetooth.",
                      style: TextStyle(color: AegisTokens.textSecondary, fontSize: 12, height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SensorMetric extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _SensorMetric({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AegisTokens.primaryCyan, size: 16),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 10)),
            Text(value, style: const TextStyle(color: AegisTokens.textPrimary, fontSize: 13, fontWeight: FontWeight.w700)),
          ],
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AegisTokens.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 32),
            const SizedBox(height: 12),
            Text(title, style: TextStyle(color: color, fontSize: 14, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
