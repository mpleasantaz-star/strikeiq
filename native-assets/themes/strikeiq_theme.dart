import 'package:flutter/material.dart';

class StrikeIQColors {
  static const electricBlue = Color(0xFF0A84FF);
  static const neonBlue = Color(0xFF4CC9F0);
  static const deepNavy = Color(0xFF0B0F1A);
  static const trueBlack = Color(0xFF05070A);
  static const darkSlate = Color(0xFF1A2233);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
}

final strikeIQTheme = ThemeData(
  brightness: Brightness.dark,
  fontFamily: 'Inter',
  scaffoldBackgroundColor: StrikeIQColors.trueBlack,
  colorScheme: const ColorScheme.dark(
    primary: StrikeIQColors.electricBlue,
    secondary: StrikeIQColors.neonBlue,
    surface: StrikeIQColors.deepNavy,
    error: StrikeIQColors.error,
  ),
);
