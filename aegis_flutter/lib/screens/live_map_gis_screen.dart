import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/constants/theme_tokens.dart';

class LiveMapGisScreen extends StatefulWidget {
  const LiveMapGisScreen({super.key});

  @override
  State<LiveMapGisScreen> createState() => _LiveMapGisScreenState();
}

class _LiveMapGisScreenState extends State<LiveMapGisScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _sweepController;

  @override
  void initState() {
    super.initState();
    _sweepController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
  }

  @override
  void dispose() {
    _sweepController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AegisTokens.background,
      appBar: AppBar(
        backgroundColor: AegisTokens.surface,
        elevation: 0,
        title: const Text("GIS Evacuation & Radar Map", style: AegisTokens.titleStyle),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Center(
              child: Text("120 FPS / Impeller", style: TextStyle(color: AegisTokens.successGreen, fontSize: 11, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Static Range Grid Base
          const Positioned.fill(
            child: RepaintBoundary(
              child: _StaticMapGrid(),
            ),
          ),

          // 2. Isolated 120Hz Radar Sweep
          Positioned.fill(
            child: RepaintBoundary(
              child: AnimatedBuilder(
                animation: _sweepController,
                builder: (context, _) {
                  return CustomPaint(
                    painter: _MapSweepPainter(progress: _sweepController.value),
                  );
                },
              ),
            ),
          ),

          // 3. Top Floating Telemetry Overlay
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: AegisTokens.surface.withOpacity(0.92),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AegisTokens.border),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("TRACKING: 3 Flood Sectors", style: TextStyle(color: AegisTokens.textPrimary, fontSize: 12, fontWeight: FontWeight.w700)),
                  Text("GPS ACCURACY: ±3.4m", style: TextStyle(color: AegisTokens.primaryCyan, fontSize: 11, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StaticMapGrid extends StatelessWidget {
  const _StaticMapGrid();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _StaticMapGridPainter(),
    );
  }
}

class _StaticMapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = math.min(size.width, size.height) * 0.44;
    final ringPaint = Paint()
      ..color = const Color(0x2806B6D4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (int i = 1; i <= 4; i++) {
      canvas.drawCircle(center, maxRadius * (i / 4), ringPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _MapSweepPainter extends CustomPainter {
  final double progress;
  _MapSweepPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = math.min(size.width, size.height) * 0.44;
    final currentAngle = progress * 2.0 * math.pi;

    final sweepPaint = Paint()
      ..style = PaintingStyle.fill
      ..shader = SweepGradient(
        center: Alignment.center,
        startAngle: 0.0,
        endAngle: math.pi / 2,
        colors: const [Color(0x6606B6D4), Color(0x0006B6D4)],
        transform: GradientRotation(currentAngle - (math.pi / 2)),
      ).createShader(Rect.fromCircle(center: center, radius: maxRadius));

    canvas.drawCircle(center, maxRadius, sweepPaint);

    // Hazard Marker Blips
    final blipPaint = Paint()..color = AegisTokens.primaryRed;
    canvas.drawCircle(Offset(size.width * 0.38, size.height * 0.42), 8, blipPaint);
    canvas.drawCircle(Offset(size.width * 0.65, size.height * 0.62), 10, blipPaint);
  }

  @override
  bool shouldRepaint(covariant _MapSweepPainter oldDelegate) => oldDelegate.progress != progress;
}
