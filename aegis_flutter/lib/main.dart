import 'package:flutter/material.dart';
import 'core/constants/theme_tokens.dart';
import 'screens/home_dashboard_screen.dart';
import 'screens/sos_beacon_screen.dart';
import 'screens/live_map_gis_screen.dart';
import 'screens/safe_checkin_screen.dart';
import 'screens/disaster_guide_screen.dart';
import 'screens/citizen_reports_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AegisFlutterApp());
}

class AegisFlutterApp extends StatelessWidget {
  const AegisFlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "AEGIS Alert 120 FPS",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AegisTokens.background,
        fontFamily: "Inter",
        useMaterial3: true,
      ),
      home: const AegisMainShell(),
    );
  }
}

class AegisMainShell extends StatefulWidget {
  const AegisMainShell({super.key});

  @override
  State<AegisMainShell> createState() => _AegisMainShellState();
}

class _AegisMainShellState extends State<AegisMainShell> {
  int _currentIndex = 0;

  void _switchTab(int index) {
    if (_currentIndex != index) {
      setState(() => _currentIndex = index);
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      HomeDashboardScreen(
        onTriggerSos: () => _switchTab(1),
        onOpenMap: () => _switchTab(2),
      ),
      const SosBeaconScreen(),
      const LiveMapGisScreen(),
      const SafeCheckinScreen(),
      const DisasterGuideScreen(),
      const CitizenReportsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AegisTokens.surface,
          border: Border(top: BorderSide(color: AegisTokens.border, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          backgroundColor: AegisTokens.surface,
          selectedItemColor: AegisTokens.primaryCyan,
          unselectedItemColor: AegisTokens.textSecondary,
          selectedFontSize: 11,
          unselectedFontSize: 11,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          onTap: _switchTab,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: "Overview"),
            BottomNavigationBarItem(icon: Icon(Icons.crisis_alert_rounded), label: "SOS"),
            BottomNavigationBarItem(icon: Icon(Icons.map_rounded), label: "Radar Map"),
            BottomNavigationBarItem(icon: Icon(Icons.verified_user_rounded), label: "Safe"),
            BottomNavigationBarItem(icon: Icon(Icons.menu_book_rounded), label: "Guides"),
            BottomNavigationBarItem(icon: Icon(Icons.campaign_rounded), label: "Reports"),
          ],
        ),
      ),
    );
  }
}
