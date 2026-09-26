import 'package:flutter/material.dart';

class AegisTokens {
  AegisTokens._();

  static const Color background = Color(0xFF0B0F19);
  static const Color surface = Color(0xFF151D2F);
  static const Color surfaceElevated = Color(0xFF1E293B);
  static const Color surfaceCard = Color(0xFF182234);
  static const Color primaryRed = Color(0xFFEF4444);
  static const Color primaryCyan = Color(0xFF06B6D4);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color successGreen = Color(0xFF10B981);
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color border = Color(0xFF334155);

  static const List<BoxShadow> redGlow = [
    BoxShadow(color: Color(0x66EF4444), blurRadius: 28, spreadRadius: 6),
  ];

  static const List<BoxShadow> cyanGlow = [
    BoxShadow(color: Color(0x6606B6D4), blurRadius: 20, spreadRadius: 2),
  ];

  static const TextStyle titleStyle = TextStyle(
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle metricLarge = TextStyle(
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: FontWeight.w800,
    color: textPrimary,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  static const TextStyle bodyStyle = TextStyle(
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: textSecondary,
  );
}
