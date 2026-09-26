import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/constants/theme_tokens.dart';

class SafeCheckinScreen extends StatefulWidget {
  const SafeCheckinScreen({super.key});

  @override
  State<SafeCheckinScreen> createState() => _SafeCheckinScreenState();
}

class _SafeCheckinScreenState extends State<SafeCheckinScreen> {
  bool _isCheckedIn = false;

  void _markSafe() {
    HapticFeedback.mediumImpact();
    setState(() {
      _isCheckedIn = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AegisTokens.background,
      appBar: AppBar(
        backgroundColor: AegisTokens.surface,
        elevation: 0,
        title: const Text("Safety Check-in", style: AegisTokens.titleStyle),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            // Status Hero
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: _isCheckedIn ? const Color(0x2210B981) : AegisTokens.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _isCheckedIn ? AegisTokens.successGreen : AegisTokens.border,
                  width: _isCheckedIn ? 2 : 1,
                ),
              ),
              child: Column(
                children: [
                  Icon(
                    _isCheckedIn ? Icons.check_circle_rounded : Icons.health_and_safety_rounded,
                    color: _isCheckedIn ? AegisTokens.successGreen : AegisTokens.warningOrange,
                    size: 64,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _isCheckedIn ? "YOU ARE MARKED SAFE" : "MARK YOUR SAFETY STATUS",
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AegisTokens.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isCheckedIn ? "Your family circle and emergency teams have received your verified check-in." : "Broadcasts your safety status to your emergency contacts and local disaster centers.",
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: _markSafe,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _isCheckedIn ? AegisTokens.surfaceElevated : AegisTokens.successGreen,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(_isCheckedIn ? "UPDATE CHECK-IN" : "I AM SAFE", style: const TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            // Family & Team Circle
            const Align(
              alignment: Alignment.centerLeft,
              child: Text("EMERGENCY CIRCLE", style: TextStyle(color: AegisTokens.textSecondary, fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1.0)),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: ListView(
                children: const [
                  _FamilyMemberTile(name: "Priya Sharma (Sister)", status: "SAFE", time: "5m ago", isSafe: true),
                  _FamilyMemberTile(name: "Rajesh Sharma (Father)", status: "SAFE", time: "12m ago", isSafe: true),
                  _FamilyMemberTile(name: "Anil Kumar (Colleague)", status: "PENDING", time: "Awaiting check-in", isSafe: false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FamilyMemberTile extends StatelessWidget {
  final String name;
  final String status;
  final String time;
  final bool isSafe;

  const _FamilyMemberTile({required this.name, required this.status, required this.time, required this.isSafe});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AegisTokens.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AegisTokens.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: isSafe ? AegisTokens.successGreen.withOpacity(0.2) : AegisTokens.warningOrange.withOpacity(0.2),
            child: Icon(isSafe ? Icons.check : Icons.access_time, color: isSafe ? AegisTokens.successGreen : AegisTokens.warningOrange, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.w700, color: AegisTokens.textPrimary, fontSize: 14)),
                Text(time, style: const TextStyle(color: AegisTokens.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Text(status, style: TextStyle(color: isSafe ? AegisTokens.successGreen : AegisTokens.warningOrange, fontWeight: FontWeight.w800, fontSize: 12)),
        ],
      ),
    );
  }
}
