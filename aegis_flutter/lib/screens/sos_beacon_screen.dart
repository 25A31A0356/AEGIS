import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/theme_tokens.dart';
import '../services/sos_service.dart';
import '../models/sos_beacon.dart';

class SosBeaconScreen extends StatefulWidget {
  const SosBeaconScreen({super.key});

  @override
  State<SosBeaconScreen> createState() => _SosBeaconScreenState();
}

class _SosBeaconScreenState extends State<SosBeaconScreen> with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  final ValueNotifier<SosBeacon?> _beaconNotifier = ValueNotifier<SosBeacon?>(null);
  String _selectedEmergencyType = "MEDICAL";

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _beaconNotifier.dispose();
    super.dispose();
  }

  void _triggerEagerSos() async {
    HapticFeedback.heavyImpact();
    final beacon = await SosService().triggerDistressBeacon(
      latitude: 19.0760,
      longitude: 72.8777,
      emergencyType: _selectedEmergencyType,
    );
    _beaconNotifier.value = beacon;
  }

  void _cancelSos() {
    HapticFeedback.lightImpact();
    _beaconNotifier.value = null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AegisTokens.background,
      appBar: AppBar(
        backgroundColor: AegisTokens.surface,
        elevation: 0,
        title: const Text("SOS Emergency Distress", style: AegisTokens.titleStyle),
      ),
      body: Column(
        children: [
          // Emergency Type Selector
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: ["MEDICAL", "FIRE", "FLOOD", "CRIME"].map((type) {
                final isSelected = _selectedEmergencyType == type;
                return ChoiceChip(
                  label: Text(type, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: isSelected ? Colors.white : AegisTokens.textSecondary)),
                  selected: isSelected,
                  selectedColor: AegisTokens.primaryRed,
                  backgroundColor: AegisTokens.surface,
                  onSelected: (val) {
                    if (val) setState(() => _selectedEmergencyType = type);
                  },
                );
              }).toList(),
            ),
          ),

          // Central SOS Physical Button (0ms Eager Touch)
          Expanded(
            child: Center(
              child: RepaintBoundary(
                child: Listener(
                  onPointerDown: (_) => _triggerEagerSos(),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Ambient Pulse Ring
                      AnimatedBuilder(
                        animation: _pulseController,
                        builder: (context, _) {
                          final scale = 1.0 + (_pulseController.value * 0.18);
                          final opacity = 0.35 - (_pulseController.value * 0.25);
                          return Transform.scale(
                            scale: scale,
                            child: Container(
                              width: 270,
                              height: 270,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: AegisTokens.primaryRed.withOpacity(opacity.clamp(0.0, 1.0)),
                                  width: 4,
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                      // Solid Physical Core
                      Container(
                        width: 200,
                        height: 200,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [Color(0xFFFF4D4D), Color(0xFF991B1B)],
                            center: Alignment(0.0, -0.3),
                          ),
                          boxShadow: AegisTokens.redGlow,
                        ),
                        child: const Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.crisis_alert, color: Colors.white, size: 56),
                              SizedBox(height: 6),
                              Text("SOS", style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900, letterSpacing: 2.0)),
                              Text("0ms TOUCH", style: TextStyle(color: Color(0xCCFFFFFF), fontSize: 10, fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // Status & Dispatch Feedback Card
          Padding(
            padding: const EdgeInsets.all(20),
            child: ValueListenableBuilder<SosBeacon?>(
              valueListenable: _beaconNotifier,
              builder: (context, beacon, _) {
                final isActive = beacon != null;
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isActive ? const Color(0x2CEF4444) : AegisTokens.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isActive ? AegisTokens.primaryRed : AegisTokens.border, width: isActive ? 2 : 1),
                  ),
                  child: Row(
                    children: [
                      Icon(isActive ? Icons.radar : Icons.shield_outlined, color: isActive ? AegisTokens.primaryRed : AegisTokens.successGreen, size: 28),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isActive ? "DISTRESS ACTIVE: ${beacon.emergencyType}" : "SYSTEM READY — STANDBY",
                              style: TextStyle(color: isActive ? AegisTokens.primaryRed : AegisTokens.textPrimary, fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              isActive ? "${beacon.respondersMatched} Responders Dispatched within 10km" : "Tap button instantly to transmit GPS distress beacon",
                              style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      if (isActive)
                        TextButton(
                          onPressed: _cancelSos,
                          style: TextButton.styleFrom(backgroundColor: AegisTokens.surfaceElevated, foregroundColor: Colors.white),
                          child: const Text("CANCEL"),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
